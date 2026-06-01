<#
.SYNOPSIS
    Regenerates all AI-agent ignore files from scripts/docs/ai_ignore_template.txt.

.DESCRIPTION
    Reads the canonical exclusion list at scripts/docs/ai_ignore_template.txt and
    writes one ignore file per AI agent at the project root, prepending each
    with an agent-specific header banner.

    `.gitignore` is intentionally NOT regenerated — it is git-native, not
    AI-specific, and is hand-curated.

.PARAMETER Check
    Verify mode: do not write any files. Compare the on-disk content of each
    AI ignore file against `template + header` and exit non-zero on any drift.
    Used by CI (.github/workflows/docs.yml).

.EXAMPLE
    .\scripts\sync_ai_ignores.ps1
    Regenerate all 8 AI ignore files from the template.

.EXAMPLE
    .\scripts\sync_ai_ignores.ps1 -Check
    Verify no drift; exit 1 if any ignore file diverges from the canonical content.
#>

[CmdletBinding()]
param(
    [switch]$Check
)

$ErrorActionPreference = 'Stop'

# Resolve repo root from script location ( scripts/sync_ai_ignores.ps1 -> repo root )
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '../..')
$TemplatePath = Join-Path $RepoRoot 'scripts\docs\ai_ignore_template.txt'

if (-not (Test-Path $TemplatePath)) {
    Write-Error "Template not found: $TemplatePath"
    exit 2
}

# UTF-8 without BOM — used for both read and write so round-trip is stable.
$Utf8 = [System.Text.UTF8Encoding]::new($false)

# Read the canonical exclusion body (drop the file-header comment block that
# documents the script itself - we only want the actual rules).
$rawTemplate = [System.IO.File]::ReadAllText($TemplatePath, $Utf8)

# Strip the leading "# ===..." documentation block (delimited by two long banner lines).
# Keep the blank line immediately after the closing banner so the body starts
# with a blank visual gap from the per-agent header.
$bodyMatch = [regex]::Match($rawTemplate, '^# ={3,}.*?# ={3,}\r?\n', 'Singleline')
if ($bodyMatch.Success) {
    $rulesBody = $rawTemplate.Substring($bodyMatch.Index + $bodyMatch.Length)
} else {
    $rulesBody = $rawTemplate
}
$rulesBody = $rulesBody -replace "`r`n", "`n"
$rulesBody = $rulesBody -replace '^\s+', ''

function Normalize-Text {
    param([string]$Text)
    $Text = $Text -replace "`r`n", "`n"
    return $Text.TrimEnd() + "`n"
}

# Per-agent target files + display name for the header banner.
$Agents = @(
    @{ File = '.agentignore';          Name = 'Generic AI agents (.agents/)' }
    @{ File = '.aiderignore';          Name = 'Aider' }
    @{ File = '.claudeignore';         Name = 'Claude Code' }
    @{ File = '.codexignore';          Name = 'OpenAI Codex CLI' }
    @{ File = '.copilotignore';        Name = 'GitHub Copilot' }
    @{ File = '.cursorignore';         Name = 'Cursor IDE' }
    @{ File = '.cursorindexingignore'; Name = 'Cursor IDE (indexing-only)' }
    @{ File = '.geminiignore';         Name = 'Google Gemini' }
    @{ File = '.windsurfignore';       Name = 'Windsurf' }
)

function Build-Content {
    param([string]$AgentFile, [string]$AgentName)
    $header = @(
        '# ============================================================'
        "# $AgentFile - Exclude from $AgentName context"
        '# AUTO-GENERATED from scripts/docs/ai_ignore_template.txt'
        '# DO NOT EDIT BY HAND. To change exclusions, edit the template and re-run the sync.'
        "# Paths are relative to this file's location (repo root)."
        '# ============================================================'
    ) -join "`n"
    return Normalize-Text ($header + "`n" + $rulesBody)
}

$drift = @()
foreach ($a in $Agents) {
    $targetPath = Join-Path $RepoRoot $a.File
    $desired = Build-Content -AgentFile $a.File -AgentName $a.Name

    if ($Check) {
        if (-not (Test-Path $targetPath)) {
            $drift += "MISSING: $($a.File)"
            continue
        }
        $current = Normalize-Text ([System.IO.File]::ReadAllText($targetPath, $Utf8))
        $desired = Normalize-Text $desired
        if ($current -ne $desired) {
            $drift += "DRIFT:   $($a.File)"
        }
    } else {
        [System.IO.File]::WriteAllText($targetPath, (Normalize-Text $desired), $Utf8)
        Write-Host "Wrote: $($a.File)"
    }
}

if ($Check) {
    if ($drift.Count -gt 0) {
        Write-Host ''
        Write-Host 'AI ignore files are out of sync with scripts/docs/ai_ignore_template.txt:' -ForegroundColor Red
        $drift | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        Write-Host ''
        Write-Host 'Run `.\scripts\sync_ai_ignores.ps1` to regenerate.' -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "All $($Agents.Count) AI ignore files match the template." -ForegroundColor Green
        exit 0
    }
} else {
    Write-Host ''
    Write-Host "Synced $($Agents.Count) AI ignore files from scripts/docs/ai_ignore_template.txt" -ForegroundColor Green
}
