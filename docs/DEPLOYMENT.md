# HaulSync — Deployment Guide

---

## 🐳 Docker Deployment (Recommended)

### Minimum Server Requirements
| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disk | 10 GB | 20 GB |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Step-by-Step

**1. Install Docker**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

**2. Clone and configure**
```bash
git clone https://github.com/your-org/haulsync.git
cd haulsync
cp .env.example .env
nano .env   # Set strong passwords and secrets
```

Critical values to change in `.env`:
```env
POSTGRES_PASSWORD=use_a_strong_password_here
JWT_SECRET=use_a_64_char_random_string_here
FRONTEND_URL=https://your-domain.com
VITE_API_URL=https://your-domain.com/api  # or https://api.your-domain.com
```

**3. Start services**
```bash
docker compose up -d
```

**4. Initialize the database**
```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node prisma/seed.js
```

**5. Verify**
```bash
docker compose ps          # All services should be "running"
curl http://localhost:5000/health  # Should return {"status":"ok"}
```

---

## 🔒 HTTPS with Nginx Reverse Proxy

Install Certbot and Nginx on the host:
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

Create `/etc/nginx/sites-available/haulsync`:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # File uploads
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/haulsync /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🛠️ Manual (Development) Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm 9+

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials

npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
# → API running at http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000

npm install
npm run dev
# → UI running at http://localhost:5173
```

---

## ♻️ Maintenance

### Backup PostgreSQL
```bash
docker compose exec postgres pg_dump -U haulsync haulsync > backup_$(date +%Y%m%d).sql
```

### Restore backup
```bash
cat backup_20240315.sql | docker compose exec -T postgres psql -U haulsync haulsync
```

### View logs
```bash
docker compose logs -f backend    # Backend logs
docker compose logs -f postgres   # DB logs
```

### Update to latest version
```bash
git pull origin main
docker compose build
docker compose up -d
docker compose exec backend npx prisma migrate deploy
```

### Reset everything (⚠️ destructive)
```bash
docker compose down -v   # Removes volumes including DB
docker compose up -d
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node prisma/seed.js
```

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_DB` | Yes | Database name |
| `POSTGRES_USER` | Yes | DB username |
| `POSTGRES_PASSWORD` | Yes | DB password (use strong value) |
| `JWT_SECRET` | Yes | JWT signing secret (64+ chars) |
| `JWT_EXPIRES_IN` | No | Token expiry, default `7d` |
| `NODE_ENV` | No | `production` or `development` |
| `FRONTEND_URL` | Yes | Frontend URL for CORS |
| `VITE_API_URL` | Yes | Backend API URL for frontend |

---

## 📊 Health Check Endpoints

```bash
GET /health
# Response: { "status": "ok", "service": "HaulSync API", "version": "1.0.0" }
```
