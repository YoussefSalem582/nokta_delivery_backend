# Documentation Update Summary

> Rolling log of documentation changes. Newest entries first.

---

## 2026-06-01 — Production hardening and Flutter integration

**What changed:** Added CI workflow, Redis readiness probe, auth rate limiting, HTTP logging interceptor, JWT Socket.io auth, driver reviews endpoint, deployment and Flutter integration guides, ride-flow e2e test, OpenAPI refresh.

**Files touched:** `.github/workflows/ci.yml`, `src/app.module.ts`, `src/config/env.validation.ts`, `src/modules/health/*`, `src/modules/auth/auth.controller.ts`, `src/modules/drivers/*`, `src/realtime/*`, `src/common/interceptors/logging.interceptor.ts`, `src/common/filters/global-exception.filter.ts`, `src/common/messages/message-keys.ts`, `test/*`, `tech_readme_files/DEPLOYMENT.md`, `tech_readme_files/FLUTTER_INTEGRATION.md`, `CHANGELOG.md`, `docs/API.md`, `docs/openapi/nokta-api.openapi.json`, `package.json`, `.env.example`

---

## 2026-06-01 — AI agent documentation surface

**What changed:** Added canonical `AGENTS.md`, tool shims (`CLAUDE.md`, `CURSOR.md`, `.codex/`, `.github/copilot-instructions.md`), `.agents/skills/` (add-module, add-endpoint, add-message-keys), `.cursor/rules/`, `.claude/commands/`, `tech_readme_files/` doc map, doc-hygiene scripts, and `.github/workflows/docs.yml`.

**Files touched:** `AGENTS.md`, `CHANGELOG.md`, `CLAUDE.md`, `CURSOR.md`, `.agents/**`, `.cursor/**`, `.codex/**`, `.claude/**`, `.github/**`, `tech_readme_files/**`, `scripts/**`, `.markdownlint-cli2.jsonc`, `README.md`

---
