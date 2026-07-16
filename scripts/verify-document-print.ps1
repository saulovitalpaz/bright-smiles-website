Set-StrictMode -Version Latest
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

Assert-Contains "src/pages/AdminPrescription.tsx" "includeProfessionalSignature" "Prescription must expose signature inclusion state."
Assert-Contains "src/pages/AdminPrescription.tsx" "hasCompleteProfessionalIdentity" "Prescription generation must require configured professional identity."
Assert-Contains "src/pages/AdminPrescription.tsx" "signatureUrl" "Prescription PDF must receive the logged professional signature."
Assert-Contains "src/pages/AdminPrescription.tsx" "odontogram" "Prescription PDF must receive odontogram data."
Assert-NotContains "src/pages/AdminPrescription.tsx" "A4 compacto" "Prescription must not expose the obsolete compact selector."
Assert-NotContains "src/pages/AdminPrescription.tsx" "scale-\[0\.65\]" "Printed odontogram must not use transform scaling."
Assert-NotContains "src/pages/AdminPrescription.tsx" "-mb-20" "Printed odontogram must not use a negative margin."
Assert-NotContains "src/pages/AdminPrescription.tsx" 'printDocumentClass\("clinic"\)\} flex min-h-screen' "Prescription print flow must not use a page-fragmenting flex wrapper."
Assert-NotContains "src/pages/AdminPrescription.tsx" "print-signature mt-auto" "Prescription signature must flow after content instead of being forced over a page."

Assert-Contains "src/pages/AdminDocuments.tsx" "includeProfessionalSignature" "Documents must expose signature inclusion state."
Assert-Contains "src/pages/AdminDocuments.tsx" "hasCompleteProfessionalIdentity" "Document printing must require configured professional identity."
Assert-NotContains "src/pages/AdminDocuments.tsx" "A4 compacto" "Documents must not expose the obsolete compact selector."

Assert-Contains "src/components/PrescriptionGenerator.tsx" "electronicSignatureLabel" "PDF must identify the electronic signer."
Assert-Contains "src/lib/professional-signature.ts" "Assinado eletronicamente por:" "Printed documents must identify the electronic signer."
Assert-Contains "src/components/PrescriptionGenerator.tsx" "PrescriptionOdontogramPdf" "PDF must render an odontogram section."
Assert-Contains "src/components/PrescriptionGenerator.tsx" "signatureUrl" "PDF must support the uploaded signature image."
Assert-Contains "src/components/PrescriptionGenerator.tsx" "hasUsableProfessionalSignature" "PDF must only claim a signature when a valid image and identity exist."
Assert-Contains "src/components/PrescriptionGenerator.tsx" "odontogramContinuation" "Long odontogram summaries must use an explicit continuation block."
Assert-NotContains "src/components/PrescriptionGenerator.tsx" "Math\.random" "PDF must not generate a fake signature hash."

Assert-Contains "src/components/admin/attendance/Odontogram.tsx" "data-printable" "Odontogram must expose a print presentation contract."
Assert-Contains "src/index.css" "\.print-flow-content" "Long document text must remain page-breakable."
Assert-Contains "src/index.css" "\.print-odontogram \.odontogram-grid" "Printed odontogram must use a stable document grid."
Assert-Contains "src/index.css" '(?s)\.print-document\s*\{[^}]*display:\s*block\s*!important' "Printable documents must use a fragmentable block flow."

Assert-Contains "server/prisma/schema.prisma" "signatureUrl\s+String\?" "User profile must store the uploaded signature reference."
Assert-Contains "server/index.js" "app\.patch\('/users/me', authenticateToken" "Professional profile updates must use the authenticated current user."
Assert-Contains "server/utils/validationSchemas.js" "updateCurrentUserSchema" "Professional profile updates must be schema validated."
Assert-Contains "src/pages/AdminSettings.tsx" "Identidade e Assinatura Profissional" "Settings must expose professional identity and signature management."
Assert-Contains "src/pages/AdminSettings.tsx" '/upload/signature' "Signature uploads must use the dedicated image-only endpoint."
Assert-Contains "src/pages/AdminSettings.tsx" 'localStorage\.setItem\("admin_user"' "Updated professional data must refresh the logged-in user cache."

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Output "[FAIL] $_" }
    exit 1
}

Write-Output "[OK] Document print source contracts passed."
