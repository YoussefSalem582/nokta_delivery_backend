# Common Pitfalls

1. **Prisma status in API** — Always map to Flutter strings via `status.mapper.ts`.
2. **Secrets in code** — Use `ConfigService` and `.env`, never commit `.env`.
3. **Business logic in controllers** — Keep controllers thin; use services.
4. **Skipping docs** — Update CHANGELOG + `DOCUMENTATION_UPDATE_SUMMARY` + `CURRENT_STATUS` after meaningful changes.
5. **Breaking Flutter paths** — Cross-check `nokta_delivery_app/lib/core/network/api_endpoints.dart` before renaming routes.
6. **OpenAPI drift** — Run `npm run docs:openapi` after controller/DTO changes.
