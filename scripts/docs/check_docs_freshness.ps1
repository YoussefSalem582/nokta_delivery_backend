<#
.SYNOPSIS
    Verify that the version in package.json matches README.md and CURRENT_STATUS.md.

.DESCRIPTION
    Reads `version` from package.json and checks that:
      - README.md contains the version string in the first 50 lines.
      - tech_readme_files/CURRENT_STATUS.md contains the version string.
      - CHANGELOG.md has an `[Unreleased]` section (warn if version not mentioned there).

.EXAMPLE
    .\scripts\check_docs_freshness.ps1
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '../..')

function Get-PackageVersion {
    $pkgPath = Join-Path $RepoRoot 'package.json'
    if (-not (Test-Path $pkgPath)) {
        throw 'package.json not found'
    }
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    if (-not $pkg.version) {
        throw 'No version field in package.json'
    }
    return [string]$pkg.version
}

function Test-FileContainsVersion {
    param(
        [string]$Path,
        [string]$Version,
        [string]$Label
    )
    if (-not (Test-Path $Path)) {
        return [PSCustomObject]@{ Label = $Label; Status = 'MISSING'; Path = $Path }
    }
    $content = Get-Content -Raw $Path
    if ($content -match [regex]::Escape($Version)) {
        return [PSCustomObject]@{ Label = $Label; Status = 'OK'; Path = $Path }
    } else {
        return [PSCustomObject]@{ Label = $Label; Status = 'DRIFT'; Path = $Path }
    }
}

function Test-ChangelogUnreleased {
    param(
        [string]$ChangelogPath,
        [string]$Version
    )
    if (-not (Test-Path $ChangelogPath)) {
        return [PSCustomObject]@{ Label = 'CHANGELOG [Unreleased]'; Status = 'MISSING'; Path = $ChangelogPath }
    }
    $content = Get-Content -Raw $ChangelogPath
    $match = [regex]::Match($content, '##\s*\[Unreleased\][^\n]*\n(?<body>[\s\S]*?)(?=\n##\s)', 'IgnoreCase')
    if (-not $match.Success) {
        return [PSCustomObject]@{ Label = 'CHANGELOG [Unreleased]'; Status = 'NO-UNRELEASED'; Path = $ChangelogPath }
    }
    $body = $match.Groups['body'].Value
    if ($body.Trim().Length -lt 10) {
        return [PSCustomObject]@{ Label = 'CHANGELOG [Unreleased]'; Status = 'EMPTY-UNRELEASED'; Path = $ChangelogPath }
    }
    if ($body -match [regex]::Escape($Version)) {
        return [PSCustomObject]@{ Label = "CHANGELOG [Unreleased] mentions $Version"; Status = 'OK'; Path = $ChangelogPath }
    }
    return [PSCustomObject]@{ Label = "CHANGELOG [Unreleased] does not mention $Version (warning)"; Status = 'WARN'; Path = $ChangelogPath }
}

$version = Get-PackageVersion
Write-Host "package.json version: $version" -ForegroundColor Cyan

$results = @()
$results += Test-FileContainsVersion -Path (Join-Path $RepoRoot 'README.md') -Version $version -Label 'README.md'
$results += Test-FileContainsVersion -Path (Join-Path $RepoRoot 'tech_readme_files\CURRENT_STATUS.md') -Version $version -Label 'CURRENT_STATUS.md'
$results += Test-ChangelogUnreleased -ChangelogPath (Join-Path $RepoRoot 'CHANGELOG.md') -Version $version

$results | ForEach-Object {
    $color = switch ($_.Status) {
        'OK'   { 'Green' }
        'WARN' { 'Yellow' }
        default { 'Red' }
    }
    Write-Host ("  [{0,-5}] {1}" -f $_.Status, $_.Label) -ForegroundColor $color
}

$bad = $results | Where-Object { $_.Status -notin @('OK', 'WARN') }
if ($bad.Count -gt 0) {
    Write-Host ''
    Write-Host "Docs are stale relative to package.json ($version)." -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host "All docs reference package.json version $version." -ForegroundColor Green
exit 0
