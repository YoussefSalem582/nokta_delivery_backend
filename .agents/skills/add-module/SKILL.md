---
name: add-module
description: Scaffold a new NestJS feature module with controller, service, DTO folder, and unit test stub. Use when adding a new domain area to the API.
---

# Add NestJS Module

Reference `tech_readme_files/03_how_to_add_new_module.md`.

## Step 1 — Module folder

Create `src/modules/<domain>/` with:

- `<domain>.module.ts` — imports `DatabaseModule` or peer modules as needed
- `<domain>.controller.ts` — empty or health-style stub
- `<domain>.service.ts` — inject `PrismaService`
- `dto/` — placeholder or first DTO
- `<domain>.service.spec.ts` — basic test with mocked Prisma

## Step 2 — Register

Add `<Domain>Module` to `imports` in `src/app.module.ts`.

## Step 3 — Swagger (optional)

Add `@ApiTags('<domain>')` on controller when routes are added.

## Step 4 — Docs

Update `CHANGELOG.md`, `DOCUMENTATION_UPDATE_SUMMARY.md`, `CURRENT_STATUS.md`.
