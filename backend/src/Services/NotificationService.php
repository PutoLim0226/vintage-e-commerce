<?php

// ============================================================
// NotificationService: 統一通知派遣器 (Email + LINE 雙管道)
// ============================================================

declare(strict_types=1);

namespace Src\Services;

use Src\Core\Database;

class NotificationService
{
    /**
     * 觸發補貨通知
     */
    public static function triggerRestockAlert(int $productId): void
    {
        $db = Database::getInstance();

        // 1. 取得商品資訊
        $prodStmt = $db->prepare('SELECT name, slug, base_price, cover_image_url FROM products WHERE id = ? LIMIT 1');
        $prodStmt->execute([$productId]);
        $product = $prodStmt->fetch();
        if (!$product) return;

        // 2. 尋找所有訂閱者
        $subsStmt = $db->prepare(
            'SELECT ps.user_id, u.email, u.name, u.line_user_id 
             FROM product_subscriptions ps
             JOIN users u ON u.id = ps.user_id
             WHERE ps.product_id = ?'
        );
        $subsStmt->execute([$productId]);
        $subscribers = $subsStmt->fetchAll();

        if (empty($subscribers)) return;

        $productName = $product['name'];
        $productPrice = number_format(floatval($product['base_price']), 0);
        $productImage = $product['cover_image_url'] ?? '';

        foreach ($subscribers as $sub) {
            $userName = $sub['name'];
            
            // ✉️ A. 寫入 Email 隊列
            $subject = "【補貨通知】您追蹤的經典單品「{$productName}」已補貨上架！";
            $emailBody = self::buildEmailTemplate(
                $userName,
                "您收藏追蹤的復古經典商品「<strong>{$productName}</strong>」已經重新補貨上架囉！數量有限，欲購從速。",
                $productName,
                $productPrice,
                $productImage,
                "http://45.32.25.8/products/{$product['slug']}"
            );

            $ins = $db->prepare('INSERT INTO mail_queues (to_email, subject, body, status) VALUES (?, ?, ?, "pending")');
            $ins->execute([$sub['email'], $subject, $emailBody]);

            // 💬 B. 發送 LINE 官方帳號 Flex Message 通知 (若有綁定)
            if (!empty($sub['line_user_id'])) {
                self::sendLineFlexMessage($sub['line_user_id'], "補貨通知", $productName, "商品重新補貨上架！", $productPrice, $productImage, "http://45.32.25.8/products/{$product['slug']}");
            }
        }

        // 3. 清理已通知之訂閱紀錄
        $del = $db->prepare('DELETE FROM product_subscriptions WHERE product_id = ?');
        $del->execute([$productId]);
    }

    /**
     * 觸發降價通知
     */
    public static function triggerPriceDropAlert(int $productId, float $oldPrice, float $newPrice): void
    {
        $db = Database::getInstance();

        // 1. 取得商品資訊
        $prodStmt = $db->prepare('SELECT name, slug, cover_image_url FROM products WHERE id = ? LIMIT 1');
        $prodStmt->execute([$productId]);
        $product = $prodStmt->fetch();
        if (!$product) return;

        // 2. 尋找所有將此商品加到願望清單 (Wishlist) 的會員
        $wishStmt = $db->prepare(
            'SELECT w.user_id, u.email, u.name, u.line_user_id 
             FROM wishlists w
             JOIN users u ON u.id = w.user_id
             WHERE w.product_id = ?'
        );
        $wishStmt->execute([$productId]);
        $collectors = $wishStmt->fetchAll();

        if (empty($collectors)) return;

        $productName = $product['name'];
        $productImage = $product['cover_image_url'] ?? '';
        $oldFormatted = number_format($oldPrice, 0);
        $newFormatted = number_format($newPrice, 0);

        foreach ($collectors as $user) {
            $userName = $user['name'];

            // ✉️ A. 寫入 Email 隊列
            $subject = "【降價通知】您收藏的商品「{$productName}」降價了！現省 NT\$ " . number_format($oldPrice - $newPrice);
            $emailBody = self::buildEmailTemplate(
                $userName,
                "您收藏的單品「<strong>{$productName}</strong>」剛剛悄悄降價囉！<br>原價：<s>NT$ {$oldFormatted}</s> ➔ <strong>特價：NT$ {$newFormatted}</strong>，快趁著優惠入手吧！",
                $productName,
                $newFormatted,
                $productImage,
                "http://45.32.25.8/products/{$product['slug']}"
            );

            $ins = $db->prepare('INSERT INTO mail_queues (to_email, subject, body, status) VALUES (?, ?, ?, "pending")');
            $ins->execute([$user['email'], $subject, $emailBody]);

            // 💬 B. 發送 LINE 官方帳號 Flex Message 通知
            if (!empty($user['line_user_id'])) {
                self::sendLineFlexMessage(
                    $user['line_user_id'],
                    "降價通知",
                    $productName,
                    "商品降價特惠！現省 NT$ " . number_format($oldPrice - $newPrice),
                    $newFormatted,
                    $productImage,
                    "http://45.32.25.8/products/{$product['slug']}"
                );
            }
        }
    }

    /**
     * 發送 LINE Flex Message 氣泡卡片 (模擬日誌/API 發送)
     */
    private static function sendLineFlexMessage(string $lineUserId, string $type, string $title, string $desc, string $price, string $image, string $url): void
    {
        $logDir = __DIR__ . '/../../storage/logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0777, true);
        }

        // 模擬 LINE Flex Message JSON Payload
        $payload = [
            'to' => $lineUserId,
            'messages' => [
                [
                    'type' => 'flex',
                    'altText' => "復古刻痕: {$type} - {$title}",
                    'contents' => [
                        'type' => 'bubble',
                        'hero' => [
                            'type' => 'image',
                            'url' => $image ?: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=400&q=80',
                            'size' => 'full',
                            'aspectRatio' => '20:13',
                            'aspectMode' => 'cover',
                        ],
                        'body' => [
                            'type' => 'box',
                            'layout' => 'vertical',
                            'contents' => [
                                ['type' => 'text', 'text' => "🧥 復古刻痕 - {$type}", 'weight' => 'bold', 'color' => '#c8a96e', 'size' => 'sm'],
                                ['type' => 'text', 'text' => $title, 'weight' => 'bold', 'size' => 'xl', 'margin' => 'md', 'wrap' => true],
                                ['type' => 'text', 'text' => $desc, 'size' => 'xs', 'color' => '#aaaaaa', 'margin' => 'md', 'wrap' => true],
                                ['type' => 'text', 'text' => "優惠價 NT$ {$price}", 'weight' => 'bold', 'size' => 'lg', 'color' => '#c8a96e', 'margin' => 'md'],
                            ]
                        ],
                        'footer' => [
                            'type' => 'box',
                            'layout' => 'vertical',
                            'contents' => [
                                [
                                    'type' => 'button',
                                    'action' => ['type' => 'uri', 'label' => '立即搶購', 'uri' => $url],
                                    'style' => 'primary',
                                    'color' => '#c8a96e'
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ];

        // 寫入日誌記錄，模擬已完成 LINE Messaging API Push
        $logMessage = "[" . date('Y-m-d H:i:s') . "] 📲 [LINE Push Sent to {$lineUserId}] Payload: " . json_encode($payload, JSON_UNESCAPED_UNICODE) . "\n";
        file_put_contents($logDir . '/line_notifications.log', $logMessage, FILE_APPEND);
    }

    /**
     * 構建精美 HTML 郵件範本
     */
    private static function buildEmailTemplate(string $userName, string $content, string $productName, string $price, string $image, string $url): string
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: sans-serif; background-color: #120d07; color: #f5f0e8; padding: 20px; }
                .card { background-color: #1e1610; border: 1px solid rgba(200, 169, 110, 0.2); border-radius: 8px; padding: 24px; max-width: 500px; margin: 0 auto; }
                .title { color: #c8a96e; font-size: 20px; border-bottom: 1px solid rgba(200, 169, 110, 0.2); padding-bottom: 12px; margin-bottom: 16px; }
                .product-img { width: 100%; border-radius: 6px; aspect-ratio: 4/3; object-fit: cover; margin-top: 12px; }
                .btn { display: inline-block; background-color: #c8a96e; color: #120d07; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class='card'>
                <div class='title'>🧥 復古刻痕 Vintage E-Commerce</div>
                <p>親愛的 {$userName} 您好：</p>
                <p>{$content}</p>
                
                <div style='background: #120d07; padding: 16px; border-radius: 6px; margin-top: 16px; text-align: center;'>
                    <img class='product-img' src='{$image}' alt='{$productName}'>
                    <h3 style='margin: 12px 0 6px 0; color: #f5f0e8;'>{$productName}</h3>
                    <p style='color: #c8a96e; font-size: 18px; font-weight: bold; margin: 0;'>特惠價 NT$ {$price}</p>
                </div>
                
                <div style='text-align: center;'>
                    <a class='btn' href='{$url}'>前往搶購</a>
                </div>
            </div>
        </body>
        </html>
        ";
    }
}
