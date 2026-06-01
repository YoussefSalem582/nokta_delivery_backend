# 01 — Folder Structure

```
nokta_delivery_backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/           # guards, filters, interceptors, mappers, message keys
│   ├── config/
│   ├── database/         # Prisma + Redis modules
│   ├── modules/          # feature modules (auth, rides, drivers, …)
│   ├── realtime/         # Socket.io gateways
│   └── jobs/             # BullMQ processors
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── test/                 # e2e tests
├── docs/                 # API.md, OpenAPI, Postman
├── scripts/              # OpenAPI export, doc hygiene
├── tech_readme_files/    # extended technical docs
└── AGENTS.md             # canonical AI agent guide
```
