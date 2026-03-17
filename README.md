# 🚛 HaulSync — Open Source Logistics Operating System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

> **A self-hostable, full-stack freight and logistics management platform — built for enterprises, transport companies, and consignors.**

HaulSync digitizes your entire logistics workflow: RFQ-based indenting, real-time shipment tracking, fleet management, POD collection, invoice reconciliation, and analytics — all in one open-source platform you fully control.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 📋 **RFQ Indenting** | Post truck requirements, receive transporter quotes, auto-select via rules |
| 🚚 **Shipment Tracking** | Real-time trip tracking with halt/delay detection |
| 🚛 **Fleet Management** | Vehicle master, maintenance records, availability calendar |
| 👤 **Driver Management** | Driver profiles, license tracking, performance scoring |
| 🏢 **Company/Broker Masters** | Full directory of transporters, brokers, and consignees |
| 📄 **POD Management** | Digital proof of delivery with image upload |
| 💰 **Invoice Reconciliation** | Match freight invoices against trips automatically |
| 📊 **Analytics Dashboard** | Transporter performance, route analysis, cost trends |
| 📑 **Auto MIS Reports** | Scheduled PDF/Excel report generation |
| 👥 **Multi-Level Users** | Unlimited users with role-based access control |
| 🛣️ **Route Management** | Define, optimize, and analyze freight routes |

---

## 🏗️ Architecture

```
haulsync/
├── backend/          # Node.js + Express + Prisma API
├── frontend/         # React + Vite + Tailwind SPA
├── docs/             # Architecture & API documentation
├── docker-compose.yml
└── .env.example
```

**Tech Stack:**
- **Backend**: Node.js 18, Express.js, Prisma ORM, PostgreSQL 15, Socket.io
- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Recharts
- **Auth**: JWT + bcrypt
- **Infra**: Docker, Docker Compose, Nginx (reverse proxy)

---

## 🚀 Quick Start (Docker — Recommended)

### Prerequisites
- Docker 24+
- Docker Compose v2+

### 1. Clone the repository
```bash
git clone https://github.com/your-org/haulsync.git
cd haulsync
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your settings (DB password, JWT secret, etc.)
nano .env
```

### 3. Launch all services
```bash
docker compose up -d
```

### 4. Run database migrations & seed
```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node prisma/seed.js
```

### 5. Access the app
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Default login**: `admin@haulsync.local` / `Admin@1234`

---

## 🛠️ Manual Setup (Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

---

## 📖 Documentation

- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Contributing Guide](CONTRIBUTING.md)

---

## 🔐 Default Roles

| Role | Permissions |
|------|-------------|
| `SUPER_ADMIN` | Full access to all modules |
| `ADMIN` | All operations except user management |
| `MANAGER` | Create/edit RFQs, shipments, view reports |
| `OPERATOR` | Create shipments, update tracking |
| `VIEWER` | Read-only access to assigned modules |
| `TRANSPORTER` | View & respond to RFQs assigned to them |

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
# Open a Pull Request
```

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

Built with ❤️ for the logistics community. Open-source forever.
