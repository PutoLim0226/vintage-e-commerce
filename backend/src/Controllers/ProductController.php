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
    // 支援: ?category=slug &search=keyword &sort=price_asc|price_desc|newest &page=1 &limit=12 &colors=藍色,綠色 &sizes=M,L &min_price=1000 &max_price=3000
    public function index(array $params): void
    {
        $db = Database::getInstance();

        $categorySlug = $this->query('category');
        $search       = $this->query('search');
        $sort         = $this->query('sort', 'newest');
        $page         = max(1, (int)$this->query('page', 1));
        $limit        = min(48, max(1, (int)$this->query('limit', 12)));
        $offset       = ($page - 1) * $limit;

        $colorsParam  = $this->query('colors');
        $sizesParam   = $this->query('sizes');
        $minPrice     = $this->query('min_price');
        $maxPrice     = $this->query('max_price');

        $where  = ['p.is_active = 1'];
        $bind   = [];

        if ($categorySlug) {
            $where[] = '(c.slug = ? OR c.parent_id = (SELECT id FROM categories WHERE slug = ? LIMIT 1))';
            $bind[]  = $categorySlug;
            $bind[]  = $categorySlug;
        }

        if ($search) {
            $where[] = '(p.name LIKE ? OR p.description LIKE ?)';
            $bind[]  = "%$search%";
            $bind[]  = "%$search%";
        }

        // 價格區間篩選 (針對 SKU)
        if ($minPrice !== null && $minPrice !== '') {
            $where[] = 'EXISTS (SELECT 1 FROM product_skus ps2 WHERE ps2.product_id = p.id AND ps2.price >= ? AND ps2.is_active = 1)';
            $bind[]  = floatval($minPrice);
        }
        if ($maxPrice !== null && $maxPrice !== '') {
            $where[] = 'EXISTS (SELECT 1 FROM product_skus ps2 WHERE ps2.product_id = p.id AND ps2.price <= ? AND ps2.is_active = 1)';
            $bind[]  = floatval($maxPrice);
        }

        // 顏色篩選
        if ($colorsParam) {
            $colorsArray = explode(',', $colorsParam);
            $placeholders = implode(',', array_fill(0, count($colorsArray), '?'));
            $where[] = "EXISTS (SELECT 1 FROM product_skus ps2 WHERE ps2.product_id = p.id AND ps2.color IN ($placeholders) AND ps2.is_active = 1 AND ps2.stock > 0)";
            foreach ($colorsArray as $c) {
                $bind[] = $c;
            }
        }

        // 尺寸篩選
        if ($sizesParam) {
            $sizesArray = explode(',', $sizesParam);
            $placeholders = implode(',', array_fill(0, count($sizesArray), '?'));
            $where[] = "EXISTS (SELECT 1 FROM product_skus ps2 WHERE ps2.product_id = p.id AND ps2.size IN ($placeholders) AND ps2.is_active = 1 AND ps2.stock > 0)";
            foreach ($sizesArray as $s) {
                $bind[] = $s;
            }
        }

        $whereSQL = implode(' AND ', $where);

        $orderSQL = match($sort) {
            'price_asc'  => 'p.base_price ASC',
            'price_desc' => 'p.base_price DESC',
            default      => 'p.rating DESC, p.view_count DESC, p.created_at DESC',
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
                    p.cover_image_url, p.is_featured, p.rating, p.view_count,
                    c.name AS category_name, c.slug AS category_slug,
                    (SELECT SUM(stock) FROM product_skus WHERE product_id = p.id AND is_active = 1) AS total_stock
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

        // 點擊數自動 + 1
        $db->prepare('UPDATE products SET view_count = view_count + 1 WHERE slug = ? AND is_active = 1')
           ->execute([$slug]);

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

    // GET /api/products/filter-metadata
    public function filterMetadata(array $params): void
    {
        $db = Database::getInstance();

        // 價格區間 (Min / Max)
        $priceRange = $db->query(
            "SELECT MIN(price) AS min_price, MAX(price) AS max_price 
             FROM product_skus WHERE is_active = 1"
        )->fetch();

        // 顏色列表
        $colors = $db->query(
            "SELECT DISTINCT color FROM product_skus 
             WHERE stock > 0 AND is_active = 1 AND color IS NOT NULL AND color != ''"
        )->fetchAll(\PDO::FETCH_COLUMN);

        // 尺寸列表
        $sizes = $db->query(
            "SELECT DISTINCT size FROM product_skus 
             WHERE stock > 0 AND is_active = 1 AND size IS NOT NULL AND size != ''"
        )->fetchAll(\PDO::FETCH_COLUMN);

        $this->success([
            'min_price' => $priceRange ? round(floatval($priceRange['min_price']), 2) : 0,
            'max_price' => $priceRange ? round(floatval($priceRange['max_price']), 2) : 0,
            'colors'    => $colors,
            'sizes'     => $sizes,
        ]);
    }

    // POST /api/products/{id}/subscribe
    public function subscribe(array $params): void
    {
        $db        = Database::getInstance();
        $userId    = $_REQUEST['_auth']['sub'] ?? 0;
        $productId = (int)($params['id'] ?? 0);

        if (!$productId) {
            $this->error('商品 ID 必填', 422);
            return;
        }

        // 檢查商品是否確實售罄
        $stockStmt = $db->prepare('SELECT SUM(stock) AS total_stock FROM product_skus WHERE product_id = ?');
        $stockStmt->execute([$productId]);
        $stockRow = $stockStmt->fetch();
        $totalStock = $stockRow ? (int)$stockRow['total_stock'] : 0;

        if ($totalStock > 0) {
            $this->error('該商品目前尚有庫存，不需訂閱補貨通知', 400);
            return;
        }

        // 寫入訂閱 (防重複)
        $ins = $db->prepare('INSERT IGNORE INTO product_subscriptions (user_id, product_id) VALUES (?, ?)');
        $ins->execute([$userId, $productId]);

        $this->success(null, '訂閱成功！補貨後將立即通知您。');
    }
}
