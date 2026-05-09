#!/bin/bash
# ============================================================
# Deploy script untuk server LeAds
# Jalankan: bash deploy.sh
# ============================================================

set -e

echo "=== Marketplace Backend Deploy Script ==="

# Cek apakah .env sudah ada
if [ ! -f ".env" ]; then
  echo "[!] File .env tidak ditemukan. Membuat dari .env.example..."
  cp .env.example .env
  echo "[!] Silakan edit .env terlebih dahulu, lalu jalankan ulang script ini."
  echo "    nano .env"
  exit 1
fi

# Cek Docker
if ! command -v docker &> /dev/null; then
  echo "[!] Docker tidak ditemukan. Install Docker terlebih dahulu."
  exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo "[!] Docker Compose tidak ditemukan."
  exit 1
fi

echo "[1] Menghentikan container yang berjalan..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true

echo "[2] Build dan jalankan semua service..."
docker-compose up -d --build 2>/dev/null || docker compose up -d --build

echo "[3] Menunggu service siap (30 detik)..."
sleep 30

echo "[4] Status container:"
docker-compose ps 2>/dev/null || docker compose ps

echo "[5] Cek health endpoint..."
sleep 5
curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || \
  curl -s http://localhost:3000/health

echo ""
echo "=== Deploy selesai! ==="
echo ""
echo "Endpoint tersedia di:"
echo "  API Gateway:    http://localhost:3000"
echo "  Auth Service:   http://localhost:3001"
echo "  Product Service: http://localhost:3002"
echo "  Order Service:  http://localhost:3003"
echo "  Notification:   http://localhost:3004"
echo "  RabbitMQ UI:    http://localhost:15672 (guest/guest)"
echo ""
echo "Lihat log: docker-compose logs -f"
