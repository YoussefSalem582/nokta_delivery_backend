# 03 — How to Add a New Module

1. Create `src/modules/<domain>/` with module, controller, service, `dto/`, and `*.service.spec.ts`.
2. Import `DatabaseModule` (or other modules) in `<domain>.module.ts`.
3. Register `<Domain>Module` in `src/app.module.ts`.
4. Add `@ApiTags` when exposing routes.
5. Update `CHANGELOG.md` and status docs.

Skill: [`.agents/skills/add-module/SKILL.md`](../.agents/skills/add-module/SKILL.md)
