# Prescrições, Documentos e Odontograma por Faixa Etária Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox ( - [ ] ) syntax for tracking.

**Goal:** Corrigir persistência e impressão de prescrições, criar fluxo seguro de termos PDF com histórico e anexos e adicionar idade derivada com odontogramas decíduo, misto e permanente sem quebrar dados antigos.

**Architecture:** Uma migração Prisma aditiva introduzirá birthDate, snapshots de odontograma, metadados de emissão e anexos múltiplos. O backend validará e sanitizará todos os dados; normalizadores aceitarão legado, V2 e V3. O frontend usará um editor rico compartilhado e uma raiz de impressão isolada com páginas explícitas.

**Tech Stack:** React 18, TypeScript, Vite, React Router, Vitest, Testing Library, Express, Prisma/PostgreSQL, Zod, Multer, sanitize-html, S3 privado e @react-pdf/renderer.

## Global Constraints

- Seguir SECURITY.md: não registrar CPF, tokens, cookies, HTML clínico, arquivos, URLs assinadas ou conteúdo de paciente.
- Não apagar nem converter de forma destrutiva dados, criptografia, odontogramas ou modelos existentes.
- birthDate é fonte de verdade; idade e faixa são derivadas.
- Rotas clínicas e arquivos exigem sessão HttpOnly e funções admin ou dentist.
- Uploads validam MIME e bytes, limitam 25 MB e limpam objetos órfãos.
- HTML é sanitizado no backend com tags, atributos, estilos e protocolos explícitos.
- Odontograma de prescrição é snapshot somente leitura da consulta mais recente, com fallback.
- Com odontograma, a primeira página é exclusiva para identificação/odontograma; sem ele, o texto inicia na página 1.
- Toda impressão usa raiz isolada e não herda min-height do layout administrativo.
- Preservar arquivos não rastreados, backups e documentação de construção.
- Antes da conclusão: npm test, backend tests, lint, build, Prisma validation, backup tests, secret scan e git diff --check.

---

## Task 1: Schema, migration, validation and sanitization

**Files:** server/prisma/schema.prisma; server/prisma/migrations/20260827000000_add_patient_age_document_workflow/migration.sql; server/utils/validationSchemas.js; server/utils/sanitizeBlogContent.js; server/test/prescription-document-schema.test.js.

**Interfaces:** patientSchema accepts nullable birthDate and keeps consent optional. prescriptionSchema validates positive patientId, non-empty content, optional odontogramSnapshot and source appointment. documentTemplateSchema supports text or PDF. patientDocumentSchema supports template/source metadata. attachmentUploadSchema accepts only PDF/JPEG/PNG/WebP. Prisma exposes Patient.birthDate, Prescription.odontogramSnapshot, Prescription.odontogramSourceAppointmentId, DocumentTemplate PDF metadata, PatientDocument issuance metadata and PatientDocumentAttachment.

- [ ] Step 1: Write failing tests for the five schemas and sanitizer.
```js
const result = patientSchema.safeParse({ name: 'Paciente', cpf: '12345678901', birthDate: '2015-04-10T00:00:00.000Z' });
assert.equal(result.success, true);
assert.equal(result.data.consent, undefined);
assert.equal(prescriptionSchema.safeParse({ patientId: 4, content: '<p>Uso</p>' }).success, true);
assert.equal(prescriptionSchema.safeParse({ patientId: 0, content: ' ' }).success, false);
assert.equal(documentTemplateSchema.safeParse({ title: 'Termo', kind: 'pdf', content: '' }).success, true);
assert.equal(attachmentUploadSchema.safeParse({ documentId: 4, mimeType: 'image/jpeg', originalName: 'scan.jpg', size: 2000 }).success, true);
assert.equal(attachmentUploadSchema.safeParse({ documentId: 4, mimeType: 'application/javascript', originalName: 'x.js', size: 2000 }).success, false);
const html = sanitizeBlogContent('<p style="font-family: Georgia; color: #123456">ok</p><script>alert(1)</script>');
assert.match(html, /font-family/);
assert.doesNotMatch(html, /script|alert/i);
```
- [ ] Step 2: Run node --test server/test/prescription-document-schema.test.js and confirm the failure is caused by missing contracts.
- [ ] Step 3: Add the Prisma fields and relations. Add birthDate to Patient; snapshot/source appointment relation to Prescription; kind/storageKey/mimeType/originalName/archivedAt to DocumentTemplate; templateId/status/issuedAt/issuedById/sourceKind to PatientDocument; create PatientDocumentAttachment with patientDocumentId, storageKey, mimeType, originalName, size, createdAt and uploadedById. Add named reverse User relations and Appointment prescription relation.
- [ ] Step 4: Write an additive SQL migration with nullable columns, safe defaults, attachment table, index, ON DELETE SET NULL for optional references and ON DELETE CASCADE for attachment rows. Do not change existing columns or encryption.
- [ ] Step 5: Implement the schemas, export them, add a strict V3 odontogram schema with dentition deciduous/mixed/permanent and FDI primary keys 51-55, 61-65, 71-75, 81-85. Extend sanitizer styles to font-family, font-size, color, background-color, line-height and text-align, with allowed URL protocols http/https/mailto.
- [ ] Step 6: Run node --test server/test/prescription-document-schema.test.js, npx prisma validate --schema server/prisma/schema.prisma and npx prisma generate --schema server/prisma/schema.prisma. Expected: all pass.
- [ ] Step 7: Commit with git add of only Task 1 files and git commit -m "feat: add compatible clinical document data contracts".

## Task 2: Age derivation and dentition-aware odontogram

**Files:** src/lib/patient-age.ts; src/lib/patient-age.test.ts; src/components/admin/attendance/odontogram/odontogramModel.ts and test; src/components/admin/attendance/Odontogram.tsx and test; src/components/admin/PatientPicker.tsx.

**Interfaces:** derivePatientAge(birthDate, now) returns age, ageGroup child/adolescent/adult or null, and dentition deciduous/mixed/permanent/legacy. Model exports OdontogramV3, PRIMARY_TEETH, PERMANENT_TEETH, getTeethForDentition, createEmptyOdontogram and compatible normalizeOdontogram. PatientPicker passes birthDate and odontogram.

- [ ] Step 1: Write tests for exact boundaries: age 12 is adolescent, age 18 is adult, invalid/missing birth date is legacy; age below 6 defaults deciduous, 6-11 mixed, 12+ permanent. Test that V3 mixed data preserves teeth 55 and 16 and that deciduous excludes 16.
```ts
expect(derivePatientAge('2014-08-27', new Date('2026-08-27'))).toMatchObject({ age: 12, ageGroup: 'adolescent' });
expect(derivePatientAge('2008-08-27', new Date('2026-08-27'))).toMatchObject({ age: 18, ageGroup: 'adult' });
expect(getTeethForDentition('deciduous')).toContain(55);
expect(getTeethForDentition('deciduous')).not.toContain(16);
```
- [ ] Step 2: Run the focused Vitest files and confirm RED.
- [ ] Step 3: Implement derivePatientAge with UTC calendar comparison and no future-date acceptance.
- [ ] Step 4: Add V3 with version 3, dentition discriminator and ToothRecord map. Keep legacy ToothData and V2 unchanged. Use primary FDI numbers and map primary positions 1/2 to incisor, 3 to canine and 4/5 to molar geometry. Extend face labels for primary upper/lower quadrants.
- [ ] Step 5: Update Odontogram to render permanent, deciduous or mixed rows based on V3, keep legacy/V2 behavior, and avoid mutating input data during render. Add tests for printable/read-only primary and mixed teeth.
- [ ] Step 6: Run age/model/component tests and commit with git commit -m "feat: support derived patient age and primary dentition".

## Task 3: Prescription persistence and latest consultation odontogram

**Files:** server/index.js; server/test/prescription-route-contract.test.js; src/pages/AdminPrescription.tsx; src/pages/AdminPrescription.test.tsx; src/components/PrescriptionGenerator.tsx; src/lib/prescription-document.ts and test.

**Interfaces:** GET /patients/:id/odontogram/latest is private for admin/dentist and returns appointmentId/date/odontogram or 404. POST /prescriptions validates, sanitizes, verifies patient/source ownership and returns 201. Prescription UI keeps source metadata and sends snapshot.

- [ ] Step 1: Write a source contract test requiring prescriptionSchema.safeParse, patient lookup, sanitizeBlogContent, source ownership and latest query ordering by date descending. Add a component regression test that rejects false success, preserves content, loads appointmentId 88 and sends snapshot/source id.
- [ ] Step 2: Run node --test server/test/prescription-route-contract.test.js and focused Vitest files; confirm RED.
- [ ] Step 3: Add the protected latest route. Query Appointment by patientId, dentalNotes not null, date descending, select id/date/dentalNotes. Return 404 for null or empty JSON and never disclose another patient's consultation.
- [ ] Step 4: Replace raw req.body prescription creation. Parse schema, find patient, verify source appointment patientId, sanitize content and create only approved fields. Return generic errors and never log body/content.
- [ ] Step 5: On patient selection/fetch, load history and latest odontogram independently. Use consultation snapshot first, Patient.odontogram fallback second, store source label/id, render read-only and do not update Patient.odontogram when saving. Use functional history setter and surface API errors.
- [ ] Step 6: Adapt PDF summary to OdontogramData and dentition registry. Keep legacy support. Run route, security, prescription and odontogram tests, then commit "fix: persist prescriptions with clinical odontogram snapshots".

## Task 4: Rich editor and print pagination

**Files:** src/components/admin/RichTextEditor.tsx/test; src/lib/print-layout.ts/test; src/index.css; src/pages/AdminPrescription.tsx; src/pages/AdminDocuments.tsx; src/pages/AdminFinance.tsx; src/components/PrescriptionGenerator.tsx.

**Interfaces:** RichTextEditor keeps current props and adds complete toolbar. print-root is the only visible browser print root. PrescriptionDocument uses one Page without odontogram or an odontogram Page followed by content Page with odontogram.

- [ ] Step 1: Write tests for accessible controls: undo/redo, font family, font size, color, highlight, underline, strike, numbered/bulleted lists, indent, link and clear format. Add pure tests for hasPrintableContent and conditional page separation plus source assertions for print-root/page classes.
- [ ] Step 2: Run focused tests and confirm RED.
- [ ] Step 3: Extend the contentEditable toolbar with native commands and a pixel-size span wrapper. Use onMouseDown preventDefault before every control action so selection is preserved. Include accessible labels and keyboard operation.
- [ ] Step 4: Add printRootClass, hasPrintableContent and shouldSeparateOdontogram. Rewrite print CSS so administrative chrome is hidden, print-root has auto height/min-height and zero padding, odontogram page has break-after page, and content has no forced break-before. Remove conflicting hidden/print-only combinations.
- [ ] Step 5: Render browser prescription as print-root with conditional print-odontogram-page and print-prescription-page. Put no prescription text on the first page and render sanitized HTML in the content section.
- [ ] Step 6: Split React PDF into explicit Page elements with the same conditional rule. Put document and finance browser reports inside print-root; keep FinanceReportPDF one-page behavior.
- [ ] Step 7: Run editor, print, prescription and available document tests. Commit "fix: unify rich text editing and print pagination".

## Task 5: Secure PDF templates and multiple signed attachments

**Files:** server/utils/privateDocumentStorage.js; server/utils/patientDocumentStorage.js; server/index.js; server/test/document-workflow-contract.test.js; server/test/security-foundations.test.js.

**Interfaces:** uploadPrivateDocument accepts only PDF/JPEG/PNG/WebP and returns private storage key. Template creation is multipart. New routes are authenticated, role restricted and never return signed URLs in JSON. History includes attachments and legacy file fallback.

- [ ] Step 1: Write RED route tests requiring auth/roles for template file, document creation, attachment upload and attachment file; test byte signatures and archive-only template deletion; assert no signed URL is persisted.
- [ ] Step 2: Run focused node tests and confirm RED.
- [ ] Step 3: Create private storage helper using S3 Put/Get/Delete, safe scope/owner segments, extension derived from MIME, content disposition inline and signed read URLs valid for a short duration. Preserve patientDocumentStorage legacy exports/keys.
- [ ] Step 4: Add Multer template upload with 25 MB limit and PDF filter. POST /document-templates accepts title/content/kind/file, validates PDF bytes, uploads privately, creates sanitized template and cleans object if Prisma fails. GET excludes archived templates and serves private source. DELETE archives with archivedAt.
- [ ] Step 5: Validate POST /patient-documents, verify patient/template, derive sourceKind, sanitize content, set issued/status/issuer, include attachments and create audit details containing only internal document id/action.
- [ ] Step 6: Add attachment upload for PDF/JPEG/PNG/WebP, verify parent document, validate bytes/size/name, upload privately, create relation and delete object on row failure. The GET route must scope attachment by both ids before signing. Include attachment route paths and legacy fileUrl in history.
- [ ] Step 7: Run document/security/upload tests and commit "feat: add private document templates and signed attachments".

## Task 6: Administrative UI integration

**Files:** src/pages/AdminDocuments.tsx and test; src/pages/AdminPatients.tsx and test; src/components/admin/PatientPicker.tsx.

**Interfaces:** AdminDocuments creates text/PDF models with FormData, requires patient for every emission, shows status/issuer/date and multiple attachments, and uses RichTextEditor. AdminPatients submits birthDate, shows derived age/group, removes consent checkbox. PatientPicker remains compatible.

- [ ] Step 1: Write RED UI tests for PDF-only model FormData, patient-required issuance, two attachment history, birthDate input, derived status and absence of Consentimento registrado.
- [ ] Step 2: Run focused Vitest files and confirm RED.
- [ ] Step 3: Add birthDate to patient state and date input. Render accessible age/group status from derivePatientAge. Remove consent checkbox from JSX and new payload; keep legacy response fields for old records.
- [ ] Step 4: Replace document Textarea with RichTextEditor. Add PDF input with accept application/pdf. Send title/content/kind/file via FormData and allow content or file as the model body. For PDF templates show source notice; tags remain available for text templates.
- [ ] Step 5: Make save history require patient for text/PDF, send templateId/sourceKind, show API errors, prepend issued record and display Emitido/professional/date. Upload multiple selected attachments to the private attachment route and render protected paths without storing signed URLs.
- [ ] Step 6: Run document/patient/picker tests and commit "feat: integrate PDF terms, issuance history and patient age".

## Task 7: Full verification and final review

**Files:** .superpowers/sdd/prescription-documents-age-odontogram-progress.md only for the ledger.

- [ ] Step 1: Inspect git log/status and confirm all pre-existing .superpowers/sdd files remain unstaged and untouched.
- [ ] Step 2: Run npm test, npm run lint and npm run build. Expected: all tests pass, lint exits 0 and Vite build exits 0.
- [ ] Step 3: Run node --test server/test/*.test.js, npx prisma validate --schema server/prisma/schema.prisma, npx prisma generate --schema server/prisma/schema.prisma and node --test backup/test/*.test.js.
- [ ] Step 4: Run secret scan with rg for private-key/API-key patterns and git diff --check. Inspect matches without printing secret values.
- [ ] Step 5: Manually verify auth on all new routes, private storage, byte validation, no browser geolocation, legacy consent readability, legacy/V2 rendering and conditional print breaks.
- [ ] Step 6: Generate the whole-branch review package, dispatch final reviewer, fix every Critical/Important finding with a targeted change, rerun covering tests and re-review.
- [ ] Step 7: Append current verification output to the ledger and use finishing-development-branch workflow. Do not claim completion before fresh evidence and review approval.
