---
name: add-message-keys
description: Add bilingual API message keys (English and Arabic) for success and error responses. Use when adding new user-facing API messages.
---

# Add Message Keys

Reference `tech_readme_files/05_how_to_add_message_keys.md`.

## Step 1 — Constants

Add keys to `src/common/messages/message-keys.ts` following `domain.action.result` naming.

## Step 2 — Translations

Ensure EN + AR strings exist where messages are built (often inline in `message-keys.ts` or a dedicated messages map — match existing pattern in that file).

## Step 3 — Use in service/controller

Return via `successResponse()` / exception filter using the new `messageKey`.

## Step 4 — Docs

Note new keys in `docs/API.md` if they are part of a public flow.
