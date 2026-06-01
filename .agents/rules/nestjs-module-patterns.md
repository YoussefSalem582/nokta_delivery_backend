---
description: "NestJS module layout — controller, service, DTOs"
globs: "src/modules/**"
alwaysApply: false
---

# NestJS Module Patterns

## Layout

```
src/modules/<domain>/
├── <domain>.module.ts
├── <domain>.controller.ts
├── <domain>.service.ts
├── dto/
└── *.spec.ts
```

## Rules

- Controllers: routing, guards, Swagger decorators only — delegate to services.
- Services: business logic, Prisma calls, Redis, enqueue jobs.
- Register new modules in `src/app.module.ts`.
- Use `@CurrentUser()` decorator for authenticated user id.
- Use `@Roles()` for role-gated routes.

## Testing

Co-locate `*.spec.ts` with services; mock `PrismaService` and external deps.
