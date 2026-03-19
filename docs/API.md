# HaulSync — API Reference

Base URL: `http://localhost:5000/api`

All protected endpoints require: `Authorization: Bearer <JWT_TOKEN>`

---

## Authentication

### POST `/auth/login`
**Body:** `{ email, password }`  
**Response:** `{ token, user }`

### GET `/auth/me`
Returns the currently authenticated user.

### POST `/auth/change-password`
**Body:** `{ currentPassword, newPassword }`

---

## Users

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/users` | List users (paginated) | SUPER_ADMIN, ADMIN |
| POST | `/users` | Create user | SUPER_ADMIN, ADMIN |
| PUT | `/users/:id` | Update user | SUPER_ADMIN, ADMIN |
| DELETE | `/users/:id` | Deactivate user | SUPER_ADMIN |

**Query params (GET):** `page`, `limit`, `search`, `role`

---

## Companies

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/companies` | List companies | All |
| GET | `/companies/:id` | Company details | All |
| POST | `/companies` | Create company | ADMIN+ |
| PUT | `/companies/:id` | Update company | ADMIN+ |
| DELETE | `/companies/:id` | Deactivate company | SUPER_ADMIN, ADMIN |

**Query params (GET):** `page`, `limit`, `search`, `type` (SHIPPER|TRANSPORTER|BROKER|CONSIGNEE|BOTH)

---

## RFQ (Indenting)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/rfq` | List RFQs | All |
| GET | `/rfq/:id` | RFQ detail with quotes | All |
| POST | `/rfq` | Create RFQ | ADMIN, MANAGER, OPERATOR |
| PUT | `/rfq/:id` | Update RFQ | ADMIN, MANAGER |
| DELETE | `/rfq/:id` | Cancel RFQ | ADMIN, MANAGER |
| POST | `/rfq/:id/quote` | Submit quote | TRANSPORTER |
| POST | `/rfq/:id/award/:quoteId` | Award a quote | ADMIN, MANAGER |

**Create RFQ body:**
```json
{
  "title": "Mumbai to Delhi FMCG",
  "shipperCompanyId": "uuid",
  "originCity": "Mumbai",
  "originState": "Maharashtra",
  "destCity": "Delhi",
  "destState": "Delhi",
  "vehicleType": "TRUCK",
  "goodsTypeId": "uuid",
  "quantity": 2,
  "weight": 10.5,
  "loadingDate": "2024-03-15T06:00:00Z",
  "basePrice": 45000
}
```

**Submit Quote body:**
```json
{ "amount": 42000, "validUntil": "2024-03-12T18:00:00Z", "notes": "Includes toll charges" }
```

---

## Shipments

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/shipments` | List shipments | All |
| GET | `/shipments/:id` | Shipment detail | All |
| POST | `/shipments` | Create shipment | ADMIN, MANAGER, OPERATOR |
| PUT | `/shipments/:id` | Update shipment | ADMIN, MANAGER, OPERATOR |
| POST | `/shipments/:id/tracking` | Add tracking event | All |
| POST | `/shipments/:id/pod` | Upload POD (multipart) | All |

**Tracking Event Types:** `DEPARTED`, `REACHED_CHECKPOINT`, `HALTED`, `RESUMED`, `REACHED_DESTINATION`, `DELIVERED`

**Add Tracking body:**
```json
{
  "eventType": "REACHED_CHECKPOINT",
  "location": "Near Khalapur Toll",
  "city": "Khopoli",
  "state": "Maharashtra",
  "latitude": 18.75,
  "longitude": 73.31,
  "notes": "Brief halt for driver rest"
}
```

**POD Upload:** `multipart/form-data` with field `podImage` (file), `signedBy`, `notes`

---

## Fleet

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/fleet` | List vehicles | All |
| GET | `/fleet/:id` | Vehicle detail | All |
| POST | `/fleet` | Add vehicle | ADMIN, MANAGER |
| PUT | `/fleet/:id` | Update vehicle | ADMIN, MANAGER |
| DELETE | `/fleet/:id` | Deactivate | SUPER_ADMIN, ADMIN |

**Vehicle Types:** `TRUCK`, `TRAILER`, `CONTAINER`, `TANKER`, `REFRIGERATED`, `FLATBED`, `MINI_TRUCK`, `TEMPO`

---

## Drivers

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/drivers` | List drivers | All |
| GET | `/drivers/:id` | Driver detail | All |
| POST | `/drivers` | Add driver | ADMIN, MANAGER |
| PUT | `/drivers/:id` | Update driver | ADMIN, MANAGER |
| DELETE | `/drivers/:id` | Deactivate | SUPER_ADMIN, ADMIN |

---

## Invoices

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/invoices` | List invoices | All |
| POST | `/invoices` | Create invoice | ADMIN, MANAGER |
| PUT | `/invoices/:id` | Update status | ADMIN, MANAGER |

**Invoice Statuses:** `PENDING` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` / `DISPUTED` → `PAID`

---

## Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/dashboard` | Summary stats + recent shipments |
| GET | `/analytics/transporter-performance` | Win rates per transporter |
| GET | `/analytics/route-analysis` | Trip counts + avg freight per route |

---

## Goods & Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/goods` | List goods types |
| POST | `/goods` | Create goods type |
| GET | `/routes` | List freight routes |
| POST | `/routes` | Create route |
| PUT | `/routes/:id` | Update route |

---

## WebSocket (Real-time Tracking)

Connect to: `ws://localhost:5000`

```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:5000');

// Subscribe to shipment updates
socket.emit('join_shipment', shipmentId);
socket.on('tracking_update', (event) => {
  console.log('New tracking event:', event);
});
```

---

## Pagination

All list endpoints support:
- `page` (default: 1)
- `limit` (default: 20)

Response format:
```json
{ "data": [...], "total": 100, "page": 1, "limit": 20 }
```

---

## Error Responses

```json
{ "message": "Description of error" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not found |
| 409 | Conflict (duplicate record) |
| 500 | Internal server error |
