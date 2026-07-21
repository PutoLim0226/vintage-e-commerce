<?php

declare(strict_types=1);

namespace Src\Controllers;

use Src\Core\BaseController;
use Src\Core\Database;

class AdminDashboardController extends BaseController
{
    // GET /api/admin/dashboard
    public function index(array $params): void
    {
        $db     = Database::getInstance();
        $period = $this->query('period', '7d');

        // 核心 KPI 數據
        $totalRevenue = (float)$db->query(
            "SELECT COALESCE(SUM(total), 0) FROM orders WHERE status NOT IN ('cancelled','refunded')"
        )->fetchColumn();

        $totalOrders = (int)$db->query(
            "SELECT COUNT(*) FROM orders WHERE status NOT IN ('cancelled','refunded')"
        )->fetchColumn();

        $avgOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0;

        $totalUsers = (int)$db->query("SELECT COUNT(*) FROM users WHERE role = 'customer'")->fetchColumn();

        // 今日與本月數據
        $today = $db->query(
            "SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
             FROM orders
             WHERE DATE(created_at) = CURDATE() AND status NOT IN ('cancelled','refunded')"
        )->fetch();

        $monthly = $db->query(
            "SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
             FROM orders
             WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())
               AND status NOT IN ('cancelled','refunded')"
        )->fetch();

        // 待處理訂單數 (已付款待出貨/處理)
        $pendingOrders = (int)$db->query(
            "SELECT COUNT(*) FROM orders WHERE status IN ('paid','processing')"
        )->fetchColumn();

        // 依據 period 計算營收趨勢
        $intervalDays = match ($period) {
            '30d' => 30,
            '1y'  => 365,
            default => 7,
        };

        $trendStmt = $db->prepare(
            "SELECT DATE(created_at) AS date, COUNT(*) AS order_count, COALESCE(SUM(total), 0) AS revenue
             FROM orders
             WHERE status NOT IN ('cancelled','refunded')
               AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(created_at)
             ORDER BY date ASC"
        );
        $trendStmt->execute([$intervalDays]);
        $trend = $trendStmt->fetchAll();

        // 熱銷商品 Top 5
        $topProducts = $db->query(
            "SELECT p.id, p.name, COALESCE(SUM(oi.quantity), 0) AS total_sold, COALESCE(SUM(oi.subtotal), 0) AS total_revenue
             FROM products p
             JOIN product_skus ps ON ps.product_id = p.id
             JOIN order_items oi ON oi.sku_id = ps.id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.status NOT IN ('cancelled','refunded')
             GROUP BY p.id, p.name
             ORDER BY total_sold DESC
             LIMIT 5"
        )->fetchAll();

        // 低庫存警示 (stock <= 5)
        $lowStockSkus = $db->query(
            "SELECT ps.id AS sku_id, ps.sku_code, ps.color, ps.size, ps.stock, p.name AS product_name
             FROM product_skus ps
             JOIN products p ON p.id = ps.product_id
             WHERE ps.stock <= 5 AND ps.is_active = 1
             ORDER BY ps.stock ASC
             LIMIT 10"
        )->fetchAll();

        $this->success([
            'kpi' => [
                'total_revenue'   => $totalRevenue,
                'total_orders'    => $totalOrders,
                'avg_order_value' => $avgOrderValue,
                'total_users'     => $totalUsers,
                'pending_orders'  => $pendingOrders,
                'today_orders'    => (int)($today['orders'] ?? 0),
                'today_revenue'   => (float)($today['revenue'] ?? 0),
                'monthly_revenue' => (float)($monthly['revenue'] ?? 0),
            ],
            'period'          => $period,
            'trend'           => $trend,
            'top_products'    => $topProducts,
            'low_stock_skus'  => $lowStockSkus,
        ]);
    }
}
