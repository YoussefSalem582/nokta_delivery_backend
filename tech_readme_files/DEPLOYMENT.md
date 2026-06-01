# Deployment

> [INDEX](INDEX.md) > Deployment

## Prerequisites

- Node.js 22+
- Docker and Docker Compose (recommended for local/staging)
- PostgreSQL 16 and Redis 7

## Environment checklist

Copy [`.env.example`](../.env.example) to `.env` and set:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Always | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Always | Min 32 characters |
| `JWT_REFRESH_SECRET` | Always | Min 32 characters |
| `REDIS_HOST` | Production | Required when `NODE_ENV=production` |
| `REDIS_PORT` | Production | Required when `NODE_ENV=production` |
| `FIREBASE_*` | Optional | Push notifications; API starts without them |
| `CORS_ORIGIN` | Production | Set to your app origin(s), not `*` |

## Docker Compose (local / staging)

```powershell
docker compose up -d
npm run prisma:migrate
npm run prisma:seed
npm run start:prod
```

Services:

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs`

## Health probes

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Liveness |
| `GET /api/health/ready` | Readiness (PostgreSQL + Redis) |

Configure orchestrators to use `/api/health/ready` as the readiness probe. A `503` indicates database or Redis is unavailable.

## Production notes

- Do **not** run `prisma:seed` in production unless you intend to create demo accounts.
- Password reset tokens are logged to the console in development only; wire an email provider before production.
- Rate limiting is enabled on auth routes; tune limits in `auth.controller.ts` if needed.
- Firebase: without credentials, notifications remain `PENDING` and are logged at debug level.

## Build artifact

```powershell
npm ci
npm run build
node dist/main.js
```

Or use the `api` service in `docker-compose.yml`, which builds from the root `Dockerfile`.
