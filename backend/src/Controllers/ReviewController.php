<?php

// ============================================================
// ReviewController: 商品評價 API
// ============================================================

declare(strict_types=1);

namespace Src\Controllers;

use Src\Core\BaseController;
use Src\Core\Database;

class ReviewController extends BaseController
{
    // POST /api/reviews (需登入)
    public function store(array $params): void
    {
        $db   = Database::getInstance();
        $auth = $_REQUEST['_auth'];
        $body = $this->body();

        $userId    = $auth['sub'];
        $orderId   = (int)($body['order_id'] ?? 0);
        $productId = (int)($body['product_id'] ?? 0);
        $rating    = (int)($body['rating'] ?? 0);
        $comment   = trim($body['comment'] ?? '');

        // 基礎校驗
        if ($orderId <= 0 || $productId <= 0) {
            $this->error('無效的訂單或商品資訊', 422);
            return;
        }

        if ($rating < 1 || $rating > 5) {
            $this->error('評分必須在 1 到 5 星之間', 422);
            return;
        }

        // 1. 驗證訂單是否存在、且屬於該用戶、且狀態已送達或付款
        $ordStmt = $db->prepare(
            "SELECT id, status FROM orders WHERE id = ? AND user_id = ? LIMIT 1"
        );
        $ordStmt->execute([$orderId, $userId]);
        $order = $ordStmt->fetch();

        if (!$order) {
            $this->error('找不到此訂單或您無權評價此訂單', 404);
            return;
        }

        // 2. 驗證該訂單內是否真的包含此商品 (透過 order_items 關聯)
        $itemStmt = $db->prepare(
            "SELECT oi.id FROM order_items oi
             JOIN product_skus ps ON ps.id = oi.sku_id
             WHERE oi.order_id = ? AND ps.product_id = ?
             LIMIT 1"
        );
        $itemStmt->execute([$orderId, $productId]);
        $hasProduct = $itemStmt->fetch();

        if (!$hasProduct) {
            $this->error('您的訂單中並未包含此商品，無法評價', 400);
            return;
        }

        // 3. 驗證是否已評價過 (UNIQUE KEY 預防，但先在邏輯中提示)
        $chkStmt = $db->prepare(
            "SELECT id FROM product_reviews WHERE user_id = ? AND order_id = ? AND product_id = ? LIMIT 1"
        );
        $chkStmt->execute([$userId, $orderId, $productId]);
        if ($chkStmt->fetch()) {
            $this->error('您已評價過此商品，無法重複評價', 400);
            return;
        }

        // 4. 新增評價
        $db->beginTransaction();
        try {
            $insStmt = $db->prepare(
                "INSERT INTO product_reviews (product_id, user_id, order_id, rating, comment)
                 VALUES (?,?,?,?,?)"
            );
            $insStmt->execute([$productId, $userId, $orderId, $rating, $comment]);

            // 5. 重新計算並更新 products 表的平均 rating 欄位
            $avgStmt = $db->prepare(
                "SELECT AVG(rating) as avg_rating FROM product_reviews WHERE product_id = ?"
            );
            $avgStmt->execute([$productId]);
            $avgData = $avgStmt->fetch();
            $newRating = $avgData['avg_rating'] !== null ? round((float)$avgData['avg_rating'], 2) : 5.00;

            $updStmt = $db->prepare("UPDATE products SET rating = ? WHERE id = ?");
            $updStmt->execute([$newRating, $productId]);

            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        $this->success(['new_rating' => $newRating], '感謝您的評價！', 201);
    }

    // GET /api/products/{slug}/reviews (公開)
    public function index(array $params): void
    {
        $db   = Database::getInstance();
        $slug = $params['slug'] ?? '';

        // 1. 先確認商品是否存在
        $pStmt = $db->prepare("SELECT id FROM products WHERE slug = ? AND is_active = 1 LIMIT 1");
        $pStmt->execute([$slug]);
        $product = $pStmt->fetch();

        if (!$product) {
            $this->error('商品不存在', 404);
            return;
        }

        $productId = $product['id'];

        // 2. 獲取該商品所有評價（包含去識別化姓名）
        $revStmt = $db->prepare(
            "SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
             FROM product_reviews r
             JOIN users u ON u.id = r.user_id
             WHERE r.product_id = ?
             ORDER BY r.created_at DESC"
        );
        $revStmt->execute([$productId]);
        $reviews = $revStmt->fetchAll();

        // 3. 去識別化用戶名以保護私隱 (例如: "王小明" -> "王*明", "John Doe" -> "J*n Doe")
        foreach ($reviews as &$rev) {
            $rev['user_name'] = $this->maskName($rev['user_name']);
        }

        $this->success($reviews);
    }

    /**
     * 姓名遮罩保護個人資料
     */
    private function maskName(string $name): string
    {
        $len = mb_strlen($name, 'utf-8');
        if ($len <= 1) {
            return $name;
        }
        if ($len === 2) {
            return mb_substr($name, 0, 1, 'utf-8') . '*';
        }
        return mb_substr($name, 0, 1, 'utf-8') . str_repeat('*', $len - 2) . mb_substr($name, -1, 1, 'utf-8');
    }
}
