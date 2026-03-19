# HaulSync — Architecture Overview

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Client Browser                     │
│              React SPA (Vite + Tailwind CSS)              │
│  Dashboard │ RFQ │ Shipments │ Fleet │ Analytics │ Users  │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTPS / WSS
┌──────────────────────────▼───────────────────────────────┐
│                   Nginx Reverse Proxy                     │
│           (SSL termination + static serving)              │
└────────────┬──────────────────────────┬──────────────────┘
             │ REST API                 │ WebSocket
┌────────────▼──────────────────────────▼──────────────────┐
│              Node.js + Express Backend                    │
│  ┌──────────┐ ┌─────────┐ ┌────────┐ ┌────────────────┐ │
│  │Auth/JWT  │ │  Routes │ │Prisma  │ │  Socket.io     │ │
│  │Middleware│ │Handlers │ │  ORM   │ │(Live tracking) │ │
│  └──────────┘ └────┬────┘ └───┬────┘ └────────────────┘ │
└───────────────────┼───────────┼──────────────────────────┘
                    │           │
┌───────────────────▼───────────▼──────────────────────────┐
│                  PostgreSQL 15                            │
│  users │ companies │ rfqs │ quotes │ shipments │ invoices │
│  vehicles │ drivers │ tracking_events │ pods │ routes     │
└──────────────────────────────────────────────────────────┘
```

---

## Module Breakdown

### Backend (`/backend`)

```
backend/
├── server.js              # Express app, Socket.io setup, route registration
├── prisma/
│   ├── schema.prisma      # Full data model (13 models)
│   └── seed.js            # Demo data seeder
└── src/
    ├── middleware/
    │   ├── auth.js         # JWT verification + role guard
    │   └── errorHandler.js # Centralized Prisma + Express error handling
    └── routes/
        ├── auth.js         # Login, /me, change-password
        ├── users.js        # CRUD + activate/deactivate
        ├── companies.js    # Shipper/transporter/broker directory
        ├── rfq.js          # RFQ lifecycle: create → quote → award
        ├── shipments.js    # Trip management + tracking events + POD upload
        ├── fleet.js        # Vehicle master
        ├── drivers.js      # Driver master
        ├── invoices.js     # Invoice create + status workflow
        ├── analytics.js    # Dashboard stats, performance, route analysis
        ├── goods.js        # Goods type reference
        └── routes.js       # Freight route master
```

### Frontend (`/frontend`)

```
frontend/src/
├── main.jsx               # React root
├── App.jsx                # Router + AuthProvider
├── index.css              # Global design tokens, animations, badge classes
├── api/
│   └── client.js          # Axios instance with JWT interceptor + auto-logout
├── context/
│   └── AuthContext.jsx    # Auth state, login/logout, role helpers
├── components/
│   ├── Layout/
│   │   ├── Layout.jsx     # App shell with Outlet
│   │   └── Sidebar.jsx    # Navigation + user card
│   └── common/
│       └── index.jsx      # Shared: Button, Modal, FormField, StatCard, Spinner...
└── pages/
    ├── Login.jsx
    ├── Dashboard.jsx
    ├── RFQ/               # List, Create, Detail (with quoting)
    ├── Shipments/         # List, Create, Detail (tracking timeline)
    ├── Fleet/
    ├── Drivers/
    ├── Companies/
    ├── Invoices/
    ├── Analytics/
    ├── Users/
    └── Routes/
```

---

## Data Model Overview

```
Company (SHIPPER/TRANSPORTER/BROKER/CONSIGNEE)
    │
    ├── User (role: SUPER_ADMIN/ADMIN/MANAGER/OPERATOR/VIEWER/TRANSPORTER)
    ├── Vehicle (TRUCK/TRAILER/CONTAINER/TANKER...)
    └── Driver

RFQ (OPEN → QUOTED → AWARDED)
    └── Quote[] (from transporters) ──→ awardedQuote ──→ Shipment

Shipment (PENDING → ASSIGNED → IN_TRANSIT → DELIVERED → COMPLETED)
    ├── TrackingEvent[] (real-time, via Socket.io)
    ├── POD[] (image uploads)
    └── Invoice (PENDING → APPROVED → PAID)

Route (origin/destination master for quick selection)
GoodsType (reference data: FMCG, Pharma, Electronics...)
```

---

## Authentication Flow

```
1. POST /api/auth/login → { token, user }
2. Store token in localStorage
3. All API calls: Authorization: Bearer <token>
4. JWT interceptor on 401 → clear storage → redirect /login
5. Role guards on backend: authorize('ADMIN', 'MANAGER')
6. Role guards on frontend: canManage(), isAdmin() helpers
```

---

## Real-Time Tracking Flow

```
1. Frontend connects: io('http://localhost:5000')
2. On shipment detail open: socket.emit('join_shipment', shipmentId)
3. Backend POST /shipments/:id/tracking creates TrackingEvent
4. Backend: io.to('shipment_${id}').emit('tracking_update', event)
5. All subscribed clients receive live update
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| PostgreSQL over MongoDB | Strong relational integrity for financial/logistics data |
| Prisma ORM | Type-safe queries, excellent migration tooling |
| JWT (stateless) | Easy horizontal scaling, no session store needed |
| Socket.io for tracking | Real-time push without polling, room-based isolation |
| Vite + React | Fast dev builds, great DX, no CRA overhead |
| Tailwind CSS | Utility-first, no CSS file sprawl, easy dark theme |
| Docker Compose | Single-command self-hosting, reproducible environments |

---

## Extending HaulSync

### Adding a new module

1. Add Prisma model to `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_module`
3. Create `backend/src/routes/yourmodule.js`
4. Register in `backend/server.js`: `app.use('/api/yourmodule', require('./src/routes/yourmodule'))`
5. Create `frontend/src/pages/YourModule/` React page
6. Add route in `frontend/src/App.jsx`
7. Add nav item in `frontend/src/components/Layout/Sidebar.jsx`
