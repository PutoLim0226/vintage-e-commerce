<?php

// ============================================================
// AuthController: 註冊、登入、Refresh Token、登出
// ============================================================

declare(strict_types=1);

namespace Src\Controllers;

use Src\Core\BaseController;
use Src\Core\Database;
use Src\Services\JwtService;

class AuthController extends BaseController
{
    private JwtService $jwt;

    public function __construct()
    {
        $this->jwt = new JwtService();
    }

    // POST /api/auth/register
    public function register(array $params): void
    {
        $body = $this->body();
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $name     = trim($body['name'] ?? '');

        // 驗證
        $errors = [];
        if (!filter_var($email, FILTER_VALIDATE_EMAIL))   $errors['email']    = '請輸入有效 Email';
        if (strlen($password) < 8)                         $errors['password'] = '密碼至少 8 個字元';
        if (empty($name))                                  $errors['name']     = '姓名必填';

        if ($errors) {
            $this->error('Validation failed', 422, $errors);
            return;
        }

        $db = Database::getInstance();

        // 檢查 email 是否已存在
        $stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $this->error('此 Email 已被註冊', 409);
            return;
        }

        // 建立使用者
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare(
            'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
        );
        $stmt->execute([$email, $hash, $name]);
        $userId = (int) $db->lastInsertId();

        $this->success(
            ['id' => $userId, 'email' => $email, 'name' => $name],
            '註冊成功',
            201
        );
    }

    // POST /api/auth/login
    public function login(array $params): void
    {
        $body = $this->body();
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            $this->error('Email 或密碼錯誤', 401);
            return;
        }

        // 發放 Access Token
        $accessToken  = $this->jwt->generateAccess($user['id'], $user['role']);

        // 產生 Refresh Token 並存 DB
        $refreshToken = $this->jwt->generateRefreshToken();
        $tokenHash    = hash('sha256', $refreshToken);
        $expiresAt    = $this->jwt->getRefreshExpireAt();

        $stmt = $db->prepare(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
        );
        $stmt->execute([$user['id'], $tokenHash, $expiresAt]);

        $this->success([
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_in'    => $this->jwt->getExpire(),
            'user' => [
                'id'    => $user['id'],
                'name'  => $user['name'],
                'email' => $user['email'],
                'role'  => $user['role'],
                'level' => $user['level'],
            ],
        ], '登入成功');
    }

    // POST /api/auth/refresh
    public function refresh(array $params): void
    {
        $body = $this->body();
        $rawToken = $body['refresh_token'] ?? '';

        if (empty($rawToken)) {
            $this->error('Refresh token 必填', 400);
            return;
        }

        $hash = hash('sha256', $rawToken);
        $db   = Database::getInstance();

        $stmt = $db->prepare(
            'SELECT rt.*, u.role FROM refresh_tokens rt
             JOIN users u ON u.id = rt.user_id
             WHERE rt.token_hash = ? AND rt.expires_at > NOW()
             LIMIT 1'
        );
        $stmt->execute([$hash]);
        $row = $stmt->fetch();

        if (!$row) {
            $this->error('Refresh token 無效或已過期', 401);
            return;
        }

        // Rotation：刪舊建新
        $db->prepare('DELETE FROM refresh_tokens WHERE id = ?')->execute([$row['id']]);

        $newAccess  = $this->jwt->generateAccess((int)$row['user_id'], $row['role']);
        $newRefresh = $this->jwt->generateRefreshToken();
        $newHash    = hash('sha256', $newRefresh);
        $expiresAt  = $this->jwt->getRefreshExpireAt();

        $db->prepare(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
        )->execute([$row['user_id'], $newHash, $expiresAt]);

        $this->success([
            'access_token'  => $newAccess,
            'refresh_token' => $newRefresh,
            'expires_in'    => $this->jwt->getExpire(),
        ]);
    }

    // POST /api/auth/logout
    public function logout(array $params): void
    {
        $body = $this->body();
        $rawToken = $body['refresh_token'] ?? '';

        if ($rawToken) {
            $hash = hash('sha256', $rawToken);
            Database::getInstance()
                ->prepare('DELETE FROM refresh_tokens WHERE token_hash = ?')
                ->execute([$hash]);
        }

        $this->success(null, '已登出');
    }
}
