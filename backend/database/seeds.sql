-- ============================================================
-- Vintage E-Commerce Seed Data (schema-aligned)
-- Run: rtk mysql -u root -pPutolim@0226 vintage_ec < backend/database/seeds.sql
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ─── Categories ──────────────────────────────────────────────
TRUNCATE TABLE categories;
INSERT INTO categories (id, parent_id, name, slug, sort_order) VALUES
(1,  NULL, '男裝',        'mens',            1),
(2,  NULL, '女裝',        'womens',          2),
(3,  NULL, '配件',        'accessories',     3),
(4,  1,    '外套 & 大衣', 'mens-outerwear',  1),
(5,  1,    '牛仔褲',      'mens-denim',      2),
(6,  1,    'T-Shirt',     'mens-tshirts',    3),
(7,  2,    '洋裝',        'womens-dresses',  1),
(8,  2,    '上衣',        'womens-tops',     2),
(9,  3,    '包袋',        'bags',            1),
(10, 3,    '帽子',        'hats',            2);

-- ─── Products ────────────────────────────────────────────────
DELETE FROM product_images;
DELETE FROM product_skus;
DELETE FROM products;

INSERT INTO products (id, category_id, name, slug, description, base_price, compare_price, cover_image_url, is_active, is_featured) VALUES
(1,  4, '60s 復古羊毛格紋大衣',   'wool-plaid-coat-60s',
  '1960年代風格羊毛格紋大衣，採用英國進口面料，溫暖厚實，復古紳士必備。',
  3800, 5200, 'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?auto=format&fit=crop&w=600&q=70', 1, 1),

(2,  4, '70s 皮革機車夾克',        'leather-moto-jacket-70s',
  '1970年代美式機車夾克，真皮製作，越穿越有味道，獨一無二的陳舊感。',
  5200, 7000, 'https://images.unsplash.com/photo-1520975867351-4b7a168d7ead?auto=format&fit=crop&w=600&q=70', 1, 1),

(3,  5, '90s 寬鬆直筒牛仔褲',      'wide-straight-denim-90s',
  '1990年代寬版直筒牛仔褲，高腰設計，水洗做舊處理，打造道地街頭風格。',
  1800, 2400, 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=70', 1, 1),

(4,  6, '80s Band T-Shirt',        'band-tee-80s',
  '致敬1980年代搖滾樂團的復刻T恤，100% 有機棉，柔軟透氣。',
  980,  NULL, 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=600&q=70', 1, 0),

(5,  7, '花卉碎花維多利亞洋裝',    'floral-victorian-dress',
  '維多利亞風格碎花長裙洋裝，縮腰設計，飄逸優雅，適合各種場合。',
  2600, 3500, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=70', 1, 1),

(6,  8, '70s 波西米亞流蘇上衣',    'boho-fringe-top-70s',
  '波西米亞風流蘇設計上衣，Woodstock年代復古風情，自由奔放。',
  1400, NULL, 'https://images.unsplash.com/photo-1583846552345-e28d81561c3f?auto=format&fit=crop&w=600&q=70', 1, 0),

(7,  9, '法國復古皮革肩背包',      'french-leather-shoulder-bag',
  '60年代法國風格的皮革肩背包，做舊金屬五金配件，容量適中。',
  2200, NULL, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=70', 1, 1),

(8,  10, '漁夫帽 Bucket Hat 格紋', 'plaid-bucket-hat',
  '90年代必備格紋漁夫帽，可調式帽圍，男女皆宜。',
  680,  880,  'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=600&q=70', 1, 0),

(9,  4, 'Trench Coat 英倫風衣',    'trench-coat-british',
  '經典英倫風衣，防風防水面料，腰帶設計俐落有型，雨天必備。',
  4500, 6000, 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=70', 1, 0),

(10, 6, '條紋海魂衫水手T',         'breton-stripe-tee',
  '法式 Breton 條紋長袖T恤，舒適透氣棉料，永不退流行的海魂風格。',
  1200, NULL, 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=600&q=70', 1, 0),

(11, 7, '70s Wrap Dress 繫帶洋裝', 'wrap-dress-70s',
  '70年代纏繞式設計洋裝，彈性腰帶修身顯瘦，印花配色典雅。',
  2200, 2900, 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=600&q=70', 1, 0),

(12, 5, '做舊刷破 Slim Jeans',     'distressed-slim-jeans',
  '個性做舊刷破窄管牛仔褲，彈力面料舒適貼身，街頭個性風格。',
  1600, NULL, 'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?auto=format&fit=crop&w=600&q=70', 1, 0);

-- ─── Product Images (additional angles) ──────────────────────
INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES
(1,  'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?auto=format&fit=crop&w=800&q=80', '格紋大衣正面', 0),
(1,  'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80', '格紋大衣側面', 1),
(2,  'https://images.unsplash.com/photo-1520975867351-4b7a168d7ead?auto=format&fit=crop&w=800&q=80', '機車夾克正面', 0),
(2,  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80', '機車夾克背面', 1),
(3,  'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80', '寬版牛仔褲', 0),
(4,  'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=800&q=80', 'Band Tee 正面', 0),
(5,  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80', '碎花洋裝正面', 0),
(5,  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', '碎花洋裝細節', 1),
(6,  'https://images.unsplash.com/photo-1583846552345-e28d81561c3f?auto=format&fit=crop&w=800&q=80', '流蘇上衣', 0),
(7,  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80', '肩背包正面', 0),
(7,  'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=800&q=80', '肩背包內部', 1),
(8,  'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=800&q=80', '漁夫帽', 0),
(9,  'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=800&q=80', '英倫風衣', 0),
(10, 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=800&q=80', '海魂衫', 0),
(11, 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=800&q=80', '繫帶洋裝', 0),
(12, 'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?auto=format&fit=crop&w=800&q=80', '刷破牛仔褲', 0);

-- ─── Product SKUs ─────────────────────────────────────────────
-- 大衣 (1)
INSERT INTO product_skus (product_id, sku_code, color, size, price, stock) VALUES
(1, 'COAT-60S-KH-S',  '卡其格紋', 'S', 3800, 5),
(1, 'COAT-60S-KH-M',  '卡其格紋', 'M', 3800, 8),
(1, 'COAT-60S-KH-L',  '卡其格紋', 'L', 3800, 5),
(1, 'COAT-60S-BW-M',  '黑白格紋', 'M', 3800, 2);
-- 機車夾克 (2)
INSERT INTO product_skus (product_id, sku_code, color, size, price, stock) VALUES
(2, 'MOTO-70S-BK-S',  '黑色', 'S', 5200, 3),
(2, 'MOTO-70S-BK-M',  '黑色', 'M', 5200, 6),
(2, 'MOTO-70S-BK-L',  '黑色', 'L', 5200, 4),
(2, 'MOTO-70S-BR-M',  '棕色', 'M', 5500, 2);
-- 牛仔褲 (3)
INSERT INTO product_skus (product_id, sku_code, color, size, price, stock) VALUES
(3, 'DENIM-90-LB-25', '淺藍水洗', '25', 1800, 8),
(3, 'DENIM-90-LB-27', '淺藍水洗', '27', 1800, 10),
(3, 'DENIM-90-LB-29', '淺藍水洗', '29', 1800, 9),
(3, 'DENIM-90-DB-27', '深藍',     '27', 1800, 8);
-- Band Tee (4)
INSERT INTO product_skus (product_id, sku_code, color, size, price, stock) VALUES
(4, 'TEE-80S-BK-S',  '黑色', 'S', 980, 20),
(4, 'TEE-80S-BK-M',  '黑色', 'M', 980, 20),
(4, 'TEE-80S-BK-L',  '黑色', 'L', 980, 20),
(4, 'TEE-80S-WH-M',  '白色', 'M', 980, 15);
-- 洋裝 (5)
INSERT INTO product_skus (product_id, sku_code, color, size, price, stock) VALUES
(5, 'DRESS-FL-PU-S',  '粉紫碎花', 'S', 2600, 5),
(5, 'DRESS-FL-PU-M',  '粉紫碎花', 'M', 2600, 8),
(5, 'DRESS-FL-WH-M',  '米白碎花', 'M', 2600, 5);
-- 流蘇上衣 (6)
INSERT INTO product_skus (product_id, sku_code, color, size, price, stock) VALUES
(6, 'BOHO-FR-WH-F',  '米白', 'Free', 1400, 14),
(6, 'BOHO-FR-BR-F',  '棕褐', 'Free', 1400, 14);
-- 肩背包 (7)
INSERT INTO product_skus (product_id, sku_code, color, size, price, stock) VALUES
(7, 'BAG-FR-BR-OS',  '棕色', 'One Size', 2200, 6),
(7, 'BAG-FR-BK-OS',  '黑色', 'One Size', 2200, 6);
-- 漁夫帽 (8)
INSERT INTO product_skus (product_id, sku_code, color, size, price, stock) VALUES
(8, 'HAT-BK-BW-F',  '黑白格', 'Free', 680, 25),
(8, 'HAT-BK-BR-F',  '棕格',   'Free', 680, 25);
-- 風衣 (9)
INSERT INTO product_skus (product_id, sku_code, color, size, price, stock) VALUES
(9, 'TRENCH-KH-S',  '卡其', 'S', 4500, 3),
(9, 'TRENCH-KH-M',  '卡其', 'M', 4500, 4),
(9, 'TRENCH-KH-L',  '卡其', 'L', 4500, 3);
-- 條紋海魂衫 (10)
INSERT INTO product_skus (product_id, sku_code, color, size, price, stock) VALUES
(10, 'BRETON-BW-S',  '藍白條紋', 'S', 1200, 15),
(10, 'BRETON-BW-M',  '藍白條紋', 'M', 1200, 15),
(10, 'BRETON-BW-L',  '藍白條紋', 'L', 1200, 15);
-- 繫帶洋裝 (11)
INSERT INTO product_skus (product_id, sku_code, color, size, price, stock) VALUES
(11, 'WRAP-GR-S',  '墨綠印花', 'S', 2200, 7),
(11, 'WRAP-GR-M',  '墨綠印花', 'M', 2200, 8),
(11, 'WRAP-RD-M',  '酒紅',     'M', 2200, 7);
-- 刷破窄管 (12)
INSERT INTO product_skus (product_id, sku_code, color, size, price, stock) VALUES
(12, 'SLIM-LB-25', '淺藍刷破', '25', 1600, 8),
(12, 'SLIM-LB-27', '淺藍刷破', '27', 1600, 12),
(12, 'SLIM-LB-29', '淺藍刷破', '29', 1600, 10);

-- ─── Coupons ──────────────────────────────────────────────────
DELETE FROM coupons;
INSERT INTO coupons (code, type, value, min_order, usage_limit, expires_at, is_active) VALUES
('WELCOME10',  'percent', 10,  500,  500,  DATE_ADD(NOW(), INTERVAL 1 YEAR),  1),
('VINTAGE200', 'fixed',   200, 2000, 200,  DATE_ADD(NOW(), INTERVAL 6 MONTH), 1),
('VIP15',      'percent', 15,  3000, 100,  DATE_ADD(NOW(), INTERVAL 3 MONTH), 1),
('FREESHIP',   'fixed',   60,  800,  1000, DATE_ADD(NOW(), INTERVAL 1 YEAR),  1);

SET FOREIGN_KEY_CHECKS = 1;

SELECT CONCAT('✅ Seed OK → Products: ', (SELECT COUNT(*) FROM products),
              ' | Categories: ', (SELECT COUNT(*) FROM categories),
              ' | SKUs: ', (SELECT COUNT(*) FROM product_skus),
              ' | Images: ', (SELECT COUNT(*) FROM product_images),
              ' | Coupons: ', (SELECT COUNT(*) FROM coupons)) AS result;
