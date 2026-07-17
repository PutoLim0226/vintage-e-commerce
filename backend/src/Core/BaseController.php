<?php

// ============================================================
// BaseController: 所有 Controller 的父類別
// 提供統一的 JSON 回應方法與 request 解析
// ============================================================

declare(strict_types=1);

namespace Src\Core;

abstract class BaseController
{
    protected function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    protected function success(mixed $data = null, string $message = 'OK', int $status = 200): void
    {
        $this->json(['success' => true, 'message' => $message, 'data' => $data], $status);
    }

    protected function error(string $message, int $status = 400, mixed $errors = null): void
    {
        $this->json(['success' => false, 'message' => $message, 'errors' => $errors], $status);
    }

    protected function body(): array
    {
        $raw = file_get_contents('php://input');
        return (array) json_decode($raw, true);
    }

    protected function query(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }
}
