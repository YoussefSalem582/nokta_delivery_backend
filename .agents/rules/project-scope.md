---
description: "Project scope — Nokta Delivery Backend (NestJS)"
alwaysApply: true
---

# Project Scope

**Only work on `nokta_delivery_backend/` (Nokta API).**

## Project Overview

- **API**: Nokta — Egypt ride-hailing / delivery backend (`0.1.0`)
- **Framework**: NestJS 11 + TypeScript
- **Database**: PostgreSQL + Prisma
- **Cache / live**: Redis
- **Real-time**: Socket.io (`src/realtime/`)
- **Queues**: BullMQ (notifications)
- **Auth**: JWT + roles (RIDER, DRIVER, COURIER, ADMIN)
- **Client**: Flutter app in `../nokta_delivery_app` — keep API shapes compatible

## Entry Points

| File | Purpose |
|------|---------|
| `src/main.ts` | Bootstrap, Swagger, validation |
| `src/app.module.ts` | Root module |
| `AGENTS.md` | Canonical agent conventions — read before multi-file edits |
