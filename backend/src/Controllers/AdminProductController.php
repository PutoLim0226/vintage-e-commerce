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
        $stmt = $db->query(
            "SELECT p.id, p.name, p.slug, p.base_price, p.is_active, p.is_featured,
                    c.name AS category_name, p.created_at,
                    (SELECT SUM(stock) FROM product_skus ps WHERE ps.product_id = p.id) AS total_stock
             FROM products p
             JOIN categories c ON c.id = p.category_id
             ORDER BY p.created_at DESC"
        );
        $this->success($stmt->fetchAll());
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
            'INSERT INTO products (category_id, name, slug, description, base_price, compare_price, is_active, is_featured, meta_title, meta_desc)
             VALUES (?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $body['category_id'],
            $body['name'],
            $slug,
            $body['description'] ?? null,
            $body['base_price'],
            $body['compare_price'] ?? null,
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

        if (empty($set)) {
            $this->error('沒有可更新的欄位', 400);
            return;
        }

        $bind[] = $productId;
        $db->prepare('UPDATE products SET ' . implode(', ', $set) . ' WHERE id = ?')->execute($bind);

        $this->success(null, '商品已更新');
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
