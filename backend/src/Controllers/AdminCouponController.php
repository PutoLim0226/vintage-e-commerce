<?php

declare(strict_types=1);

namespace Src\Controllers;

use Src\Core\BaseController;
use Src\Core\Database;

class AdminCouponController extends BaseController
{
    // GET /api/admin/coupons
    public function index(array $params): void
    {
        $db   = Database::getInstance();
        $stmt = $db->query(
            "SELECT id, code, type, value, min_order, max_discount, usage_limit, used_count,
                    starts_at, expires_at, is_active
             FROM coupons
             ORDER BY id DESC"
        );

        $coupons = $stmt->fetchAll();

        $this->success($coupons);
    }

    // POST /api/admin/coupons
    public function store(array $params): void
    {
        $db   = Database::getInstance();
        $body = $this->body();

        $code        = strtoupper(trim($body['code'] ?? ''));
        $type        = $body['type'] ?? 'percent';
        $value       = (float)($body['value'] ?? 0);
        $minOrder    = (float)($body['min_order'] ?? 0);
        $maxDiscount = isset($body['max_discount']) && $body['max_discount'] !== '' ? (float)$body['max_discount'] : null;
        $usageLimit  = isset($body['usage_limit']) && $body['usage_limit'] !== '' ? (int)$body['usage_limit'] : null;
        $startsAt    = !empty($body['starts_at']) ? $body['starts_at'] : null;
        $expiresAt   = !empty($body['expires_at']) ? $body['expires_at'] : null;
        $isActive    = isset($body['is_active']) ? (int)(bool)$body['is_active'] : 1;

        if (empty($code)) {
            $this->error('優惠碼不得為空', 422);
            return;
        }

        if (!in_array($type, ['fixed', 'percent'], true)) {
            $this->error('折扣類型不合法', 422);
            return;
        }

        if ($value <= 0) {
            $this->error('折扣數值必須大於 0', 422);
            return;
        }

        // 檢查 code 重複
        $check = $db->prepare('SELECT id FROM coupons WHERE code = ?');
        $check->execute([$code]);
        if ($check->fetch()) {
            $this->error('該優惠碼已存在', 422);
            return;
        }

        $stmt = $db->prepare(
            "INSERT INTO coupons (code, type, value, min_order, max_discount, usage_limit, starts_at, expires_at, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $code, $type, $value, $minOrder, $maxDiscount, $usageLimit, $startsAt, $expiresAt, $isActive
        ]);

        $newId = (int)$db->lastInsertId();

        $this->success(['id' => $newId], '優惠碼新增成功', 201);
    }

    // PUT /api/admin/coupons/{id}
    public function update(array $params): void
    {
        $db       = Database::getInstance();
        $couponId = (int)($params['id'] ?? 0);
        $body     = $this->body();

        $code        = strtoupper(trim($body['code'] ?? ''));
        $type        = $body['type'] ?? 'percent';
        $value       = (float)($body['value'] ?? 0);
        $minOrder    = (float)($body['min_order'] ?? 0);
        $maxDiscount = isset($body['max_discount']) && $body['max_discount'] !== '' ? (float)$body['max_discount'] : null;
        $usageLimit  = isset($body['usage_limit']) && $body['usage_limit'] !== '' ? (int)$body['usage_limit'] : null;
        $startsAt    = !empty($body['starts_at']) ? $body['starts_at'] : null;
        $expiresAt   = !empty($body['expires_at']) ? $body['expires_at'] : null;
        $isActive    = isset($body['is_active']) ? (int)(bool)$body['is_active'] : 1;

        if (empty($code) || $value <= 0) {
            $this->error('無效的輸入欄位', 422);
            return;
        }

        // 檢查 code 是否與其他優惠碼重複
        $check = $db->prepare('SELECT id FROM coupons WHERE code = ? AND id != ?');
        $check->execute([$code, $couponId]);
        if ($check->fetch()) {
            $this->error('該優惠碼已被其他折價券使用', 422);
            return;
        }

        $stmt = $db->prepare(
            "UPDATE coupons
             SET code = ?, type = ?, value = ?, min_order = ?, max_discount = ?,
                 usage_limit = ?, starts_at = ?, expires_at = ?, is_active = ?
             WHERE id = ?"
        );
        $stmt->execute([
            $code, $type, $value, $minOrder, $maxDiscount, $usageLimit, $startsAt, $expiresAt, $isActive, $couponId
        ]);

        $this->success(null, '折價券已更新');
    }

    // PUT /api/admin/coupons/{id}/toggle
    public function toggle(array $params): void
    {
        $db       = Database::getInstance();
        $couponId = (int)($params['id'] ?? 0);

        $stmt = $db->prepare('SELECT is_active FROM coupons WHERE id = ?');
        $stmt->execute([$couponId]);
        $current = $stmt->fetchColumn();

        if ($current === false) {
            $this->error('找不到該折價券', 404);
            return;
        }

        $nextStatus = $current ? 0 : 1;
        $db->prepare('UPDATE coupons SET is_active = ? WHERE id = ?')->execute([$nextStatus, $couponId]);

        $this->success(['is_active' => $nextStatus], $nextStatus ? '折價券已啟用' : '折價券已停用');
    }

    // DELETE /api/admin/coupons/{id}
    public function destroy(array $params): void
    {
        $db       = Database::getInstance();
        $couponId = (int)($params['id'] ?? 0);

        $stmt = $db->prepare('DELETE FROM coupons WHERE id = ?');
        $stmt->execute([$couponId]);

        $this->success(null, '折價券已刪除');
    }
}
