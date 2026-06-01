# Flutter live API integration

> [INDEX](INDEX.md) > Flutter integration

Checklist for pointing the Flutter app (`nokta_delivery_app`) at this backend instead of mocks.

## 1. Start the API

```powershell
docker compose up -d
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

Base URL: `http://localhost:3000/api` (or your machine IP for a physical device).

## 2. Flutter environment

In `nokta_delivery_app`, set dart-defines (see `lib/config/environment/env_config.dart`):

| Define | Value |
|--------|--------|
| `USE_MOCK_API` | `false` |
| `USE_MOCK_DRIVER_API` | `false` |
| `API_BASE_URL` | `http://<host>:3000/api` |

Driver routes use `/v1/driver/*` when mocks are off (see `api_endpoints.dart`).

## 3. Contract alignment

| Flutter (`api_endpoints.dart`) | Backend | Status |
|-------------------------------|---------|--------|
| `/v1/auth/*` | `AuthController` | Aligned |
| `/trips`, `/trips/active`, `/trips/request` | `RidesController` | Aligned |
| `/rides/estimate-fare` | `POST rides/estimate-fare` | Aligned |
| `/v1/driver/*` | `DriversController` | Aligned |
| `/drivers/:id/reviews` | `GET drivers/:driverId/reviews` | v1 summary + empty list |
| `/v1/sync/*` | `SyncController` | Aligned |
| `/orders`, `/deliveries` | Deliveries module | Aligned |

Trip JSON uses Flutter status strings via `status.mapper.ts` (`inProgress`, `driverArrived`, etc.).

## 4. Authentication

1. `POST /v1/auth/login` with seed rider: `rider@nokta.app` / `RiderPass123!`
2. Send `Authorization: Bearer <accessToken>` on protected routes.
3. Register device token: `POST /v1/auth/device-token` for push (requires Firebase on server).

## 5. Socket.io realtime

Namespace: `/realtime`

**Handshake (required):**

```dart
IO.io('http://<host>:3000/realtime', <String, dynamic>{
  'transports': ['websocket'],
  'auth': {'token': accessToken},
});
```

Events:

| Event | Direction | Notes |
|-------|-----------|--------|
| `joinRide` | C→S | `{ "rideId": "<uuid>" }` — rider or assigned driver |
| `joinDelivery` | C→S | `{ "deliveryId": "<uuid>" }` — customer or assigned courier |
| `publishRideLocation` | C→S | `{ "rideId", "lat", "lng", "heading?", "speed?" }` — assigned driver during trip |
| `publishDeliveryLocation` | C→S | `{ "deliveryId", "lat", "lng", "heading?" }` — assigned courier during delivery |
| `driverLocation` | C→S | `{ "userId", "lat", "lng", "heading?" }` — idle driver GPS |
| `rideLocation` | S→C | Live ride position for room `ride:{rideId}` |
| `deliveryLocation` | S→C | Live courier position for room `delivery:{deliveryId}` |

HTTP tracking fallbacks:

- `GET /api/trips/:id/tracking` — `{ trip, live, history }`
- `GET /api/deliveries/:id/tracking` — `{ delivery, live, history }`

## 6. Verification tools

- Swagger: `http://localhost:3000/api/docs`
- Postman: [`docs/postman/`](../docs/postman/)
- Backend e2e: `npm run test:e2e` (includes ride-flow smoke)

## 7. Common issues

| Symptom | Fix |
|---------|-----|
| 401 on trips | Login first; check token header |
| Driver 404 on register | User must have `DRIVER` role or register via auth with role |
| WebSocket disconnects immediately | Pass JWT in `auth.token` handshake |
| 429 on login | Auth rate limit; wait 60s or adjust throttler in dev |

See also [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) and [`COMMON_PITFALLS.md`](COMMON_PITFALLS.md).
