-- ============================================================
-- 復古刻痕 Vintage E-Commerce — MySQL 8.0 Schema
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+08:00';

CREATE DATABASE IF NOT EXISTS `vintage_ec`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `vintage_ec`;

-- ============================================================
-- 1. 會員系統
-- ============================================================

CREATE TABLE `users` (
    `id`              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email`           VARCHAR(255) NOT NULL UNIQUE,
    `password_hash`   VARCHAR(255) NOT NULL,
    `name`            VARCHAR(100) NOT NULL,
    `phone`           VARCHAR(20),
    `avatar_url`      VARCHAR(500),
    `role`            ENUM('customer','admin') NOT NULL DEFAULT 'customer',
    `level`           ENUM('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
    `points`          INT UNSIGNED NOT NULL DEFAULT 0,
    `is_verified`     TINYINT(1) NOT NULL DEFAULT 0,
    `is_active`       TINYINT(1) NOT NULL DEFAULT 1,
    `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `refresh_tokens` (
    `id`          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`     BIGINT UNSIGNED NOT NULL,
    `token_hash`  VARCHAR(255) NOT NULL UNIQUE,
    `expires_at`  TIMESTAMP NOT NULL,
    `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `user_addresses` (
    `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`      BIGINT UNSIGNED NOT NULL,
    `label`        VARCHAR(50) DEFAULT '預設',
    `recipient`    VARCHAR(100) NOT NULL,
    `phone`        VARCHAR(20) NOT NULL,
    `zip`          VARCHAR(10),
    `city`         VARCHAR(50) NOT NULL,
    `district`     VARCHAR(50) NOT NULL,
    `address`      VARCHAR(255) NOT NULL,
    `is_default`   TINYINT(1) NOT NULL DEFAULT 0,
    `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 2. 商品目錄系統
-- ============================================================

CREATE TABLE `categories` (
    `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `parent_id`   INT UNSIGNED DEFAULT NULL,
    `name`        VARCHAR(100) NOT NULL,
    `slug`        VARCHAR(120) NOT NULL UNIQUE,
    `description` TEXT,
    `image_url`   VARCHAR(500),
    `sort_order`  SMALLINT NOT NULL DEFAULT 0,
    `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
    `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE `products` (
    `id`              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `category_id`     INT UNSIGNED NOT NULL,
    `name`            VARCHAR(255) NOT NULL,
    `slug`            VARCHAR(280) NOT NULL UNIQUE,
    `description`     TEXT,
    `base_price`      DECIMAL(10,2) NOT NULL,
    `compare_price`   DECIMAL(10,2) DEFAULT NULL COMMENT '劃線原價',
    `cover_image_url` VARCHAR(500),
    `is_active`       TINYINT(1) NOT NULL DEFAULT 1,
    `is_featured`     TINYINT(1) NOT NULL DEFAULT 0,
    `meta_title`      VARCHAR(255),
    `meta_desc`       VARCHAR(500),
    `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
) ENGINE=InnoDB;

CREATE TABLE `product_images` (
    `id`          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id`  BIGINT UNSIGNED NOT NULL,
    `url`         VARCHAR(500) NOT NULL,
    `alt_text`    VARCHAR(255),
    `sort_order`  SMALLINT NOT NULL DEFAULT 0,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- SKU：每個顏色+尺寸組合是一條獨立庫存
CREATE TABLE `product_skus` (
    `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id`   BIGINT UNSIGNED NOT NULL,
    `sku_code`     VARCHAR(80) NOT NULL UNIQUE COMMENT '庫存單位編碼',
    `color`        VARCHAR(50),
    `size`         VARCHAR(30),
    `price`        DECIMAL(10,2) NOT NULL,
    `stock`        INT NOT NULL DEFAULT 0,
    `is_active`    TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 3. 購物車（持久化）
-- ============================================================

CREATE TABLE `carts` (
    `id`          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`     BIGINT UNSIGNED DEFAULT NULL COMMENT 'NULL = 訪客購物車',
    `session_key` VARCHAR(64) DEFAULT NULL COMMENT '訪客 session token',
    `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `cart_items` (
    `id`          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `cart_id`     BIGINT UNSIGNED NOT NULL,
    `sku_id`      BIGINT UNSIGNED NOT NULL,
    `quantity`    INT UNSIGNED NOT NULL DEFAULT 1,
    `added_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_cart_sku` (`cart_id`, `sku_id`),
    FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sku_id`)  REFERENCES `product_skus`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 4. 折價券系統
-- ============================================================

CREATE TABLE `coupons` (
    `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code`            VARCHAR(50) NOT NULL UNIQUE,
    `type`            ENUM('fixed','percent') NOT NULL DEFAULT 'percent',
    `value`           DECIMAL(8,2) NOT NULL COMMENT '折扣值或百分比',
    `min_order`       DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '最低消費門檻',
    `max_discount`    DECIMAL(10,2) DEFAULT NULL COMMENT '最高折抵（百分比折扣用）',
    `usage_limit`     INT DEFAULT NULL COMMENT 'NULL = 不限',
    `used_count`      INT NOT NULL DEFAULT 0,
    `starts_at`       TIMESTAMP NULL,
    `expires_at`      TIMESTAMP NULL,
    `is_active`       TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ============================================================
-- 5. 訂單系統
-- ============================================================

CREATE TABLE `orders` (
    `id`                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_no`           VARCHAR(30) NOT NULL UNIQUE COMMENT '訂單編號，如 VC-20260717-00001',
    `user_id`            BIGINT UNSIGNED DEFAULT NULL,
    `coupon_id`          INT UNSIGNED DEFAULT NULL,
    `subtotal`           DECIMAL(10,2) NOT NULL,
    `shipping_fee`       DECIMAL(8,2) NOT NULL DEFAULT 0,
    `discount`           DECIMAL(8,2) NOT NULL DEFAULT 0,
    `total`              DECIMAL(10,2) NOT NULL,
    `status`             ENUM('pending','paid','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
    -- 收件資訊（快照，不依賴 user_addresses）
    `ship_name`          VARCHAR(100) NOT NULL,
    `ship_phone`         VARCHAR(20) NOT NULL,
    `ship_zip`           VARCHAR(10),
    `ship_city`          VARCHAR(50) NOT NULL,
    `ship_district`      VARCHAR(50) NOT NULL,
    `ship_address`       VARCHAR(255) NOT NULL,
    `ship_method`        ENUM('home_delivery','cvs_711','cvs_family') NOT NULL DEFAULT 'home_delivery',
    -- 備註
    `notes`              TEXT,
    `created_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE `order_items` (
    `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id`     BIGINT UNSIGNED NOT NULL,
    `sku_id`       BIGINT UNSIGNED NOT NULL,
    -- 快照：下單當下的商品名稱與價格
    `product_name` VARCHAR(255) NOT NULL,
    `sku_color`    VARCHAR(50),
    `sku_size`     VARCHAR(30),
    `unit_price`   DECIMAL(10,2) NOT NULL,
    `quantity`     INT UNSIGNED NOT NULL,
    `subtotal`     DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sku_id`)   REFERENCES `product_skus`(`id`)
) ENGINE=InnoDB;

-- ============================================================
-- 6. 金流（Payment）
-- ============================================================

CREATE TABLE `payments` (
    `id`              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id`        BIGINT UNSIGNED NOT NULL UNIQUE,
    `gateway`         ENUM('newebpay','ecpay') NOT NULL,
    `method`          ENUM('credit_card','atm','cvs') NOT NULL DEFAULT 'credit_card',
    `amount`          DECIMAL(10,2) NOT NULL,
    `status`          ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
    `gateway_trade_no` VARCHAR(100) COMMENT '金流商交易序號',
    `bank_code`       VARCHAR(10) COMMENT 'ATM 銀行代碼',
    `va_number`       VARCHAR(20) COMMENT 'ATM 虛擬帳號',
    `cvs_code`        VARCHAR(20) COMMENT '超商代碼',
    `expires_at`      TIMESTAMP NULL COMMENT 'ATM/超商繳費期限',
    `paid_at`         TIMESTAMP NULL,
    `raw_response`    JSON COMMENT '金流商完整回傳 JSON',
    `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`)
) ENGINE=InnoDB;

-- ============================================================
-- 7. 物流（Shipping）
-- ============================================================

CREATE TABLE `shipments` (
    `id`             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id`       BIGINT UNSIGNED NOT NULL,
    `carrier`        ENUM('black_cat','post_office','t_cat','cvs_711','cvs_family') NOT NULL,
    `tracking_no`    VARCHAR(50) COMMENT '追蹤號碼',
    `status`         ENUM('preparing','shipped','in_transit','delivered','returned') NOT NULL DEFAULT 'preparing',
    `shipped_at`     TIMESTAMP NULL,
    `delivered_at`   TIMESTAMP NULL,
    `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`)
) ENGINE=InnoDB;

-- ============================================================
-- 8. 紅利點數記錄
-- ============================================================

CREATE TABLE `point_logs` (
    `id`          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`     BIGINT UNSIGNED NOT NULL,
    `order_id`    BIGINT UNSIGNED DEFAULT NULL,
    `type`        ENUM('earn','redeem','expire','adjust') NOT NULL,
    `points`      INT NOT NULL COMMENT '正 = 增加，負 = 扣除',
    `note`        VARCHAR(255),
    `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 9. 數據分析用 View（後台報表）
-- ============================================================

CREATE OR REPLACE VIEW `v_revenue_daily` AS
SELECT
    DATE(`created_at`)        AS `date`,
    COUNT(*)                  AS `order_count`,
    SUM(`total`)              AS `revenue`,
    AVG(`total`)              AS `avg_order_value`
FROM `orders`
WHERE `status` NOT IN ('cancelled','refunded')
GROUP BY DATE(`created_at`);

CREATE OR REPLACE VIEW `v_top_products` AS
SELECT
    p.`id`,
    p.`name`,
    SUM(oi.`quantity`)  AS `total_sold`,
    SUM(oi.`subtotal`)  AS `total_revenue`
FROM `order_items` oi
JOIN `product_skus` ps ON oi.`sku_id` = ps.`id`
JOIN `products`     p  ON ps.`product_id` = p.`id`
JOIN `orders`       o  ON oi.`order_id` = o.`id`
WHERE o.`status` NOT IN ('cancelled','refunded')
GROUP BY p.`id`, p.`name`
ORDER BY `total_revenue` DESC;

-- ============================================================
-- 10. 索引優化
-- ============================================================

CREATE INDEX `idx_products_category` ON `products`(`category_id`);
CREATE INDEX `idx_products_active`   ON `products`(`is_active`, `is_featured`);
CREATE INDEX `idx_orders_user`       ON `orders`(`user_id`);
CREATE INDEX `idx_orders_status`     ON `orders`(`status`);
CREATE INDEX `idx_orders_created`    ON `orders`(`created_at`);
CREATE INDEX `idx_cart_user`         ON `carts`(`user_id`);
CREATE INDEX `idx_cart_session`      ON `carts`(`session_key`);
CREATE INDEX `idx_point_logs_user`   ON `point_logs`(`user_id`);
