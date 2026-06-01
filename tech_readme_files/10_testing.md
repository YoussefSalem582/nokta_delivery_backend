# 10 — Testing

## Unit tests

```bash
npm test
npm run test:cov
```

- Co-locate `*.spec.ts` with services under `src/modules/`
- Mock `PrismaService` and Redis/queue dependencies

## E2E

```bash
npm run test:e2e
```

Requires test database configuration (see `test/` and `jest-e2e.json`).

## After changes

Run `npm test` for touched modules before opening a PR.
