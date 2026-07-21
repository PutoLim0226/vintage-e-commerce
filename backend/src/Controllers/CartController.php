<?php

// ============================================================
// CartController: 購物車（訪客 + 會員共用，session_key 機制）
// ============================================================

declare(strict_types=1);

namespace Src\Controllers;

use Src\Core\BaseController;
use Src\Core\Database;

class CartController extends BaseController
{
    // GET /api/cart
    public function index(array $params): void
    {
        $db     = Database::getInstance();
        $cartId = $this->resolveCartId($db, false);

        if (!$cartId) {
            $this->success(['items' => [], 'total' => 0]);
            return;
        }

        $stmt = $db->prepare(
            "SELECT ci.id, ci.quantity,
                    ps.id AS sku_id, ps.color, ps.size, ps.price, ps.stock,
                    p.name AS product_name, p.slug AS product_slug,
                    p.cover_image_url
             FROM cart_items ci
             JOIN product_skus ps ON ps.id = ci.sku_id
             JOIN products p      ON p.id  = ps.product_id
             WHERE ci.cart_id = ? AND p.is_active = 1 AND ps.is_active = 1"
        );
        $stmt->execute([$cartId]);
        $items = $stmt->fetchAll();

        $total = array_reduce($items, fn($carry, $item) => $carry + $item['price'] * $item['quantity'], 0);

        $this->success(['items' => $items, 'total' => round($total, 2)]);
    }

    // POST /api/cart/items
    public function addItem(array $params): void
    {
        $body   = $this->body();
        $skuId  = (int)($body['sku_id']   ?? 0);
        $qty    = (int)($body['quantity'] ?? 1);
        $db     = Database::getInstance();

        if (!$skuId || $qty < 1) {
            $this->error('sku_id 與 quantity 必填', 422);
            return;
        }

        // 確認 SKU 存在且有庫存
        $sku = $db->prepare('SELECT stock FROM product_skus WHERE id = ? AND is_active = 1 LIMIT 1');
        $sku->execute([$skuId]);
        $skuRow = $sku->fetch();

        if (!$skuRow) {
            $this->error('商品規格不存在', 404);
            return;
        }
        if ($skuRow['stock'] < $qty) {
            $this->error('庫存不足', 400);
            return;
        }

        $cartId = $this->resolveCartId($db, true);

        // INSERT OR UPDATE（若同 SKU 已在購物車則累加）
        $stmt = $db->prepare(
            'INSERT INTO cart_items (cart_id, sku_id, quantity)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)'
        );
        $stmt->execute([$cartId, $skuId, $qty]);

        $this->success(null, '已加入購物車', 201);
    }

    // PATCH /api/cart/items/{id}
    public function updateItem(array $params): void
    {
        $itemId = (int)($params['id'] ?? 0);
        $body   = $this->body();
        $qty    = (int)($body['quantity'] ?? 0);

        if ($qty < 0) {
            $this->error('數量不可為負', 422);
            return;
        }

        $db     = Database::getInstance();
        $cartId = $this->resolveCartId($db, false);

        if ($qty === 0) {
            $db->prepare('DELETE FROM cart_items WHERE id = ? AND cart_id = ?')->execute([$itemId, $cartId]);
        } else {
            $db->prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?')
               ->execute([$qty, $itemId, $cartId]);
        }

        $this->success(null, '已更新');
    }

    // DELETE /api/cart/items/{id}
    public function removeItem(array $params): void
    {
        $itemId = (int)($params['id'] ?? 0);
        $db     = Database::getInstance();
        $cartId = $this->resolveCartId($db, false);

        $db->prepare('DELETE FROM cart_items WHERE id = ? AND cart_id = ?')->execute([$itemId, $cartId]);
        $this->success(null, '已移除');
    }

    // ── 私有輔助 ────────────────────────────────────────────

    /**
     * 解析或建立購物車 ID
     * 優先使用 JWT（會員），若之前用 session_key (X-Cart-Token) 建立了購物車，自動關聯至該會員 user_id
     */
    private function resolveCartId(\PDO $db, bool $createIfMissing): ?int
    {
        $auth       = $_REQUEST['_auth'] ?? null;
        $sessionKey = $_SERVER['HTTP_X_CART_TOKEN'] ?? null;

        if ($auth) {
            // 會員購物車
            $stmt = $db->prepare('SELECT id FROM carts WHERE user_id = ? LIMIT 1');
            $stmt->execute([$auth['sub']]);
            $row = $stmt->fetch();

            if ($row) return (int)$row['id'];

            // 自動將 session_key 購物車關聯至會員 user_id
            if ($sessionKey) {
                $sessionCart = $db->prepare('SELECT id FROM carts WHERE session_key = ? LIMIT 1');
                $sessionCart->execute([$sessionKey]);
                $sRow = $sessionCart->fetch();
                if ($sRow) {
                    $db->prepare('UPDATE carts SET user_id = ? WHERE id = ?')->execute([$auth['sub'], $sRow['id']]);
                    return (int)$sRow['id'];
                }
            }

            if (!$createIfMissing) return null;

            $db->prepare('INSERT INTO carts (user_id) VALUES (?)')->execute([$auth['sub']]);
            return (int)$db->lastInsertId();
        }

        if ($sessionKey) {
            // 訪客購物車
            $stmt = $db->prepare('SELECT id FROM carts WHERE session_key = ? LIMIT 1');
            $stmt->execute([$sessionKey]);
            $row = $stmt->fetch();

            if ($row) return (int)$row['id'];
            if (!$createIfMissing) return null;

            $db->prepare('INSERT INTO carts (session_key) VALUES (?)')->execute([$sessionKey]);
            return (int)$db->lastInsertId();
        }

        if (!$createIfMissing) return null;

        // 若無 JWT 且無 X-Cart-Token Header，自動產生訪客 session_key 建立購物車防呆
        $newSessionKey = 'guest_' . bin2hex(random_bytes(16));
        $db->prepare('INSERT INTO carts (session_key) VALUES (?)')->execute([$newSessionKey]);
        $newCartId = (int)$db->lastInsertId();
        header('X-Cart-Token: ' . $newSessionKey);
        return $newCartId;
    }
}
