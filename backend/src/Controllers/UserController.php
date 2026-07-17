<?php

declare(strict_types=1);

namespace Src\Controllers;

use Src\Core\BaseController;
use Src\Core\Database;

class UserController extends BaseController
{
    // GET /api/me
    public function profile(array $params): void
    {
        $db   = Database::getInstance();
        $auth = $_REQUEST['_auth'];

        $stmt = $db->prepare(
            'SELECT id, name, email, phone, avatar_url, role, level, points, created_at
             FROM users WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$auth['sub']]);
        $user = $stmt->fetch();

        $this->success($user);
    }

    // PATCH /api/me
    public function update(array $params): void
    {
        $db   = Database::getInstance();
        $auth = $_REQUEST['_auth'];
        $body = $this->body();

        $allowed = ['name', 'phone', 'avatar_url'];
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

        $bind[] = $auth['sub'];
        $db->prepare('UPDATE users SET ' . implode(', ', $set) . ' WHERE id = ?')->execute($bind);

        $this->success(null, '資料已更新');
    }

    // GET /api/me/orders
    public function orders(array $params): void
    {
        $db   = Database::getInstance();
        $auth = $_REQUEST['_auth'];

        $stmt = $db->prepare(
            'SELECT id, order_no, total, status, created_at
             FROM orders WHERE user_id = ? ORDER BY created_at DESC'
        );
        $stmt->execute([$auth['sub']]);

        $this->success($stmt->fetchAll());
    }

    // GET /api/me/addresses
    public function addresses(array $params): void
    {
        $db   = Database::getInstance();
        $auth = $_REQUEST['_auth'];

        $stmt = $db->prepare(
            'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC'
        );
        $stmt->execute([$auth['sub']]);

        $this->success($stmt->fetchAll());
    }

    // POST /api/me/addresses
    public function addAddress(array $params): void
    {
        $db   = Database::getInstance();
        $auth = $_REQUEST['_auth'];
        $body = $this->body();

        $required = ['recipient', 'phone', 'city', 'district', 'address'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                $this->error("$field 必填", 422);
                return;
            }
        }

        // 若標記為預設，先清除原有預設
        if (!empty($body['is_default'])) {
            $db->prepare('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?')->execute([$auth['sub']]);
        }

        $db->prepare(
            'INSERT INTO user_addresses (user_id, label, recipient, phone, zip, city, district, address, is_default)
             VALUES (?,?,?,?,?,?,?,?,?)'
        )->execute([
            $auth['sub'],
            $body['label']      ?? '預設',
            $body['recipient'],
            $body['phone'],
            $body['zip']        ?? '',
            $body['city'],
            $body['district'],
            $body['address'],
            !empty($body['is_default']) ? 1 : 0,
        ]);

        $this->success(null, '地址已新增', 201);
    }
}
