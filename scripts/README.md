# Doc scripts — run from repo root

| Script | Purpose |
|--------|---------|
| `scripts/docs/sync_ai_ignores.ps1` | Regenerate AI ignore files from template |
| `scripts/docs/check_docs_freshness.ps1` | Verify package.json version in README / CURRENT_STATUS |
| `scripts/docs/sync_ai_ignores.sh` | Unix sync (CI) |
| `scripts/docs/check_docs_freshness.sh` | Unix freshness check (CI) |

Root shims:

- `scripts/sync_ai_ignores.ps1` → `scripts/docs/sync_ai_ignores.ps1`
- `scripts/check_docs_freshness.ps1` → `scripts/docs/check_docs_freshness.ps1`
