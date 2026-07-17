<?php

declare(strict_types=1);

namespace Src\Controllers;

use Src\Core\BaseController;
use Src\Core\Database;

class AdminOrderController extends BaseController
{
    // GET /api/admin/orders
    public function index(array $params): void
    {
        $db     = Database::getInstance();
        $status = $this->query('status');
        $page   = max(1, (int)$this->query('page', 1));
        $limit  = 20;
        $offset = ($page - 1) * $limit;

        $where = [];
        $bind  = [];

        if ($status) {
            $where[] = 'o.status = ?';
            $bind[]  = $status;
        }

        $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $total = $db->prepare("SELECT COUNT(*) FROM orders o $whereSQL");
        $total->execute($bind);
        $total = (int)$total->fetchColumn();

        $stmt = $db->prepare(
            "SELECT o.id, o.order_no, o.total, o.status, o.ship_name, o.ship_method, o.created_at,
                    u.email AS user_email
             FROM orders o
             LEFT JOIN users u ON u.id = o.user_id
             $whereSQL
             ORDER BY o.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $stmt->execute([...$bind, $limit, $offset]);

        $this->success([
            'orders'     => $stmt->fetchAll(),
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit],
        ]);
    }

    // PATCH /api/admin/orders/{id}
    public function updateStatus(array $params): void
    {
        $db      = Database::getInstance();
        $orderId = (int)($params['id'] ?? 0);
        $body    = $this->body();
        $status  = $body['status'] ?? '';

        $validStatuses = ['pending','paid','processing','shipped','delivered','cancelled','refunded'];
        if (!in_array($status, $validStatuses, true)) {
            $this->error('狀態值無效', 422);
            return;
        }

        $db->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$status, $orderId]);
        $this->success(null, '訂單狀態已更新');
    }
}
