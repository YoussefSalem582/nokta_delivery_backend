# Nokta Delivery Backend

Production-ready API for **Nokta**, an Egypt-focused ride-hailing and delivery platform. Built with NestJS, PostgreSQL, Redis, Socket.io, and Firebase Cloud Messaging.

## Features

- JWT authentication with refresh tokens, roles (rider, driver, courier, admin)
- Ride-hailing APIs compatible with the Flutter app (`/trips`, `/v1/driver/*`)
- Delivery management with courier assignment
- Live location tracking (Redis + PostgreSQL + Socket.io)
- Push notifications via Firebase Admin SDK with BullMQ retry queue
- Offline-first sync with idempotency keys
- Bilingual API responses (English/Arabic message keys)
- Admin analytics and moderation endpoints
- Swagger docs at `/api/docs`

## Prerequisites

- Node.js 22+
- Docker & Docker Compose (recommended)
- PostgreSQL 16 and Redis 7 (or use docker-compose)

## Quick Start

```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start infrastructure
docker compose up -d postgres redis

# 4. Run migrations
npm run prisma:migrate

# 5. Start dev server
npm run start:dev
```

API: `http://localhost:3000/api`  
Swagger: `http://localhost:3000/api/docs`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `API_PREFIX` | Global route prefix (default: api) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` / `REDIS_PORT` | Redis for caching and live location |
| `JWT_ACCESS_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `FIREBASE_*` | Firebase Admin credentials for push notifications |

See [.env.example](.env.example) for the full list.

## API Examples

### Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ahmed","email":"ahmed@example.com","phone":"+201012345678","password":"SecurePass123!"}'
```

### Request a trip

```bash
curl -X POST http://localhost:3000/api/trips/request \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"pickupAddress":"Tahrir","dropoffAddress":"Maadi","pickupLat":30.0444,"pickupLng":31.2357,"dropoffLat":30.0626,"dropoffLng":31.2497}'
```

### Driver accept offer

```bash
curl -X POST http://localhost:3000/api/v1/driver/offers/<tripId>/accept \
  -H "Authorization: Bearer <driver_token>"
```

## Flutter Integration

The backend mirrors the Flutter app's mock API paths:

| Flutter endpoint | Backend route |
|------------------|---------------|
| `GET /trips` | `GET /api/trips` |
| `POST /trips/request` | `POST /api/trips/request` |
| `GET /profile` | `GET /api/profile` |
| `GET /orders` | `GET /api/orders` |
| `POST /v1/driver/register` | `POST /api/v1/driver/register` |

Update the Flutter `ApiEndpoints.baseUrl` to point to your backend (e.g. `http://localhost:3000/api`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Development with hot reload |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `npm run prisma:migrate` | Apply database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

## Docker Deployment

```bash
docker compose up --build
```

The API container runs migrations on startup and listens on port 3000.

## Project Structure

```
src/
├── common/          # Shared filters, guards, message keys, mappers
├── config/          # Environment configuration
├── database/        # Prisma + Redis modules
├── modules/         # Feature modules (auth, rides, drivers, …)
├── realtime/        # Socket.io gateways
└── jobs/            # Background job processors
```

## Offline-First & Idempotency

Send an `Idempotency-Key` header on `POST`/`PATCH`/`PUT` requests to safely retry offline actions:

```bash
curl -X POST http://localhost:3000/api/trips/request \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: client-action-uuid-001" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

Duplicate requests return the cached response with `messageKey: sync.duplicate`.

Batch offline actions via `POST /api/v1/sync/actions` and reconcile state with `GET /api/v1/sync/reconcile`.

## Testing

```bash
npm test
npm run test:cov
```

## License

Private — portfolio showcase project for Nokta.
