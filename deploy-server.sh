#!/usr/bin/env bash
# ============================================================
# 復古刻痕 Vintage E-Commerce — 伺服器一鍵自動部署腳本
# 適用於 Ubuntu / Debian 系統 (45.32.25.8)
# 執行方式: sudo bash deploy-server.sh [SERVER_IP]
# ============================================================

set -e

SERVER_IP="${1:-45.32.25.8}"
WEB_ROOT="/var/www/vintage-e-commerce"
DB_NAME="vintage_ec"
DB_USER="root"
DB_PASS="Putolim@0226"

echo "🚀 開始自動部署 復古刻痕 (Vintage E-Commerce) 至伺服器 ${SERVER_IP}..."

# 1. 更新系統並安裝基礎套件
echo "📦 [1/6] 安裝系統依賴 (Nginx, PHP 8.3, MySQL, Git, Node.js)..."
apt-get update -y
apt-get install -y curl git unzip nginx mysql-server php8.3 php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl

# 安裝 Node.js (如尚未安裝)
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# 2. 拉取或更新專案程式碼
echo "📂 [2/6] 下載並同步專案原始碼..."
mkdir -p "$WEB_ROOT"
if [ -d "$WEB_ROOT/.git" ]; then
    cd "$WEB_ROOT"
    git pull origin main
else
    rm -rf "$WEB_ROOT"
    git clone https://github.com/PutoLim0226/vintage-e-commerce.git "$WEB_ROOT"
    cd "$WEB_ROOT"
fi

# 3. 初始化 MySQL 資料庫
echo "🗄️ [3/6] 設定 MySQL 資料庫與匯入 Schema/Seeds..."
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASS}'; FLUSH PRIVILEGES;" || true
mysql -u root -p"${DB_PASS}" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

mysql -u root -p"${DB_PASS}" "$DB_NAME" < "$WEB_ROOT/backend/database/migrations/001_schema.sql"
mysql -u root -p"${DB_PASS}" "$DB_NAME" < "$WEB_ROOT/backend/database/seeds.sql"

# 4. 前端打包 (注入 SERVER_IP 作為 VITE_API_URL)
echo "🎨 [4/6] 編譯前端 SPA (API URL: http://${SERVER_IP})..."
cd "$WEB_ROOT/frontend"
npm install
VITE_API_URL="http://${SERVER_IP}" npm run build

# 5. 配置 Nginx 站台與 PHP-FPM
echo "🌐 [5/6] 設定 Nginx 反向代理與 PHP 站台..."
cat << 'EOF' > /etc/nginx/sites-available/vintage-e-commerce
server {
    listen 80;
    server_name _;

    root /var/www/vintage-e-commerce/frontend/dist;
    index index.html;

    # 前端 SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 後端 RESTful API 轉發
    location /api {
        root /var/www/vintage-e-commerce/backend/public;
        rewrite ^/api/(.*)$ /index.php?/$1 last;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_param SCRIPT_FILENAME /var/www/vintage-e-commerce/backend/public/index.php;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        }
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF

ln -sf /etc/nginx/sites-available/vintage-e-commerce /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl restart php8.3-fpm

# 6. 設定檔案權限
echo "🔒 [6/6] 設定網站權限..."
chown -R www-data:www-data "$WEB_ROOT"
chmod -R 755 "$WEB_ROOT"

echo "
🎉🎉 部署完成！！
您可以直接在瀏覽器造訪：
👉 http://${SERVER_IP}/

測試管理後台：
👉 http://${SERVER_IP}/admin (帳號: admin@vintage.com / 密碼: admin123)
"
