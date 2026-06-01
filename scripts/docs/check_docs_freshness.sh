#!/usr/bin/env bash
# Verify package.json version appears in README.md and CURRENT_STATUS.md.

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "${SCRIPT_DIR}/../.." && pwd )"
PKG="${REPO_ROOT}/package.json"

if [[ ! -f "${PKG}" ]]; then
    echo "package.json not found" >&2
    exit 2
fi

version="$( node -p "require('${PKG//\\/\\\\}').version" 2>/dev/null || python -c "import json; print(json.load(open('${PKG}'))['version'])" )"
if [[ -z "${version}" ]]; then
    echo "No version in package.json" >&2
    exit 2
fi

printf 'package.json version: %s\n' "${version}"

status_fail=0
re_version="$( printf '%s' "${version}" | sed -e 's/[]\/$*.^[]/\\&/g' )"

check_file() {
    local label="$1"
    local path="$2"
    if [[ ! -f "${path}" ]]; then
        printf '  [%-5s] %s (missing)\n' 'MISS' "${label}"
        status_fail=$(( status_fail + 1 ))
        return
    fi
    if grep -Eq "${re_version}" "${path}"; then
        printf '  [%-5s] %s\n' 'OK' "${label}"
    else
        printf '  [%-5s] %s\n' 'DRIFT' "${label}"
        status_fail=$(( status_fail + 1 ))
    fi
}

check_file 'README.md' "${REPO_ROOT}/README.md"
check_file 'CURRENT_STATUS.md' "${REPO_ROOT}/tech_readme_files/CURRENT_STATUS.md"

changelog="${REPO_ROOT}/CHANGELOG.md"
if [[ ! -f "${changelog}" ]]; then
    printf '  [%-5s] CHANGELOG.md\n' 'MISS'
    status_fail=$(( status_fail + 1 ))
else
    body="$( awk '
        /^##[[:space:]]*\[Unreleased\]/ { in_section = 1; next }
        in_section && /^##[[:space:]]/  { in_section = 0 }
        in_section { print }
    ' "${changelog}" )"
    if [[ -z "${body// /}" ]]; then
        printf '  [%-5s] CHANGELOG [Unreleased] empty\n' 'EMPTY'
        status_fail=$(( status_fail + 1 ))
    elif printf '%s' "${body}" | grep -Eq "${re_version}"; then
        printf '  [%-5s] CHANGELOG [Unreleased] mentions %s\n' 'OK' "${version}"
    else
        printf '  [%-5s] CHANGELOG [Unreleased] does not mention %s (warning)\n' 'WARN' "${version}"
    fi
fi

echo
if [[ ${status_fail} -gt 0 ]]; then
    printf 'Docs are stale relative to package.json (%s).\n' "${version}" >&2
    exit 1
fi

printf 'All docs reference package.json version %s.\n' "${version}"
exit 0
