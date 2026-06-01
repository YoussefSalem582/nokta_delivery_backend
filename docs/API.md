# Nokta API Reference

Production API for the **Nokta** Egypt-focused ride-hailing and delivery platform.

| Resource | Location |
|----------|----------|
| Live Swagger UI | `http://localhost:3000/api/docs` |
| OpenAPI 3.0 JSON | [`openapi/nokta-api.openapi.json`](./openapi/nokta-api.openapi.json) |
| Postman collection | [`postman/nokta-api.postman_collection.json`](./postman/nokta-api.postman_collection.json) |
| Postman environment | [`postman/nokta-api.local.postman_environment.json`](./postman/nokta-api.local.postman_environment.json) |

## Base URL

| Environment | URL |
|-------------|-----|
| Local | `http://localhost:3000/api` |
| Production | `https://api.nokta.app/api` (example) |

## Authentication

Most endpoints require a JWT bearer token:

```http
Authorization: Bearer <access_token>
```

Obtain tokens via `POST /v1/auth/login` or `POST /v1/auth/register`. Refresh with `POST /v1/auth/refresh`.

### Demo accounts (after `npm run prisma:seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@nokta.app` | `AdminPass123!` |
| Rider | `rider@nokta.app` | `RiderPass123!` |

## Response format

Successful mutations return bilingual message keys:

```json
{
  "success": true,
  "messageKey": "auth.login.success",
  "message": {
    "en": "Login successful",
    "ar": "تم تسجيل الدخول بنجاح"
  },
  "data": { }
}
```

Trip and delivery resources return **Flutter-compatible** plain JSON (e.g. `status: "inProgress"`).

## Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Most routes | `Bearer <access_token>` |
| `Accept-Language` | Optional | `en` or `ar` (client hint) |
| `Idempotency-Key` | Optional | UUID for safe offline retries on POST/PATCH/PUT |
| `Content-Type` | Body routes | `application/json` |

## Endpoint overview

### Health (public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/health/ready` | Readiness incl. database and Redis |

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/register` | Public | Register rider/driver/courier |
| POST | `/v1/auth/login` | Public | Email + password login |
| POST | `/v1/auth/refresh` | Public | Refresh access token |
| POST | `/v1/auth/logout` | Bearer | Revoke refresh tokens |
| POST | `/v1/auth/forgot-password` | Public | Request reset token |
| POST | `/v1/auth/reset-password` | Public | Reset with token |
| POST | `/v1/auth/device-token` | Bearer | Register FCM push token |

### Profile (Flutter-compatible)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/profile` | Current user profile |
| GET | `/riders` | List riders (demo/admin) |

### Trips / Ride-hailing

| Method | Path | Description |
|--------|------|-------------|
| GET | `/trips` | Trip history for current user |
| GET | `/trips/active` | Active trip if any |
| GET | `/trips/:id` | Trip detail |
| POST | `/trips/request` | Request a new ride |
| PATCH | `/trips/:id/status` | Update status (`cancelled`, etc.) |
| POST | `/rides/estimate-fare` | Fare estimate (EGP) |

**Trip status values:** `requested` · `accepted` · `driverArrived` · `inProgress` · `completed` · `cancelled`

### Driver (Flutter `/v1/driver/*`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/driver/register` | Register driver profile + vehicle |
| GET | `/v1/driver/profile` | Driver profile |
| PATCH | `/v1/driver/availability` | `offline` · `online` · `onTrip` |
| GET | `/v1/driver/offers` | Pending ride offers |
| POST | `/v1/driver/offers/:tripId/accept` | Accept ride |
| POST | `/v1/driver/offers/:tripId/decline` | Decline ride |
| PATCH | `/v1/driver/trips/:tripId/status` | Driver status updates |
| PATCH | `/v1/driver/trips/:tripId/location` | Live location during trip |
| GET | `/drivers` | List registered drivers |
| GET | `/drivers/:driverId/reviews` | Driver rating summary (v1; empty review list) |

### Deliveries

| Method | Path | Description |
|--------|------|-------------|
| POST | `/deliveries` | Create delivery request |
| GET | `/deliveries` | List for current user |
| GET | `/deliveries/:id` | Delivery detail |
| GET | `/deliveries/:id/tracking` | Live + historical locations |
| PATCH | `/deliveries/:id/location` | Courier location update |
| PATCH | `/deliveries/:id/status` | Status update |
| PATCH | `/deliveries/:id/assign` | Assign courier (admin) |
| GET | `/orders` | Flutter alias for deliveries list |

**Delivery status values:** `requested` · `assigned` · `pickedUp` · `inTransit` · `delivered` · `cancelled`

### Offline sync

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/sync/actions` | Process queued offline actions |
| GET | `/v1/sync/reconcile` | Reconcile state after reconnect |

### Admin (`ADMIN` role)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/admin/users` | List users (`?role=RIDER`) |
| PATCH | `/v1/admin/users/:id/deactivate` | Deactivate user |
| GET | `/v1/admin/rides` | All rides |
| GET | `/v1/admin/deliveries` | All deliveries |
| GET | `/v1/admin/audit-logs` | Moderation audit trail |
| GET | `/v1/admin/analytics/overview` | Platform metrics |

## Real-time (Socket.io)

Connect to namespace `/realtime`:

| Event | Direction | Payload |
|-------|-----------|---------|
| `joinRide` | Client → Server | `{ "rideId": "..." }` |
| `driverLocation` | Client → Server | `{ "userId", "lat", "lng", "heading?" }` |
| `rideLocation` | Server → Client | Live ride position broadcast |

## Postman quick start

1. Import `postman/nokta-api.postman_collection.json`
2. Import `postman/nokta-api.local.postman_environment.json`
3. Select **Nokta API — Local** environment
4. Run **Auth → Login** (tokens saved automatically)
5. Run trip/driver/delivery requests

## Regenerate OpenAPI spec

After code changes to controllers or DTOs:

```bash
npm run docs:openapi
```

This writes an updated `docs/openapi/nokta-api.openapi.json` from NestJS Swagger metadata.

Import the JSON into Postman (**Import → File**) to refresh requests, or use Swagger UI for interactive testing.

## Flutter integration

Point the app base URL to the backend:

```dart
// lib/core/network/api_endpoints.dart
static final baseUrl = EnvConfig.apiBaseUrl; // e.g. http://10.0.2.2:3000/api (Android emulator)
```

Set `--dart-define=API_BASE_URL=http://localhost:3000/api` and `USE_MOCK_DRIVER_API=false` for production driver paths.

## Error codes

| HTTP | Typical cause |
|------|----------------|
| 400 | Validation error |
| 401 | Missing or invalid JWT |
| 403 | Wrong role or trip access |
| 404 | Resource not found |
| 409 | Email already registered |

Errors include `messageKey` with `en` / `ar` translations when using the standard response envelope.
