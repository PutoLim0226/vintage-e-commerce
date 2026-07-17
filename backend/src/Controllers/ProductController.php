<?php

// ============================================================
// ProductController: 商品列表 + 詳情（公開 API）
// ============================================================

declare(strict_types=1);

namespace Src\Controllers;

use Src\Core\BaseController;
use Src\Core\Database;

class ProductController extends BaseController
{
    // GET /api/products
    // 支援: ?category=slug &search=keyword &sort=price_asc|price_desc|newest &page=1 &limit=12
    public function index(array $params): void
    {
        $db = Database::getInstance();

        $categorySlug = $this->query('category');
        $search       = $this->query('search');
        $sort         = $this->query('sort', 'newest');
        $page         = max(1, (int)$this->query('page', 1));
        $limit        = min(48, max(1, (int)$this->query('limit', 12)));
        $offset       = ($page - 1) * $limit;

        $where  = ['p.is_active = 1'];
        $bind   = [];

        if ($categorySlug) {
            $where[] = 'c.slug = ?';
            $bind[]  = $categorySlug;
        }

        if ($search) {
            $where[] = '(p.name LIKE ? OR p.description LIKE ?)';
            $bind[]  = "%$search%";
            $bind[]  = "%$search%";
        }

        $whereSQL = implode(' AND ', $where);

        $orderSQL = match($sort) {
            'price_asc'  => 'p.base_price ASC',
            'price_desc' => 'p.base_price DESC',
            default      => 'p.created_at DESC',
        };

        // 計算總數
        $countStmt = $db->prepare(
            "SELECT COUNT(*) FROM products p
             JOIN categories c ON c.id = p.category_id
             WHERE $whereSQL"
        );
        $countStmt->execute($bind);
        $total = (int)$countStmt->fetchColumn();

        // 查詢商品
        $stmt = $db->prepare(
            "SELECT p.id, p.name, p.slug, p.base_price, p.compare_price,
                    p.cover_image_url, p.is_featured,
                    c.name AS category_name, c.slug AS category_slug
             FROM products p
             JOIN categories c ON c.id = p.category_id
             WHERE $whereSQL
             ORDER BY $orderSQL
             LIMIT ? OFFSET ?"
        );
        $stmt->execute([...$bind, $limit, $offset]);
        $products = $stmt->fetchAll();

        $this->success([
            'products'   => $products,
            'pagination' => [
                'total'        => $total,
                'page'         => $page,
                'limit'        => $limit,
                'total_pages'  => (int)ceil($total / $limit),
            ],
        ]);
    }

    // GET /api/products/{slug}
    public function show(array $params): void
    {
        $db   = Database::getInstance();
        $slug = $params['slug'] ?? '';

        $stmt = $db->prepare(
            "SELECT p.*, c.name AS category_name, c.slug AS category_slug
             FROM products p
             JOIN categories c ON c.id = p.category_id
             WHERE p.slug = ? AND p.is_active = 1
             LIMIT 1"
        );
        $stmt->execute([$slug]);
        $product = $stmt->fetch();

        if (!$product) {
            $this->error('商品不存在', 404);
            return;
        }

        // 取得圖片
        $imgStmt = $db->prepare(
            'SELECT url, alt_text FROM product_images WHERE product_id = ? ORDER BY sort_order'
        );
        $imgStmt->execute([$product['id']]);
        $product['images'] = $imgStmt->fetchAll();

        // 取得 SKU（含庫存）
        $skuStmt = $db->prepare(
            'SELECT id, sku_code, color, size, price, stock, is_active
             FROM product_skus WHERE product_id = ? AND is_active = 1'
        );
        $skuStmt->execute([$product['id']]);
        $product['skus'] = $skuStmt->fetchAll();

        $this->success($product);
    }
}
