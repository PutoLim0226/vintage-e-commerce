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
        $db = Database::getInstance();

        // 今日營收
        $today = $db->query(
            "SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
             FROM orders
             WHERE DATE(created_at) = CURDATE() AND status NOT IN ('cancelled','refunded')"
        )->fetch();

        // 本月營收
        $monthly = $db->query(
            "SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
             FROM orders
             WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())
               AND status NOT IN ('cancelled','refunded')"
        )->fetch();

        // 待處理訂單
        $pending = $db->query("SELECT COUNT(*) FROM orders WHERE status = 'paid'")->fetchColumn();

        // 近 7 日趨勢
        $trend = $db->query(
            "SELECT date, order_count, revenue FROM v_revenue_daily
             WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
             ORDER BY date"
        )->fetchAll();

        // 熱銷商品 Top 5
        $topProducts = $db->query(
            "SELECT id, name, total_sold, total_revenue FROM v_top_products LIMIT 5"
        )->fetchAll();

        $this->success([
            'today'         => $today,
            'monthly'       => $monthly,
            'pending_orders'=> (int)$pending,
            'trend'         => $trend,
            'top_products'  => $topProducts,
        ]);
    }
}
