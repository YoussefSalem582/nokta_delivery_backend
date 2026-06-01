---
description: "Prisma schema, migrations, Redis"
globs: "prisma/**,src/database/**"
alwaysApply: false
---

# Database

## Prisma

- Schema: `prisma/schema.prisma`
- Migrations: `npm run prisma:migrate` (dev), deploy in Docker entrypoint for prod
- Seed: `npm run prisma:seed`
- Access only via `PrismaService` in services — not controllers

## Redis

- Live driver location and caching via `src/database/redis.module.ts`
- Keys/constants in `src/database/redis.constants.ts`

## Status enums

Prisma enums may differ from Flutter strings — always map in `src/common/mappers/status.mapper.ts` for API output.
