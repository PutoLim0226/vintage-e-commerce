<?php

// ============================================================
// AdminMiddleware: 驗證 JWT 且 role === 'admin'
// ============================================================

declare(strict_types=1);

namespace Src\Middleware;

use Src\Services\JwtService;

class AdminMiddleware
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

            if (($payload['role'] ?? '') !== 'admin') {
                http_response_code(403);
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                exit;
            }

            $_REQUEST['_auth'] = $payload;
        } catch (\Throwable) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Token invalid or expired']);
            exit;
        }
    }
}
