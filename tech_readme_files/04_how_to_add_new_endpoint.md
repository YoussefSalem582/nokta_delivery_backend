# 04 — How to Add a New Endpoint

1. Add DTO with `class-validator` in `dto/`.
2. Implement service method (Prisma / Redis as needed).
3. Add controller route with guards and Swagger decorators.
4. Use `message-keys.ts` + `api-response.ts` for standard envelopes; `status.mapper.ts` for trip/delivery JSON.
5. Extend unit tests in `*.service.spec.ts`.
6. Run `npm run docs:openapi` and update `docs/API.md` if public.
7. Update mandatory docs.

Skill: [`.agents/skills/add-endpoint/SKILL.md`](../.agents/skills/add-endpoint/SKILL.md)
