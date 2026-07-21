<?php

// ============================================================
// OrderController: 建立訂單 + 查詢 + Payment Webhook
// ============================================================

declare(strict_types=1);

namespace Src\Controllers;

use Src\Core\BaseController;
use Src\Core\Database;

class OrderController extends BaseController
{
    // POST /api/orders（需登入）
    public function create(array $params): void
    {
        $db   = Database::getInstance();
        $auth = $_REQUEST['_auth'];
        $body = $this->body();

        // 必填欄位驗證
        $required = ['ship_name', 'ship_phone', 'ship_city', 'ship_district', 'ship_address'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                $this->error("$field 必填", 422);
                return;
            }
        }

        // 取得購物車
        $cartStmt = $db->prepare('SELECT id FROM carts WHERE user_id = ? LIMIT 1');
        $cartStmt->execute([$auth['sub']]);
        $cart = $cartStmt->fetch();

        // 備援支援：若尚未依 user_id 建立，自動連結傳入之 X-Cart-Token 訪客購物車
        if (!$cart && !empty($_SERVER['HTTP_X_CART_TOKEN'])) {
            $sessionKey = $_SERVER['HTTP_X_CART_TOKEN'];
            $sCartStmt = $db->prepare('SELECT id FROM carts WHERE session_key = ? LIMIT 1');
            $sCartStmt->execute([$sessionKey]);
            $sCart = $sCartStmt->fetch();
            if ($sCart) {
                $db->prepare('UPDATE carts SET user_id = ? WHERE id = ?')->execute([$auth['sub'], $sCart['id']]);
                $cart = $sCart;
            }
        }

        if (!$cart) {
            $this->error('購物車是空的', 400);
            return;
        }

        $itemStmt = $db->prepare(
            "SELECT ci.quantity, ps.id AS sku_id, ps.price, ps.stock, ps.color, ps.size,
                    p.name AS product_name
             FROM cart_items ci
             JOIN product_skus ps ON ps.id = ci.sku_id
             JOIN products p      ON p.id  = ps.product_id
             WHERE ci.cart_id = ? AND p.is_active = 1 AND ps.is_active = 1"
        );
        $itemStmt->execute([$cart['id']]);
        $cartItems = $itemStmt->fetchAll();

        if (empty($cartItems)) {
            $this->error('購物車是空的', 400);
            return;
        }

        // 庫存檢查
        foreach ($cartItems as $item) {
            if ($item['stock'] < $item['quantity']) {
                $this->error("「{$item['product_name']}」庫存不足", 400);
                return;
            }
        }

        // 計算金額
        $subtotal = array_reduce(
            $cartItems,
            fn($carry, $item) => $carry + $item['price'] * $item['quantity'],
            0.0
        );

        // 折價券
        $discount  = 0.0;
        $couponId  = null;
        $couponCode = $body['coupon_code'] ?? null;

        if ($couponCode) {
            $cpStmt = $db->prepare(
                "SELECT * FROM coupons
                 WHERE code = ? AND is_active = 1
                   AND (starts_at IS NULL OR starts_at <= NOW())
                   AND (expires_at IS NULL OR expires_at >= NOW())
                   AND (usage_limit IS NULL OR used_count < usage_limit)
                 LIMIT 1"
            );
            $cpStmt->execute([$couponCode]);
            $coupon = $cpStmt->fetch();

            if ($coupon && $subtotal >= $coupon['min_order']) {
                $couponId = $coupon['id'];
                $discount = $coupon['type'] === 'fixed'
                    ? (float)$coupon['value']
                    : min($subtotal * $coupon['value'] / 100, (float)($coupon['max_discount'] ?? PHP_FLOAT_MAX));
            }
        }

        // 紅利點數折抵
        $pointsDiscount = 0.0;
        $usePoints = !empty($body['use_points']);
        if ($usePoints) {
            $uStmt = $db->prepare('SELECT points FROM users WHERE id = ? LIMIT 1');
            $uStmt->execute([$auth['sub']]);
            $userObj = $uStmt->fetch();
            if ($userObj && $userObj['points'] > 0) {
                // 1 點折抵 1 元，折抵金額不能超過商品金額扣減折價券後的額度
                $pointsDiscount = (float)min($userObj['points'], (int)floor($subtotal - $discount));
            }
        }

        $shippingFee = $this->calcShipping($body['ship_method'] ?? 'home_delivery', $subtotal);
        $total       = max(0, $subtotal - $discount - $pointsDiscount + $shippingFee);

        // 產生訂單編號
        $orderNo = 'VC-' . date('Ymd') . '-' . str_pad((string)random_int(1, 99999), 5, '0', STR_PAD_LEFT);

        // 開始 Transaction
        $db->beginTransaction();
        try {
            // 建立訂單
            $orderStmt = $db->prepare(
                "INSERT INTO orders
                    (order_no, user_id, coupon_id, subtotal, shipping_fee, discount, points_discount, total,
                     ship_name, ship_phone, ship_zip, ship_city, ship_district, ship_address, ship_method, notes)
                  VALUES
                    (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
            );
            $orderStmt->execute([
                $orderNo, $auth['sub'], $couponId,
                $subtotal, $shippingFee, $discount, $pointsDiscount, $total,
                $body['ship_name'], $body['ship_phone'],
                $body['ship_zip'] ?? '',
                $body['ship_city'], $body['ship_district'], $body['ship_address'],
                $body['ship_method'] ?? 'home_delivery',
                $body['notes'] ?? null,
            ]);
            $orderId = (int)$db->lastInsertId();

            // 建立訂單明細 + 扣庫存
            foreach ($cartItems as $item) {
                $db->prepare(
                    "INSERT INTO order_items (order_id, sku_id, product_name, sku_color, sku_size, unit_price, quantity, subtotal)
                     VALUES (?,?,?,?,?,?,?,?)"
                )->execute([
                    $orderId, $item['sku_id'], $item['product_name'],
                    $item['color'], $item['size'],
                    $item['price'], $item['quantity'],
                    $item['price'] * $item['quantity'],
                ]);

                $db->prepare('UPDATE product_skus SET stock = stock - ? WHERE id = ?')
                   ->execute([$item['quantity'], $item['sku_id']]);
            }

            // 折價券使用次數 +1
            if ($couponId) {
                $db->prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?')->execute([$couponId]);
            }

            // 清空購物車
            $db->prepare('DELETE FROM cart_items WHERE cart_id = ?')->execute([$cart['id']]);

            // 初始化金流記錄為 pending
            $db->prepare(
                "INSERT INTO payments (order_id, gateway, method, amount, status)
                 VALUES (?, 'ecpay', 'credit_card', ?, 'pending')"
            )->execute([$orderId, $total]);

            // 扣除已使用的紅利點數
            if ($pointsDiscount > 0) {
                $db->prepare('UPDATE users SET points = points - ? WHERE id = ?')
                   ->execute([(int)$pointsDiscount, $auth['sub']]);

                $db->prepare(
                    'INSERT INTO point_logs (user_id, order_id, type, points, note) VALUES (?,?,?,?,?)'
                )->execute([$auth['sub'], $orderId, 'redeem', -(int)$pointsDiscount, '結帳折抵金額']);
            }

            // 紅利：每 100 元得 1 點
            $earnPoints = (int)floor($total / 100);
            if ($earnPoints > 0) {
                $db->prepare(
                    'INSERT INTO point_logs (user_id, order_id, type, points, note) VALUES (?,?,?,?,?)'
                )->execute([$auth['sub'], $orderId, 'earn', $earnPoints, '消費回饋點數']);

                $db->prepare('UPDATE users SET points = points + ? WHERE id = ?')
                   ->execute([$earnPoints, $auth['sub']]);
            }

            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        $this->success(['order_no' => $orderNo, 'total' => $total], '訂單建立成功', 201);
    }

    // GET /api/orders/{order_no}（需登入）
    public function show(array $params): void
    {
        $db   = Database::getInstance();
        $auth = $_REQUEST['_auth'];

        $stmt = $db->prepare('SELECT * FROM orders WHERE order_no = ? AND user_id = ? LIMIT 1');
        $stmt->execute([$params['order_no'], $auth['sub']]);
        $order = $stmt->fetch();

        if (!$order) {
            $this->error('訂單不存在', 404);
            return;
        }

        $itemStmt = $db->prepare(
            "SELECT oi.*, ps.product_id,
                    (SELECT COUNT(*) FROM product_reviews pr
                     WHERE pr.order_id = oi.order_id
                       AND pr.product_id = ps.product_id) AS has_review
             FROM order_items oi
             JOIN product_skus ps ON ps.id = oi.sku_id
             WHERE oi.order_id = ?"
        );
        $itemStmt->execute([$order['id']]);
        $order['items'] = $itemStmt->fetchAll();

        $this->success($order);
    }

    // POST /api/webhook/payment（金流商回呼，無需驗證）
    public function paymentWebhook(array $params): void
    {
        $raw  = file_get_contents('php://input');
        $data = json_decode($raw, true) ?? [];

        $orderNo = $data['MerchantOrderNo'] ?? $data['order_no'] ?? null;
        $status  = ($data['Status'] ?? $data['status'] ?? '') === 'success' || ($data['Status'] ?? '') === 'SUCCESS' ? 'success' : 'failed';

        if (!$orderNo) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Bad Request']);
            return;
        }

        $db = Database::getInstance();
        $db->prepare('UPDATE payments SET status = ?, raw_response = ?, paid_at = IF(? = "success", NOW(), NULL) WHERE order_id = (SELECT id FROM orders WHERE order_no = ? LIMIT 1)')
           ->execute([$status, $raw, $status, $orderNo]);

        if ($status === 'success') {
            $db->prepare("UPDATE orders SET status = 'paid' WHERE order_no = ? AND status = 'pending'")
               ->execute([$orderNo]);
        }

        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'OK']);
    }

    // POST /api/coupons/check (需登入)
    public function checkCoupon(array $params): void
    {
        $db   = Database::getInstance();
        $body = $this->body();

        $couponCode = $body['coupon_code'] ?? $body['code'] ?? '';
        $subtotal   = (float)($body['subtotal'] ?? 0.0);

        if (empty($couponCode)) {
            $this->error('請輸入折價券代碼', 422);
            return;
        }

        $cpStmt = $db->prepare(
            "SELECT * FROM coupons
             WHERE code = ? AND is_active = 1
               AND (starts_at IS NULL OR starts_at <= NOW())
               AND (expires_at IS NULL OR expires_at >= NOW())
               AND (usage_limit IS NULL OR used_count < usage_limit)
             LIMIT 1"
        );
        $cpStmt->execute([$couponCode]);
        $coupon = $cpStmt->fetch();

        if (!$coupon) {
            $this->error('折價券無效、不存在或已過期', 400);
            return;
        }

        if ($subtotal < (float)$coupon['min_order']) {
            $this->error("未達該折價券最低消費門檻 (NT$ " . (int)$coupon['min_order'] . ")", 400);
            return;
        }

        $discount = $coupon['type'] === 'fixed'
            ? (float)$coupon['value']
            : min($subtotal * $coupon['value'] / 100, (float)($coupon['max_discount'] ?? PHP_FLOAT_MAX));

        $this->success([
            'coupon_id'   => $coupon['id'],
            'code'        => $coupon['code'],
            'type'        => $coupon['type'],
            'value'       => (float)$coupon['value'],
            'discount'    => $discount,
            'min_order'   => (float)$coupon['min_order'],
        ], '折價券驗證成功');
    }

    // ── 運費計算 ────────────────────────────────────────────

    private function calcShipping(string $method, float $subtotal): float
    {
        // 滿 1500 免運（宅配）
        if ($method === 'home_delivery') {
            return $subtotal >= 1500 ? 0 : 120;
        }
        // 超商一律 60
        return 60;
    }
}
