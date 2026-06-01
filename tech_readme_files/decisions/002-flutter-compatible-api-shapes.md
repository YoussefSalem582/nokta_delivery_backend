# ADR 002 — Flutter-Compatible API Shapes

**Status:** Accepted

## Context

The Flutter client was built against mock JSON with specific field names and status strings (`inProgress`, `driverArrived`, etc.).

## Decision

- Trip/delivery list and detail endpoints return plain JSON matching the client
- Map Prisma enums through `src/common/mappers/status.mapper.ts`
- Preserve path prefixes from `api_endpoints.dart` (`/trips`, `/v1/driver/*`, `/orders`)

## Consequences

- Schema changes require mapper updates and Flutter coordination
