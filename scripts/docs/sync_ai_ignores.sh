#!/usr/bin/env bash
# ============================================================
# sync_ai_ignores.sh - Regenerate all AI-agent ignore files from
# scripts/docs/ai_ignore_template.txt. Unix/macOS counterpart to
# scripts/sync_ai_ignores.ps1.
#
# Usage:
#   bash scripts/sync_ai_ignores.sh            # regenerate
#   bash scripts/sync_ai_ignores.sh --check    # CI verify mode (exit 1 on drift)
#
# `.gitignore` is intentionally NOT regenerated - it is git-native, not
# AI-specific, and is hand-curated.
# ============================================================

set -euo pipefail

CHECK=0
if [[ "${1:-}" == "--check" ]]; then
    CHECK=1
fi

# Repo root = parent dir of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "${SCRIPT_DIR}/../.." && pwd )"
TEMPLATE="${REPO_ROOT}/scripts/docs/ai_ignore_template.txt"

if [[ ! -f "${TEMPLATE}" ]]; then
    echo "Template not found: ${TEMPLATE}" >&2
    exit 2
fi

# Strip the leading "# ===... # ===" documentation block from the template
# (matching scripts/sync_ai_ignores.ps1 behaviour). Awk reads in one pass:
# skip lines until after the second banner; emit everything from there.
RULES_BODY=$(awk '
    BEGIN { banners = 0; started = 0 }
    /^# ={3,}/ {
        banners++
        if (banners == 2) { started = 1; next }
        next
    }
    started == 1 { print }
' "${TEMPLATE}")
# Drop leading blank lines so banner supplies the single spacer line.
RULES_BODY="${RULES_BODY#"${RULES_BODY%%[![:space:]]*}"}"
# Normalize to LF-only and a single trailing newline.
RULES_BODY="$(printf '%s' "${RULES_BODY}" | tr -d '\r')"
[[ -n "${RULES_BODY}" ]] && RULES_BODY="${RULES_BODY}"$'\n'

normalize_text() {
    local text="$1"
    text="$(printf '%s' "${text}" | tr -d '\r')"
    text="${text%"${text##*[![:space:]]}"}"
    printf '%s\n' "${text}"
}

# Build per-agent content. Layout: header + rules body.
build_content() {
    local agent_file="$1"
    local agent_name="$2"
    local header="# ============================================================
# ${agent_file} - Exclude from ${agent_name} context
# AUTO-GENERATED from scripts/docs/ai_ignore_template.txt
# DO NOT EDIT BY HAND. To change exclusions, edit the template and re-run the sync.
# Paths are relative to this file's location (repo root).
# ============================================================
"
    normalize_text "${header}${RULES_BODY}"
}

# Tuple list: "filename|display name"
AGENTS=(
    ".agentignore|Generic AI agents (.agents/)"
    ".aiderignore|Aider"
    ".claudeignore|Claude Code"
    ".codexignore|OpenAI Codex CLI"
    ".copilotignore|GitHub Copilot"
    ".cursorignore|Cursor IDE"
    ".cursorindexingignore|Cursor IDE (indexing-only)"
    ".geminiignore|Google Gemini"
    ".windsurfignore|Windsurf"
)

drift_list=()

for entry in "${AGENTS[@]}"; do
    agent_file="${entry%%|*}"
    agent_name="${entry#*|}"
    target_path="${REPO_ROOT}/${agent_file}"
    desired="$(build_content "${agent_file}" "${agent_name}")"

    if [[ ${CHECK} -eq 1 ]]; then
        if [[ ! -f "${target_path}" ]]; then
            drift_list+=("MISSING: ${agent_file}")
            continue
        fi
        current="$(normalize_text "$(cat "${target_path}")")"
        desired="$(normalize_text "${desired}")"
        if [[ "${current}" != "${desired}" ]]; then
            drift_list+=("DRIFT:   ${agent_file}")
        fi
    else
        normalize_text "${desired}" > "${target_path}"
        echo "Wrote: ${agent_file}"
    fi
done

if [[ ${CHECK} -eq 1 ]]; then
    if [[ ${#drift_list[@]} -gt 0 ]]; then
        echo
        echo "AI ignore files are out of sync with scripts/docs/ai_ignore_template.txt:" >&2
        for d in "${drift_list[@]}"; do
            echo "  ${d}" >&2
        done
        echo
        echo "Run \`bash scripts/sync_ai_ignores.sh\` to regenerate." >&2
        exit 1
    else
        echo "All ${#AGENTS[@]} AI ignore files match the template."
        exit 0
    fi
else
    echo
    echo "Synced ${#AGENTS[@]} AI ignore files from scripts/docs/ai_ignore_template.txt"
fi
