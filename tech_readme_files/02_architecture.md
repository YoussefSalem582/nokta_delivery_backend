# 02 — Architecture

## NestJS modular monolith

```
HTTP (Controllers)
     ↓
Services (business logic)
     ↓
Prisma / Redis / BullMQ / Firebase
```

## Cross-cutting

| Concern | Implementation |
|---------|----------------|
| Auth | JWT + Passport; `@Roles()` guard |
| Validation | Global `ValidationPipe` + DTOs |
| Errors | `GlobalExceptionFilter` + `messageKey` |
| Idempotency | `IdempotencyInterceptor` |
| Real-time | `LocationGateway` (Socket.io) |
| Jobs | `NotificationProcessor` (BullMQ) |

## Flutter contract

Trip and delivery list/detail endpoints return JSON shapes expected by the Flutter app. Status strings are mapped in `src/common/mappers/status.mapper.ts`.

See [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) for local dev issues.
