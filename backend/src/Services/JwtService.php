<?php

// ============================================================
// JwtService: JWT Access Token + Refresh Token 雙 Token 機制
// ============================================================

declare(strict_types=1);

namespace Src\Services;

class JwtService
{
    private string $secret;
    private int    $expire;        // Access Token TTL (秒)
    private int    $refreshExpire; // Refresh Token TTL (秒)

    public function __construct()
    {
        $this->secret        = $_ENV['JWT_SECRET']         ?? 'fallback_secret_change_this';
        $this->expire        = (int)($_ENV['JWT_EXPIRE']   ?? 900);
        $this->refreshExpire = (int)($_ENV['JWT_REFRESH_EXPIRE'] ?? 604800);
    }

    // ── Access Token ───────────────────────────────────────

    public function generateAccess(int $userId, string $role): string
    {
        return $this->encode([
            'sub'  => $userId,
            'role' => $role,
            'type' => 'access',
            'exp'  => time() + $this->expire,
            'iat'  => time(),
        ]);
    }

    public function verifyAccess(string $token): array
    {
        $payload = $this->decode($token);

        if ($payload['type'] !== 'access') {
            throw new \RuntimeException('Invalid token type');
        }
        if ($payload['exp'] < time()) {
            throw new \RuntimeException('Token expired');
        }

        return $payload;
    }

    // ── Refresh Token（隨機字串，存 DB）───────────────────

    public function generateRefreshToken(): string
    {
        return bin2hex(random_bytes(40));
    }

    public function getRefreshExpireAt(): string
    {
        return date('Y-m-d H:i:s', time() + $this->refreshExpire);
    }

    // ── JWT 編解碼 ────────────────────────────────────────

    private function encode(array $payload): string
    {
        $header    = $this->base64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $body      = $this->base64url(json_encode($payload));
        $signature = $this->sign("$header.$body");

        return "$header.$body.$signature";
    }

    private function decode(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new \RuntimeException('Malformed JWT');
        }

        [$header, $body, $sig] = $parts;

        if (!hash_equals($this->sign("$header.$body"), $sig)) {
            throw new \RuntimeException('Invalid JWT signature');
        }

        return (array) json_decode(base64_decode(strtr($body, '-_', '+/')), true);
    }

    private function sign(string $data): string
    {
        return $this->base64url(hash_hmac('sha256', $data, $this->secret, true));
    }

    private function base64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    public function getExpire(): int
    {
        return $this->expire;
    }
}
