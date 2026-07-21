<?php

declare(strict_types=1);

namespace Src\Controllers;

use Src\Core\BaseController;
use Src\Core\Database;
use PDO;

class AdminOrderController extends BaseController
{
    // GET /api/admin/orders
    public function index(array $params): void
    {
        $db      = Database::getInstance();
        $status  = $this->query('status');
        $keyword = trim((string)$this->query('keyword', ''));
        $page    = max(1, (int)$this->query('page', 1));
        $limit   = 15;
        $offset  = ($page - 1) * $limit;

        $where = [];
        $bind  = [];

        if ($status) {
            $where[] = 'o.status = ?';
            $bind[]  = $status;
        }

        if ($keyword !== '') {
            $where[] = '(o.order_no LIKE ? OR o.ship_name LIKE ? OR u.email LIKE ? OR u.name LIKE ?)';
            $likeStr = '%' . $keyword . '%';
            $bind[]  = $likeStr;
            $bind[]  = $likeStr;
            $bind[]  = $likeStr;
            $bind[]  = $likeStr;
        }

        $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $db->prepare(
            "SELECT COUNT(*)
             FROM orders o
             LEFT JOIN users u ON u.id = o.user_id
             $whereSQL"
        );
        $countStmt->execute($bind);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $db->prepare(
            "SELECT o.id, o.order_no, o.subtotal, o.shipping_fee, o.discount, o.points_discount, o.total,
                    o.status, o.ship_name, o.ship_phone, o.ship_method, o.created_at,
                    u.name AS user_name, u.email AS user_email,
                    s.carrier AS shipping_carrier, s.tracking_no AS tracking_number
             FROM orders o
             LEFT JOIN users u ON u.id = o.user_id
             LEFT JOIN shipments s ON s.order_id = o.id
             $whereSQL
             ORDER BY o.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $stmt->execute([...$bind, $limit, $offset]);

        $this->success([
            'orders'     => $stmt->fetchAll(),
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'total_pages' => ceil($total / $limit)],
        ]);
    }

    // GET /api/admin/orders/{id}
    public function show(array $params): void
    {
        $db      = Database::getInstance();
        $orderId = (int)($params['id'] ?? 0);

        $stmt = $db->prepare(
            "SELECT o.*, u.name AS user_name, u.email AS user_email, c.code AS coupon_code,
                    s.carrier AS shipping_carrier, s.tracking_no AS tracking_number, s.shipped_at
             FROM orders o
             LEFT JOIN users u ON u.id = o.user_id
             LEFT JOIN coupons c ON c.id = o.coupon_id
             LEFT JOIN shipments s ON s.order_id = o.id
             WHERE o.id = ?"
        );
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        if (!$order) {
            $this->error('找不到該訂單', 404);
            return;
        }

        // 取得訂單細項 (Order Items)
        $itemsStmt = $db->prepare(
            "SELECT oi.*, p.cover_image_url
             FROM order_items oi
             LEFT JOIN product_skus ps ON ps.id = oi.sku_id
             LEFT JOIN products p ON p.id = ps.product_id
             WHERE oi.order_id = ?"
        );
        $itemsStmt->execute([$orderId]);
        $order['items'] = $itemsStmt->fetchAll();

        $this->success($order);
    }

    // PUT or PATCH /api/admin/orders/{id}
    public function updateStatus(array $params): void
    {
        $db      = Database::getInstance();
        $orderId = (int)($params['id'] ?? 0);
        $body    = $this->body();

        $newStatus       = $body['status'] ?? '';
        $shippingCarrier = trim((string)($body['shipping_carrier'] ?? ''));
        $trackingNumber  = trim((string)($body['tracking_number'] ?? ''));

        $validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
        if (!in_array($newStatus, $validStatuses, true)) {
            $this->error('無效的訂單狀態', 422);
            return;
        }

        // 取得舊訂單狀態
        $stmt = $db->prepare('SELECT id, order_no, user_id, status, points_discount FROM orders WHERE id = ?');
        $stmt->execute([$orderId]);
        $oldOrder = $stmt->fetch();

        if (!$oldOrder) {
            $this->error('找不到該訂單', 404);
            return;
        }

        $oldStatus = $oldOrder['status'];

        $db->beginTransaction();

        try {
            // 1. 更新訂單狀態
            $updateOrder = $db->prepare('UPDATE orders SET status = ? WHERE id = ?');
            $updateOrder->execute([$newStatus, $orderId]);

            // 2. 物流資訊更新 (若有提供或狀態變更為 shipped)
            if ($shippingCarrier !== '' || $trackingNumber !== '' || $newStatus === 'shipped') {
                $shipCheck = $db->prepare('SELECT id FROM shipments WHERE order_id = ?');
                $shipCheck->execute([$orderId]);
                $shipId = $shipCheck->fetchColumn();

                $carrierValue = $shippingCarrier !== '' ? $shippingCarrier : 't_cat';
                $shippedAt    = ($newStatus === 'shipped') ? date('Y-m-d H:i:s') : null;

                if ($shipId) {
                    $upShip = $db->prepare(
                        "UPDATE shipments
                         SET carrier = ?, tracking_no = ?, status = ?,
                             shipped_at = COALESCE(shipped_at, ?)
                         WHERE id = ?"
                    );
                    $upShip->execute([$carrierValue, $trackingNumber, $newStatus === 'shipped' ? 'shipped' : 'preparing', $shippedAt, $shipId]);
                } else {
                    $inShip = $db->prepare(
                        "INSERT INTO shipments (order_id, carrier, tracking_no, status, shipped_at)
                         VALUES (?, ?, ?, ?, ?)"
                    );
                    $inShip->execute([$orderId, $carrierValue, $trackingNumber, $newStatus === 'shipped' ? 'shipped' : 'preparing', $shippedAt]);
                }
            }

            // 3. 處理「取消訂單」之還原機制 (Stock & Points Rollback)
            if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                // A. 歸還 SKU 庫存
                $itemsStmt = $db->prepare('SELECT sku_id, quantity FROM order_items WHERE order_id = ?');
                $itemsStmt->execute([$orderId]);
                $items = $itemsStmt->fetchAll();

                foreach ($items as $item) {
                    $upStock = $db->prepare('UPDATE product_skus SET stock = stock + ? WHERE id = ?');
                    $upStock->execute([$item['quantity'], $item['sku_id']]);
                }

                // B. 退還紅利點數 (點數 1 點 = 1 元)
                $pointsDiscount = (float)($oldOrder['points_discount'] ?? 0);
                $userId         = (int)($oldOrder['user_id'] ?? 0);

                if ($pointsDiscount > 0 && $userId > 0) {
                    $pointsToReturn = (int)$pointsDiscount;

                    // 加回會員點數
                    $upPoints = $db->prepare('UPDATE users SET points = points + ? WHERE id = ?');
                    $upPoints->execute([$pointsToReturn, $userId]);

                    // 記錄紅利日誌
                    $inLog = $db->prepare(
                        "INSERT INTO point_logs (user_id, order_id, type, points, note)
                         VALUES (?, ?, 'earn', ?, ?)"
                    );
                    $inLog->execute([
                        $userId,
                        $orderId,
                        $pointsToReturn,
                        '訂單 ' . $oldOrder['order_no'] . ' 取消，退還紅利點數'
                    ]);
                }
            }

            $db->commit();
            $this->success(null, '訂單狀態已成功更新');

        } catch (\Throwable $e) {
            $db->rollBack();
            $this->error('更新失敗：' . $e->getMessage(), 500);
        }
    }
}
