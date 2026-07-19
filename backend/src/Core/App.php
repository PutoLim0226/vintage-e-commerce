<?php

// ============================================================
// App: 應用程式啟動器
// 負責載入 .env、初始化 DB、啟動 Router
// ============================================================

declare(strict_types=1);

namespace Src\Core;

class App
{
    public function run(): void
    {
        // 載入 .env
        $this->loadEnv();

        // 設定全域錯誤處理
        $this->setErrorHandler();

        // 處理 CORS
        $this->handleCors();

        // 啟動 Router
        $router = new Router();
        $router->dispatch();
    }

    private function loadEnv(): void
    {
        $envFile = BASE_PATH . '/.env';
        if (!file_exists($envFile)) {
            return;
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (str_starts_with(trim($line), '#')) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
            putenv(trim($key) . '=' . trim($value));
        }
    }

    private function setErrorHandler(): void
    {
        set_exception_handler(function (\Throwable $e) {
            $debug = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => $debug ? $e->getMessage() : 'Internal Server Error',
                'trace'   => $debug ? $e->getTraceAsString() : null,
            ]);
        });
    }

    private function handleCors(): void
    {
        $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'https://putolim0226.github.io'
        ];

        if (in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Cart-Token');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
