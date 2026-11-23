-- ============================================================
-- Migration: 002_category_i18n.sql
-- 支援分類多語系 (Category Internationalization)
-- ============================================================

ALTER TABLE `categories`
ADD COLUMN `name_en` VARCHAR(100) NULL AFTER `name`,
ADD COLUMN `name_zh_cn` VARCHAR(100) NULL AFTER `name_en`;

-- 更新預設 10 筆分類之多語系翻譯
UPDATE `categories` SET `name_en` = 'Men\'s', `name_zh_cn` = '男装' WHERE `slug` = 'mens';
UPDATE `categories` SET `name_en` = 'Women\'s', `name_zh_cn` = '女装' WHERE `slug` = 'womens';
UPDATE `categories` SET `name_en` = 'Accessories', `name_zh_cn` = '配件' WHERE `slug` = 'accessories';
UPDATE `categories` SET `name_en` = 'Outerwear & Coats', `name_zh_cn` = '外套 & 大衣' WHERE `slug` = 'mens-outerwear';
UPDATE `categories` SET `name_en` = 'Denim & Jeans', `name_zh_cn` = '牛仔裤' WHERE `slug` = 'mens-denim';
UPDATE `categories` SET `name_en` = 'T-Shirts', `name_zh_cn` = 'T-Shirt' WHERE `slug` = 'mens-tshirts';
UPDATE `categories` SET `name_en` = 'Dresses', `name_zh_cn` = '连衣裙' WHERE `slug` = 'womens-dresses';
UPDATE `categories` SET `name_en` = 'Tops & Blouses', `name_zh_cn` = '上衣' WHERE `slug` = 'womens-tops';
UPDATE `categories` SET `name_en` = 'Bags & Wallets', `name_zh_cn` = '箱包' WHERE `slug` = 'bags';
UPDATE `categories` SET `name_en` = 'Hats & Caps', `name_zh_cn` = '帽子' WHERE `slug` = 'hats';
