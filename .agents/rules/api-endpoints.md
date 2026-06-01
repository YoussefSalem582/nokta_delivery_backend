---
description: "HTTP endpoints — DTOs, Swagger, Flutter-compatible responses"
globs: "src/modules/**/*.controller.ts,src/modules/**/dto/**"
alwaysApply: false
---

# API Endpoints

## Flow

1. Define `class-validator` DTO in `dto/`
2. Implement service method (Prisma + business rules)
3. Add controller route with guards and `@Api*` decorators
4. For mutations with standard envelope: use `message-keys.ts` + `api-response.ts`
5. For trip/delivery reads: map status via `status.mapper.ts`

## Flutter paths

Preserve existing path prefixes (`/trips`, `/v1/driver/*`, `/orders`, etc.). See `docs/API.md`.

## Idempotency

Mutating routes that support offline retry should work with `IdempotencyInterceptor` (header `Idempotency-Key`).

## OpenAPI

After DTO/controller changes: `npm run docs:openapi`
