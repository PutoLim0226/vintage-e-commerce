<?php

// ============================================================
// scripts/mail-worker.php
// ✉️ 零依賴異步郵件發送背景 Worker 腳本 (支援真實 SMTP 與開發 Sandbox 模擬)
// ============================================================

declare(strict_types=1);

date_default_timezone_set('Asia/Taipei');

$baseDir = __DIR__ . '/../backend';
if (!defined('BASE_PATH')) {
    define('BASE_PATH', $baseDir);
}
require_once $baseDir . '/src/Core/Database.php';

// 1. 載入 backend/.env 設定
$envFile = $baseDir . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

// 2. 初始化資料庫連線
define('DB_HOST', $_ENV['DB_HOST'] ?? '127.0.0.1');
define('DB_PORT', $_ENV['DB_PORT'] ?? '3306');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'vintage_ec');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? 'Putolim@0226');

use Src\Core\Database;

try {
    $db = Database::getInstance();
} catch (\Throwable $e) {
    echo "[" . date('Y-m-d H:i:s') . "] ❌ 資料庫連線失敗: " . $e->getMessage() . "\n";
    exit(1);
}

// 3. 撈取待處理郵件任務
$stmt = $db->prepare("SELECT * FROM mail_queues WHERE status = 'pending' AND attempts < 3 LIMIT 10");
$stmt->execute();
$mails = $stmt->fetchAll();

if (empty($mails)) {
    echo "[" . date('Y-m-d H:i:s') . "] 💤 郵件隊列為空，無待發送信件。\n";
    exit(0);
}

echo "[" . date('Y-m-d H:i:s') . "] 🚀 開始處理 " . count($mails) . " 封待發送郵件...\n";

$logDir = $baseDir . '/storage/logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}

// 取得 SMTP 環境設定
$smtpHost = $_ENV['SMTP_HOST'] ?? '';
$smtpPort = (int)($_ENV['SMTP_PORT'] ?? 2525);
$smtpUser = $_ENV['SMTP_USER'] ?? '';
$smtpPass = $_ENV['SMTP_PASS'] ?? '';

foreach ($mails as $mail) {
    $mailId = (int)$mail['id'];
    echo "  -> 正在處理郵件 ID: {$mailId} (收件人: {$mail['to_email']})...\n";

    // 增加嘗試次數
    $db->prepare('UPDATE mail_queues SET attempts = attempts + 1 WHERE id = ?')->execute([$mailId]);

    $success = false;

    if (!empty($smtpHost) && !empty($smtpUser) && !empty($smtpPass)) {
        // A. 實作 SMTP Socket 連線發信
        try {
            $success = sendSmtpSocket($smtpHost, $smtpPort, $smtpUser, $smtpPass, $mail['to_email'], $mail['subject'], $mail['body']);
        } catch (\Throwable $err) {
            echo "     ❌ SMTP 發送失敗: " . $err->getMessage() . "\n";
            $success = false;
        }
    } else {
        // B. 開發測試模式：寫入模擬發信日誌
        $mockFile = $logDir . '/mock_mail_delivery.log';
        $logContent = "============================================================\n"
                    . "[" . date('Y-m-d H:i:s') . "] ✉️ [模擬郵件發送成功]\n"
                    . "收件人: {$mail['to_email']}\n"
                    . "主旨: {$mail['subject']}\n"
                    . "內容簡覽:\n"
                    . strip_tags($mail['body']) . "\n"
                    . "============================================================\n\n";
        file_put_contents($mockFile, $logContent, FILE_APPEND);
        echo "     📝 [測試模式] 已將信件內容寫入 mock_mail_delivery.log\n";
        $success = true;
    }

    // 4. 更新郵件狀態
    if ($success) {
        $upd = $db->prepare("UPDATE mail_queues SET status = 'sent', sent_at = NOW() WHERE id = ?");
        $upd->execute([$mailId]);
        echo "     ✅ 郵件 ID: {$mailId} 發送成功並標記為 sent。\n";
    } else {
        // 檢查是否已達最大嘗試次數
        $chk = $db->prepare("SELECT attempts FROM mail_queues WHERE id = ?");
        $chk->execute([$mailId]);
        $attempts = (int)$chk->fetchColumn();
        if ($attempts >= 3) {
            $db->prepare("UPDATE mail_queues SET status = 'failed' WHERE id = ?")->execute([$mailId]);
            echo "     ⚠️ 郵件 ID: {$mailId} 重試失敗達 3 次，標記為 failed。\n";
        }
    }
}

echo "[" . date('Y-m-d H:i:s') . "] 🏁 郵件發送排程處理結束。\n";

/**
 * 原生 PHP Socket 發送 SMTP 信件 (無第三方依賴)
 */
function sendSmtpSocket(string $host, int $port, string $user, string $pass, string $to, string $subject, string $body): bool
{
    $socket = fsockopen($host, $port, $errno, $errstr, 15);
    if (!$socket) {
        throw new \Exception("無法連線至 SMTP 伺服器 {$host}:{$port} ({$errstr})");
    }

    $readResponse = function() use ($socket) {
        $data = '';
        while ($str = fgets($socket, 515)) {
            $data .= $str;
            if (substr($str, 3, 1) == ' ') break;
        }
        return $data;
    };

    $sendCommand = function($cmd) use ($socket, $readResponse) {
        fputs($socket, $cmd . "\r\n");
        return $readResponse();
    };

    $readResponse(); // 讀取初始歡迎訊息
    $sendCommand("EHLO " . gethostname());
    
    // 登入驗證
    $sendCommand("AUTH LOGIN");
    $sendCommand(base64_encode($user));
    $sendCommand(base64_encode($pass));

    // 發信人與收信人
    $sendCommand("MAIL FROM: <no-reply@vintage-ecommerce.com>");
    $sendCommand("RCPT TO: <{$to}>");

    // 寫入信件內文
    $sendCommand("DATA");

    $headers = "MIME-Version: 1.0\r\n"
             . "Content-Type: text/html; charset=UTF-8\r\n"
             . "From: \"復古刻痕 Vintage E-Commerce\" <no-reply@vintage-ecommerce.com>\r\n"
             . "To: <{$to}>\r\n"
             . "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n\r\n";

    fputs($socket, $headers . $body . "\r\n.\r\n");
    $readResponse();

    $sendCommand("QUIT");
    fclose($socket);

    return true;
}
