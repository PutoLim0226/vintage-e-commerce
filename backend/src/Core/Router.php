<?php

// ============================================================
// Router: 自製輕量 RESTful 路由
// ============================================================

declare(strict_types=1);

namespace Src\Core;

use Src\Controllers\AuthController;
use Src\Controllers\ProductController;
use Src\Controllers\CategoryController;
use Src\Controllers\CartController;
use Src\Controllers\OrderController;
use Src\Controllers\UserController;
use Src\Controllers\AdminProductController;
use Src\Controllers\AdminOrderController;
use Src\Controllers\AdminDashboardController;
use Src\Middleware\AuthMiddleware;
use Src\Middleware\AdminMiddleware;
use Src\Controllers\ReviewController;

class Router
{
    private array $routes = [];

    public function __construct()
    {
        $this->registerRoutes();
    }

    private function registerRoutes(): void
    {
        // ── 公開 API ─────────────────────────────
        // 認證
        $this->add('POST', '/api/auth/register',      [AuthController::class, 'register']);
        $this->add('POST', '/api/auth/login',          [AuthController::class, 'login']);
        $this->add('POST', '/api/auth/refresh',        [AuthController::class, 'refresh']);
        $this->add('POST', '/api/auth/logout',         [AuthController::class, 'logout']);

        // 商品（公開）
        $this->add('GET',  '/api/products',            [ProductController::class, 'index']);
        $this->add('GET',  '/api/products/{slug}',     [ProductController::class, 'show']);
        $this->add('GET',  '/api/products/{slug}/reviews', [ReviewController::class, 'index']);

        // 分類（公開）
        $this->add('GET',  '/api/categories',          [CategoryController::class, 'index']);

        // 購物車（訪客+會員共用）
        $this->add('GET',  '/api/cart',                [CartController::class, 'index']);
        $this->add('POST', '/api/cart/items',          [CartController::class, 'addItem']);
        $this->add('PATCH','/api/cart/items/{id}',     [CartController::class, 'updateItem']);
        $this->add('DELETE','/api/cart/items/{id}',   [CartController::class, 'removeItem']);

        // ── 需要登入 ────────────────────────────
        // 個人資料
        $this->add('GET',  '/api/me',                  [UserController::class, 'profile'],     [AuthMiddleware::class]);
        $this->add('PATCH','/api/me',                  [UserController::class, 'update'],      [AuthMiddleware::class]);
        $this->add('GET',  '/api/me/orders',           [UserController::class, 'orders'],      [AuthMiddleware::class]);
        $this->add('GET',  '/api/me/addresses',        [UserController::class, 'addresses'],   [AuthMiddleware::class]);
        $this->add('POST', '/api/me/addresses',        [UserController::class, 'addAddress'],  [AuthMiddleware::class]);

        // 訂單 & 折價券
        $this->add('POST', '/api/coupons/check',       [OrderController::class, 'checkCoupon'],[AuthMiddleware::class]);
        $this->add('POST', '/api/orders',              [OrderController::class, 'create'],     [AuthMiddleware::class]);
        $this->add('GET',  '/api/orders/{order_no}',   [OrderController::class, 'show'],       [AuthMiddleware::class]);
        $this->add('POST', '/api/reviews',              [ReviewController::class, 'store'],     [AuthMiddleware::class]);

        // ── 管理後台 ─────────────────────────────
        $this->add('GET',  '/api/admin/dashboard',     [AdminDashboardController::class, 'index'],   [AdminMiddleware::class]);
        $this->add('GET',  '/api/admin/products',      [AdminProductController::class, 'index'],     [AdminMiddleware::class]);
        $this->add('POST', '/api/admin/products',      [AdminProductController::class, 'store'],     [AdminMiddleware::class]);
        $this->add('PUT',  '/api/admin/products/{id}', [AdminProductController::class, 'update'],    [AdminMiddleware::class]);
        $this->add('DELETE','/api/admin/products/{id}',[AdminProductController::class, 'destroy'],   [AdminMiddleware::class]);
        $this->add('GET',  '/api/admin/orders',        [AdminOrderController::class, 'index'],       [AdminMiddleware::class]);
        $this->add('PATCH','/api/admin/orders/{id}',   [AdminOrderController::class, 'updateStatus'],[AdminMiddleware::class]);

        // Payment Webhook（金流商回呼，無需驗證）
        $this->add('POST', '/api/webhook/payment',     [OrderController::class, 'paymentWebhook']);
    }

    private function add(string $method, string $path, array $handler, array $middlewares = []): void
    {
        $this->routes[] = compact('method', 'path', 'handler', 'middlewares');
    }

    public function dispatch(): void
    {
        $requestMethod = $_SERVER['REQUEST_METHOD'];
        $requestUri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $requestUri    = rtrim($requestUri, '/') ?: '/';

        foreach ($this->routes as $route) {
            $params = $this->matchRoute($route['method'], $route['path'], $requestMethod, $requestUri);
            if ($params === false) {
                continue;
            }

            // 執行 Middleware
            foreach ($route['middlewares'] as $mw) {
                (new $mw())->handle();
            }

            // 呼叫 Controller
            [$class, $method] = $route['handler'];
            $controller = new $class();
            $controller->$method($params);
            return;
        }

        // 404
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Route not found']);
    }

    /**
     * 比對路由，回傳命名參數陣列或 false
     */
    private function matchRoute(string $routeMethod, string $routePath, string $reqMethod, string $reqUri): array|false
    {
        if ($routeMethod !== $reqMethod) {
            return false;
        }

        // 將 {param} 轉為 regex
        $pattern = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $routePath);
        $pattern = '#^' . $pattern . '$#';

        if (!preg_match($pattern, $reqUri, $matches)) {
            return false;
        }

        // 回傳命名捕獲群組
        return array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
    }
}
