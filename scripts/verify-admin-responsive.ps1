$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$failures = [System.Collections.Generic.List[string]]::new()

function Assert-Contains([string]$Path, [string]$Pattern, [string]$Message) {
    $content = Get-Content -LiteralPath (Join-Path $root $Path) -Raw
    if ($content -notmatch $Pattern) {
        $failures.Add($Message)
    }
}

function Assert-NotContains([string]$Path, [string]$Pattern, [string]$Message) {
    $content = Get-Content -LiteralPath (Join-Path $root $Path) -Raw
    if ($content -match $Pattern) {
        $failures.Add($Message)
    }
}

Assert-Contains "src/App.css" "#root\s*\{[\s\S]*width:\s*100%" "App root must fill the viewport."
Assert-NotContains "src/App.css" "max-width:\s*1280px" "Starter root max-width must not constrain the admin panel."
Assert-Contains "src/index.css" "\.admin-scroll-region" "Shared contained horizontal scrolling utility is required."
Assert-Contains "src/components/admin/AdminLayout.tsx" 'aria-controls="admin-navigation"' "Mobile menu must expose its controlled navigation region."
Assert-Contains "src/pages/AdminFinance.tsx" "transactionTypeFilter" "Finance page needs local transaction type filter state."
Assert-Contains "src/pages/AdminFinance.tsx" "displayedTransactions" "Finance report must render a filtered display collection."
Assert-Contains "src/pages/AdminFinance.tsx" "aria-pressed" "Finance summary filters need pressed-state semantics."
Assert-Contains "src/pages/AdminFinance.tsx" "setTransactionTypeFilter\(null\)" "Finance reset behavior must clear the type filter."

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Output "FAIL: $_" }
    exit 1
}

Write-Output "Admin responsive source contracts passed."
