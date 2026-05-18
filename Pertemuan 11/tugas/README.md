# Iris ML Microservice System

## Instalasi dan Menjalankan

### Prasyarat

- Docker dan Docker Compose terinstall
- Port 3091, 3092, 3093 tidak sedang digunakan

### Menjalankan dengan Docker Compose

```bash
docker compose up --build -d
```

Perintah ini akan otomatis:
- Build image untuk Python ML Service dan Express.js
- Melatih model Machine Learning
- Menjalankan Redis, FastAPI, dan Express.js

Cek status semua container:

```bash
docker compose ps
```

Semua service harus berstatus `healthy` sebelum bisa digunakan.

### Akses Service

| Service | URL |
|---|---|
| FastAPI ML Service | http://localhost:3091 |
| Swagger UI | http://localhost:3091/docs |
| Express.js Gateway | http://localhost:3092 |

### Menghentikan Service

```bash
docker compose down
```

---

## Menjalankan Tanpa Docker

Butuh 3 terminal terpisah.

### Terminal 1 - Redis

```bash
docker run -d -p 3093:6379 redis:7-alpine
```

### Terminal 2 - Python ML Service

```bash
cd python-ml-service

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

python train_model.py

uvicorn app.main:app --host 0.0.0.0 --port 3091 --reload
```

### Terminal 3 - Express.js Gateway

```bash
cd express-service

npm install

npm start
```
