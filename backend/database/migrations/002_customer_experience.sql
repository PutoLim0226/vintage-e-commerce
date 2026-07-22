-- ============================================================
-- 002_customer_experience.sql
-- 🛍️ 願望清單、動態屬性篩選與通知隊列資料表定義
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 願望清單 (收藏) 表
CREATE TABLE IF NOT EXISTS wishlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_product (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 商品補貨訂閱通知表
CREATE TABLE IF NOT EXISTS product_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_subs_user_product (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 信件發送隊列表
CREATE TABLE IF NOT EXISTS mail_queues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL DEFAULT NULL,
    KEY idx_status_attempts (status, attempts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 會員資料表擴充：加入 LINE User ID 欄位
ALTER TABLE users ADD COLUMN line_user_id VARCHAR(100) UNIQUE NULL AFTER level;

SET FOREIGN_KEY_CHECKS = 1;
