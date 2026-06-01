---
description: "Auth, env secrets, guards"
globs: "src/modules/auth/**,src/common/guards/**,src/config/**,.env.example"
alwaysApply: false
---

# Security

- Never commit `.env` — document vars in `.env.example`
- JWT via `JwtAuthGuard` + `jwt.strategy.ts`
- Role checks via `@Roles()` and `RolesGuard`
- Passwords: bcrypt in `auth.service.ts`
- Firebase Admin: env-only credentials
- Do not log access tokens or refresh tokens
