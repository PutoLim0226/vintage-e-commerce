<?php

// ============================================================
// WishlistController: 會員商品收藏管理
// ============================================================

declare(strict_types=1);

namespace Src\Controllers;

use Src\Core\BaseController;
use Src\Core\Database;

class WishlistController extends BaseController
{
    // GET /api/wishlist
    public function index(array $params): void
    {
        $db = Database::getInstance();
        $userId = $_REQUEST['_auth']['sub'] ?? 0;

        $stmt = $db->prepare(
            "SELECT p.id, p.name, p.slug, p.base_price, p.compare_price,
                    p.cover_image_url, p.rating, p.view_count,
                    c.name AS category_name, c.slug AS category_slug
             FROM wishlists w
             JOIN products p      ON p.id = w.product_id
             JOIN categories c    ON c.id = p.category_id
             WHERE w.user_id = ? AND p.is_active = 1
             ORDER BY w.created_at DESC"
        );
        $stmt->execute([$userId]);
        $products = $stmt->fetchAll();

        $this->success($products);
    }

    // POST /api/wishlist/toggle
    public function toggle(array $params): void
    {
        $db = Database::getInstance();
        $userId = $_REQUEST['_auth']['sub'] ?? 0;
        $body = $this->body();
        $productId = (int)($body['product_id'] ?? 0);

        if (!$productId) {
            $this->error('product_id 必填', 422);
            return;
        }

        // 檢查商品是否存在
        $prod = $db->prepare('SELECT id FROM products WHERE id = ? LIMIT 1');
        $prod->execute([$productId]);
        if (!$prod->fetch()) {
            $this->error('商品不存在', 404);
            return;
        }

        // 檢查是否已收藏
        $check = $db->prepare('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ? LIMIT 1');
        $check->execute([$userId, $productId]);
        $row = $check->fetch();

        if ($row) {
            // 已收藏，執行刪除
            $del = $db->prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?');
            $del->execute([$userId, $productId]);
            $this->success(['is_wishlisted' => false], '已取消收藏');
        } else {
            // 未收藏，執行寫入
            $ins = $db->prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)');
            $ins->execute([$userId, $productId]);
            $this->success(['is_wishlisted' => true], '已加入收藏');
        }
    }
}
