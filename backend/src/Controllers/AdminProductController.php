<?php

declare(strict_types=1);

namespace Src\Controllers;

use Src\Core\BaseController;
use Src\Core\Database;

class AdminProductController extends BaseController
{
    // GET /api/admin/products
    public function index(array $params): void
    {
        $db = Database::getInstance();
        $catNameField = $this->getCategoryNameSQL('c');
        $stmt = $db->query(
            "SELECT p.id, p.name, p.slug, p.base_price, p.is_active, p.is_featured, p.cover_image_url,
                    {$catNameField} AS category_name, p.created_at, p.category_id,
                    (SELECT SUM(stock) FROM product_skus ps WHERE ps.product_id = p.id) AS total_stock
             FROM products p
             JOIN categories c ON c.id = p.category_id
             ORDER BY p.created_at DESC"
        );
        $this->success($stmt->fetchAll());
    }

    // GET /api/admin/products/{id}
    public function show(array $params): void
    {
        $db        = Database::getInstance();
        $productId = (int)($params['id'] ?? 0);

        $stmt = $db->prepare("SELECT * FROM products WHERE id = ? LIMIT 1");
        $stmt->execute([$productId]);
        $product = $stmt->fetch();

        if (!$product) {
            $this->error('找不到該商品', 404);
            return;
        }

        // 獲取該商品之 SKUs
        $skuStmt = $db->prepare("SELECT * FROM product_skus WHERE product_id = ?");
        $skuStmt->execute([$productId]);
        $product['skus'] = $skuStmt->fetchAll();

        $this->success($product);
    }

    // POST /api/admin/products
    public function store(array $params): void
    {
        $db   = Database::getInstance();
        $body = $this->body();

        $required = ['category_id', 'name', 'base_price'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                $this->error("$field 必填", 422);
                return;
            }
        }

        $slug = $this->generateSlug($body['name']);

        $db->prepare(
            'INSERT INTO products (category_id, name, slug, description, base_price, compare_price, cover_image_url, is_active, is_featured, meta_title, meta_desc)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $body['category_id'],
            $body['name'],
            $slug,
            $body['description'] ?? null,
            $body['base_price'],
            $body['compare_price'] ?? null,
            $body['cover_image_url'] ?? null,
            isset($body['is_active'])   ? (int)$body['is_active']   : 1,
            isset($body['is_featured']) ? (int)$body['is_featured'] : 0,
            $body['meta_title'] ?? $body['name'],
            $body['meta_desc']  ?? null,
        ]);

        $productId = (int)$db->lastInsertId();

        // 批量新增 SKU
        if (!empty($body['skus']) && is_array($body['skus'])) {
            foreach ($body['skus'] as $sku) {
                $db->prepare(
                    'INSERT INTO product_skus (product_id, sku_code, color, size, price, stock) VALUES (?,?,?,?,?,?)'
                )->execute([
                    $productId,
                    $sku['sku_code'] ?? $slug . '-' . ($sku['color'] ?? '') . '-' . ($sku['size'] ?? ''),
                    $sku['color']    ?? null,
                    $sku['size']     ?? null,
                    $sku['price']    ?? $body['base_price'],
                    $sku['stock']    ?? 0,
                ]);
            }
        }

        $this->success(['id' => $productId], '商品已建立', 201);
    }

    // PUT /api/admin/products/{id}
    public function update(array $params): void
    {
        $db        = Database::getInstance();
        $productId = (int)($params['id'] ?? 0);
        $body      = $this->body();

        // 1. 檢查商品是否存在
        $chk = $db->prepare('SELECT id, slug FROM products WHERE id = ?');
        $chk->execute([$productId]);
        $prod = $chk->fetch();
        if (!$prod) {
            $this->error('商品不存在', 404);
            return;
        }

        // 獲取更新前的價格與庫存狀態
        $oldProdStmt = $db->prepare('SELECT base_price FROM products WHERE id = ?');
        $oldProdStmt->execute([$productId]);
        $oldPrice = (float)$oldProdStmt->fetchColumn();

        $oldStockStmt = $db->prepare('SELECT SUM(stock) FROM product_skus WHERE product_id = ? AND is_active = 1');
        $oldStockStmt->execute([$productId]);
        $oldStock = (int)$oldStockStmt->fetchColumn();

        $allowed = ['category_id','name','description','base_price','compare_price',
                    'cover_image_url','is_active','is_featured','meta_title','meta_desc'];
        $set     = [];
        $bind    = [];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $body)) {
                $set[]  = "$field = ?";
                $bind[] = $body[$field];
            }
        }

        $db->beginTransaction();
        try {
            // 更新商品基本資訊
            if (!empty($set)) {
                $bind[] = $productId;
                $db->prepare('UPDATE products SET ' . implode(', ', $set) . ' WHERE id = ?')->execute($bind);
            }

            // 2. SKU Upsert 處理
            if (isset($body['skus']) && is_array($body['skus'])) {
                $incomingIds = [];

                foreach ($body['skus'] as $sku) {
                    $skuId = isset($sku['id']) ? (int)$sku['id'] : 0;
                    if ($skuId > 0) {
                        // 更新現有 SKU
                        $db->prepare(
                            "UPDATE product_skus
                             SET sku_code = ?, color = ?, size = ?, price = ?, stock = ?, is_active = ?
                             WHERE id = ? AND product_id = ?"
                        )->execute([
                            $sku['sku_code'],
                            $sku['color'] ?? null,
                            $sku['size'] ?? null,
                            $sku['price'],
                            $sku['stock'],
                            isset($sku['is_active']) ? (int)$sku['is_active'] : 1,
                            $skuId,
                            $productId
                        ]);
                        $incomingIds[] = $skuId;
                    } else {
                        // 新增 SKU
                        $newCode = $sku['sku_code'] ?: $prod['slug'] . '-' . ($sku['color'] ?? '') . '-' . ($sku['size'] ?? '') . '-' . substr(uniqid(), -4);
                        $db->prepare(
                            "INSERT INTO product_skus (product_id, sku_code, color, size, price, stock, is_active)
                             VALUES (?,?,?,?,?,?,?)"
                        )->execute([
                            $productId,
                            $newCode,
                            $sku['color'] ?? null,
                            $sku['size'] ?? null,
                            $sku['price'] ?? ($body['base_price'] ?? 0),
                            $sku['stock'] ?? 0,
                            isset($sku['is_active']) ? (int)$sku['is_active'] : 1
                        ]);
                        $incomingIds[] = (int)$db->lastInsertId();
                    }
                }

                // 3. 處理「沒被傳入」的舊 SKU (安全下架或刪除)
                // 找出目前 DB 裡的所有舊 SKU ID
                $oldStmt = $db->prepare("SELECT id FROM product_skus WHERE product_id = ?");
                $oldStmt->execute([$productId]);
                $oldIds = $oldStmt->fetchAll(\PDO::FETCH_COLUMN);

                $toRemove = array_diff($oldIds, $incomingIds);
                foreach ($toRemove as $remId) {
                    // 檢查此 SKU 是否已被歷史訂單引用
                    $refStmt = $db->prepare("SELECT COUNT(*) FROM order_items WHERE sku_id = ?");
                    $refStmt->execute([$remId]);
                    $isReferenced = (int)$refStmt->fetchColumn() > 0;

                    if ($isReferenced) {
                        // 如果被訂單引用，改為下架狀態 is_active = 0
                        $db->prepare("UPDATE product_skus SET is_active = 0 WHERE id = ?")->execute([$remId]);
                    } else {
                        // 否則，直接安全刪除
                        $db->prepare("DELETE FROM product_skus WHERE id = ?")->execute([$remId]);
                    }
                }
            }

            $db->commit();

            // 查詢更新後的狀態
            $newPrice = isset($body['base_price']) ? (float)$body['base_price'] : $oldPrice;

            $newStockStmt = $db->prepare('SELECT SUM(stock) FROM product_skus WHERE product_id = ? AND is_active = 1');
            $newStockStmt->execute([$productId]);
            $newStock = (int)$newStockStmt->fetchColumn();

            // 觸發降價通知：新價格低於舊價格
            if ($newPrice < $oldPrice) {
                \Src\Services\NotificationService::triggerPriceDropAlert($productId, $oldPrice, $newPrice);
            }

            // 觸發補貨通知：舊庫存為 0，且新庫存大於 0
            if ($oldStock === 0 && $newStock > 0) {
                \Src\Services\NotificationService::triggerRestockAlert($productId);
            }
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        $this->success(null, '商品及規格更新成功');
    }

    // DELETE /api/admin/products/{id}
    public function destroy(array $params): void
    {
        $db        = Database::getInstance();
        $productId = (int)($params['id'] ?? 0);

        // 軟刪除：標記為停售
        $db->prepare('UPDATE products SET is_active = 0 WHERE id = ?')->execute([$productId]);
        $this->success(null, '商品已下架');
    }

    // ── 輔助 ────────────────────────────────────────────────

    private function generateSlug(string $name): string
    {
        $slug = strtolower(preg_replace('/[^a-zA-Z0-9\-]/', '-', $name));
        $slug = preg_replace('/-+/', '-', trim($slug, '-'));
        return $slug . '-' . substr(uniqid(), -6);
    }
}
