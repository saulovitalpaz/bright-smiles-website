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
Assert-Contains "src/index.css" "overflow-wrap:\s*anywhere" "Admin cards must wrap unbounded dynamic content instead of widening the viewport."
Assert-Contains "src/index.css" "container-type:\s*inline-size" "Odontogram breakpoints must follow available card width instead of viewport width."
Assert-Contains "src/components/admin/AdminLayout.tsx" 'aria-controls="admin-navigation"' "Mobile menu must expose its controlled navigation region."
Assert-Contains "src/pages/AdminLeads.tsx" "overflow-wrap:anywhere" "Request cards must safely wrap user-provided contact and message data."
Assert-Contains "src/pages/AdminTreatments.tsx" 'admin-card flex min-w-0 flex-col' "Treatment header panel must use the shared mobile-safe card contract."
Assert-Contains "src/pages/AdminUsers.tsx" 'admin-card flex min-w-0 flex-col' "Users header panel must use the shared mobile-safe card contract."
Assert-Contains "src/pages/AdminStories.tsx" 'admin-card overflow-hidden' "Stories panel must use the shared mobile-safe card contract."
Assert-NotContains "src/components/admin/attendance/Odontogram.tsx" "min-w-\[680px\]" "Odontogram must not force desktop width on mobile."
Assert-NotContains "src/components/admin/attendance/Odontogram.tsx" 'CardContent className="admin-scroll-region' "Odontogram must not use horizontal scrolling around interactive teeth."
Assert-Contains "src/components/admin/attendance/Odontogram.tsx" "touch-pan-y" "Odontogram must reserve horizontal gestures for tooth interaction and allow page scrolling vertically."
Assert-Contains "src/components/admin/attendance/Odontogram.tsx" "odontogram-grid" "Odontogram teeth must use container-aware reflow."
Assert-Contains "src/components/admin/attendance/Odontogram.tsx" "overscroll-y-contain" "Odontogram modal must prevent mobile scroll chaining."
Assert-Contains "src/components/admin/attendance/Odontogram.tsx" "AnatomicalTooth" "Odontogram must use anatomical rendering."
Assert-Contains "src/components/admin/attendance/Odontogram.tsx" "ToothSurfaceSelector" "Odontogram must expose direct face selection."
Assert-NotContains "src/components/admin/attendance/Odontogram.tsx" "const FRONTAL" "Legacy frontal geometry must be removed."
Assert-NotContains "src/components/admin/attendance/Odontogram.tsx" "const OCCLUSAL" "Legacy occlusal geometry must be removed."
Assert-Contains "src/assets/odontogram/THIRD_PARTY_NOTICES.md" "Copyright \(c\) 2026 Zoltán Dul" "MIT attribution must be preserved."
Assert-Contains "src/components/admin/attendance/FaceMap.tsx" 'viewBox="0 0 320 420"' "Face map must use the anatomical responsive SVG canvas."
Assert-Contains "src/components/admin/attendance/FaceMap.tsx" "data-face-region" "Face map must expose canonical interactive regions."
Assert-Contains "src/components/admin/attendance/FaceMap.tsx" "touch-manipulation" "Face map controls must use touch-safe interaction."
Assert-Contains "src/components/admin/attendance/FaceMap.tsx" "grid-cols-1 gap-4 sm:grid-cols-2" "Face map fields must stack on narrow screens."
Assert-NotContains "src/components/admin/attendance/EvolutionTimeline.tsx" 'scale-\[0\.6\]' "Historical face maps must not use transform scaling."
Assert-NotContains "src/components/admin/attendance/EvolutionTimeline.tsx" "-mb-40" "Historical face maps must not rely on negative mobile margins."
Assert-NotContains "src/components/admin/attendance/EvolutionTimeline.tsx" "scale-75" "Historical odontograms must not use transform scaling."
Assert-NotContains "src/components/admin/attendance/EvolutionTimeline.tsx" "-mb-16" "Historical odontograms must not rely on negative mobile margins."
Assert-Contains "src/pages/AdminFinance.tsx" "transactionTypeFilter" "Finance page needs local transaction type filter state."
Assert-Contains "src/pages/AdminFinance.tsx" "displayedTransactions" "Finance report must render a filtered display collection."
Assert-Contains "src/pages/AdminFinance.tsx" "aria-pressed" "Finance summary filters need pressed-state semantics."
Assert-Contains "src/pages/AdminFinance.tsx" "setTransactionTypeFilter\(null\)" "Finance reset behavior must clear the type filter."

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Output "FAIL: $_" }
    exit 1
}

Write-Output "Admin responsive source contracts passed."
