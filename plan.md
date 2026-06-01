You are working inside this project:

D:\projects\nokta\nokta_delivery_app

Build the backend for the Flutter app “Nokta”, an Egypt-focused ride-hailing and delivery platform.

Primary goal:
Create a production-ready backend that supports riders, drivers, deliveries, live location tracking, push notifications, offline-first sync, bilingual English/Arabic messaging, and admin-friendly APIs. The backend must match the quality of the Flutter frontend and be structured as a serious freelance showcase project.

Workflow rules:

- Work in clean feature branches only.
- Never make large unrelated changes in one branch.
- Keep each branch focused on one small task.
- Use small, clear, detailed commits.
- Prefer commit messages that explain the reason and the scope.
- Before moving to the next task, make sure the current task is cleanly completed, tested, and committed.
- If code needs refactoring, do it in a separate branch.
- If a task becomes too large, split it into multiple branches.
- Keep changes minimal and reviewable.
- Do not mix backend setup, business logic, tests, and docs in the same commit unless they are tightly related.

Suggested branch naming:

- feature/auth-jwt
- feature/ride-creation
- feature/location-tracking
- feature/push-notifications
- feature/offline-sync
- feature/admin-apis
- test/ride-service
- refactor/database-schema
- docs/api-readme

Commit style:

- Make small commits only.
- Each commit should represent one logical step.
- Example commit messages:
  - chore: initialize backend project structure
  - feat(auth): add JWT login and refresh token flow
  - feat(rides): add ride request API
  - feat(location): broadcast driver updates with socket.io
  - test(rides): add ride service unit tests
  - docs: add setup and environment variables
- Keep messages specific and informative.

Tech stack:

- Node.js with TypeScript
- NestJS preferred, or Express if necessary
- PostgreSQL for database
- Prisma or TypeORM for ORM
- Redis for caching, queues, and live state
- Socket.io for real-time updates
- Firebase Admin SDK for notifications
- JWT with refresh tokens
- Swagger/OpenAPI
- Jest for tests
- Docker and docker-compose
- Zod or class-validator for DTO validation
- BullMQ for background jobs
- ESLint + Prettier

Project context:

- The frontend already exists in:
  D:\projects\nokta\nokta_delivery_app
- The frontend is Flutter, built with Clean Architecture, BLoC, offline-first behavior, dark/light themes, localization, responsive UI, Talker logging, animations, and transitions.
- The backend must integrate cleanly with that frontend.

Functional requirements:

1) Authentication

- Register, login, logout, refresh token, forgot password.
- Roles: rider, driver, courier, admin.
- Device token registration for push notifications.

1) Ride-hailing

- Create ride request.
- Accept/reject ride.
- Start ride.
- End ride.
- Cancel ride.
- Estimate fare.
- Ride history and active ride APIs.

1) Delivery

- Create delivery request.
- Assign courier.
- Update pickup/drop-off status.
- Delivery history and tracking.

1) Location tracking

- Save driver location updates.
- Broadcast live position updates.
- Store last known location in Redis.
- Persist trip events in PostgreSQL.

1) Push notifications

- Send notifications for ride accepted, driver arriving, trip started, trip ended, delivery assigned, delivery completed.
- Queue notifications for retry safety.

1) Offline-first support

- Add idempotency for repeated client requests.
- Add sync endpoints for queued offline actions.
- Support status reconciliation after reconnect.

1) Localization-ready API

- Return stable message keys.
- Support English and Arabic message keys in responses.

1) Admin-ready APIs

- Users, drivers, rides, deliveries, analytics, reports, and moderation.

Architecture rules:

- Use modular or feature-based structure.
- Separate controllers, services, repositories, DTOs, entities, gateways, and jobs.
- Keep business logic out of controllers.
- Make the code easy to test and extend.
- Add a clear folder structure like:
  src/
    modules/
    common/
    config/
    database/
    realtime/
    jobs/
    tests/

Database entities:

- users
- driver_profiles
- rider_profiles
- vehicle_profiles
- rides
- deliveries
- ride_locations
- delivery_locations
- ride_events
- delivery_events
- device_tokens
- notifications
- refresh_tokens
- sync_requests
- audit_logs

Output expectations:

- Generate the backend step by step in small clean tasks.
- After each task, ensure the code is formatted, tested, and committed.
- Prefer one branch per task and one purpose per commit.
- Add README.md with setup instructions, environment variables, run commands, API examples, and deployment notes.
- Add .env.example, Dockerfile, and docker-compose.
- Add Swagger docs.
- Add tests for auth, ride creation, delivery creation, location updates, and notifications.
- Keep the code production-oriented, but do not overbuild unnecessary features.

Important product note:
This backend is for “Nokta”, an Egypt-focused premium ride-hailing and delivery app designed as a freelance portfolio showcase.
