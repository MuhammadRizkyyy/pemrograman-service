#!/bin/bash
# ============================================================
# Script Setup di Server Linux
# Jalankan ini SETELAH upload file ke server
# ============================================================

echo "=== Setup Toko Sepatu di Server ==="

# ─── Install Node.js 18 ──────────────────────────────────────
if ! command -v node &> /dev/null; then
    echo "[1] Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "[1] Node.js sudah terinstall: $(node -v)"
fi

# ─── Install PM2 ─────────────────────────────────────────────
if ! command -v pm2 &> /dev/null; then
    echo "[2] Installing PM2..."
    sudo npm install -g pm2
else
    echo "[2] PM2 sudah terinstall"
fi

# ─── Install PHP ─────────────────────────────────────────────
if ! command -v php &> /dev/null; then
    echo "[3] Installing PHP..."
    sudo apt-get update
    sudo apt-get install -y php php-mysql
else
    echo "[3] PHP sudah terinstall: $(php -v | head -1)"
fi

# ─── Install MySQL ────────────────────────────────────────────
if ! command -v mysql &> /dev/null; then
    echo "[4] Installing MySQL..."
    sudo apt-get install -y mysql-server
    sudo systemctl start mysql
    sudo systemctl enable mysql
else
    echo "[4] MySQL sudah terinstall"
fi

# ─── Setup Database ───────────────────────────────────────────
echo "[5] Setup database toko_sepatu..."
sudo mysql < /home/mahasiswa/sepatu-app/service-b/setup.sql
echo "Database berhasil disetup!"

# ─── Setup Service A ──────────────────────────────────────────
echo "[6] Setup Service A (Node.js)..."
cd /home/mahasiswa/sepatu-app/service-a

cat > .env << 'EOF'
PORT=34500
SERVICE_B_URL=http://localhost:34501
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=5
EOF

npm install

# Stop jika sudah berjalan
pm2 delete service-a 2>/dev/null || true
pm2 start index.js --name "service-a"
pm2 save
pm2 startup

echo "Service A berjalan di port 34500"

# ─── Setup Service B ──────────────────────────────────────────
echo "[7] Setup Service B (PHP)..."

# Update config DB untuk server (MySQL dengan sudo)
cat > /home/mahasiswa/sepatu-app/service-b/config/db.php << 'PHPEOF'
<?php
define('DB_HOST', '127.0.0.1');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'toko_sepatu');
define('DB_PORT', 3306);

function getConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode([
            'status'  => 500,
            'error'   => 'Database Connection Failed',
            'message' => $conn->connect_error
        ]);
        exit();
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}
PHPEOF

# Stop PHP server lama jika ada
pkill -f "php -S 0.0.0.0:34501" 2>/dev/null || true
sleep 1

# Jalankan PHP server
nohup php -S 0.0.0.0:34501 -t /home/mahasiswa/sepatu-app/service-b \
    > /tmp/service-b.log 2>&1 &

echo "Service B berjalan di port 34501"

# ─── Buka Firewall ────────────────────────────────────────────
echo "[8] Konfigurasi firewall..."
sudo ufw allow 34500/tcp 2>/dev/null || true
sudo ufw allow 34501/tcp 2>/dev/null || true

# ─── Verifikasi ───────────────────────────────────────────────
echo ""
echo "[9] Verifikasi..."
sleep 3

echo "Test Service A:"
curl -s http://localhost:34500/ | python3 -m json.tool 2>/dev/null || curl -s http://localhost:34500/

echo ""
echo "Test Service B:"
curl -s http://localhost:34501/ | python3 -m json.tool 2>/dev/null || curl -s http://localhost:34501/

echo ""
echo "Test GET Sepatu via Service A:"
curl -s http://localhost:34500/api/sepatu | python3 -m json.tool 2>/dev/null || curl -s http://localhost:34500/api/sepatu

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║  Setup selesai!                                    ║"
echo "║  Service A: http://103.147.92.134:34500            ║"
echo "║  Service B: http://103.147.92.134:34501            ║"
echo "╚════════════════════════════════════════════════════╝"
