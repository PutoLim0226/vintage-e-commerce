<?php

// ============================================================
// AuthMiddleware: 驗證 Bearer JWT
// ============================================================

declare(strict_types=1);

namespace Src\Middleware;

use Src\Services\JwtService;

class AuthMiddleware
{
    public function handle(): void
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!str_starts_with($header, 'Bearer ')) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }

        $token = substr($header, 7);

        try {
            $payload = (new JwtService())->verifyAccess($token);
            // 將 payload 注入 $_REQUEST 讓 Controller 使用
            $_REQUEST['_auth'] = $payload;
        } catch (\Throwable) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Token invalid or expired']);
            exit;
        }
    }
}
