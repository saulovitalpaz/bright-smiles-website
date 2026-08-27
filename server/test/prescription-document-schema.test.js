const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  attachmentUploadSchema,
  documentTemplateSchema,
  normalizeOdontogram,
  odontogramSchema,
  patientDocumentSchema,
  patientSchema,
  prescriptionSchema,
} = require('../utils/validationSchemas');
const sanitizeBlogContent = require('../utils/sanitizeBlogContent');

const schemaSource = fs.readFileSync(
  path.join(__dirname, '..', 'prisma', 'schema.prisma'),
  'utf8',
);
const migrationPath = path.join(
  __dirname,
  '..',
  'prisma',
  'migrations',
  '20260827000000_add_patient_age_document_workflow',
  'migration.sql',
);
const migrationSource = fs.existsSync(migrationPath)
  ? fs.readFileSync(migrationPath, 'utf8')
  : '';
const migrationRoot = path.join(__dirname, '..', 'prisma', 'migrations');
const repairMigrationName = '20260110042557_repair_missing_base_tables';
const repairMigrationPath = path.join(migrationRoot, repairMigrationName, 'migration.sql');
const repairMigrationSource = fs.existsSync(repairMigrationPath)
  ? fs.readFileSync(repairMigrationPath, 'utf8')
  : '';

const toothRecord = { notes: '', conditions: [] };

test('accepts optional nullable birthDate without persisting a derived age tag', () => {
  const result = patientSchema.safeParse({
    name: 'Synthetic Fixture',
    cpf: 'fixture-cpf-000',
    birthDate: '2015-04-10T00:00:00.000Z',
  });

  assert.equal(result.success, true);
  assert.equal(new Date(result.data.birthDate).toISOString(), '2015-04-10T00:00:00.000Z');
  assert.equal(result.data.consent, undefined);
  assert.equal('ageGroup' in result.data, false);
  assert.equal(patientSchema.safeParse({
    name: 'Synthetic Fixture',
    cpf: 'fixture-cpf-001',
    birthDate: null,
  }).success, true);
  assert.equal(patientSchema.safeParse({
    name: 'Synthetic Fixture',
    cpf: 'fixture-cpf-002',
    birthDate: '2999-01-01',
  }).success, false);
});

test('accepts V2 and V3 odontograms while enforcing primary FDI keys by dentition', () => {
  const v2 = {
    version: 2,
    dentition: 'permanent',
    teeth: { '16': toothRecord },
  };
  const deciduous = {
    version: 3,
    dentition: 'deciduous',
    teeth: { '55': toothRecord, '85': toothRecord },
  };
  const mixed = {
    version: 3,
    dentition: 'mixed',
    teeth: { '55': toothRecord, '16': toothRecord },
  };
  const permanent = {
    version: 3,
    dentition: 'permanent',
    teeth: { '16': toothRecord },
  };

  assert.equal(odontogramSchema.safeParse(v2).success, true);
  for (const value of [deciduous, mixed, permanent]) {
    assert.equal(odontogramSchema.safeParse(value).success, true);
    assert.deepEqual(normalizeOdontogram(value), value);
  }
  assert.equal(odontogramSchema.safeParse({
    ...deciduous,
    teeth: { '16': toothRecord },
  }).success, false);
  assert.equal(odontogramSchema.safeParse({
    ...permanent,
    teeth: { '55': toothRecord },
  }).success, false);
});

test('validates and sanitizes controlled prescription fields', () => {
  const result = prescriptionSchema.safeParse({
    patientId: 4,
    content: '<p>Uso <strong>conforme orientação</strong></p><script>unsafe()</script>',
    odontogramSnapshot: {
      version: 3,
      dentition: 'mixed',
      teeth: { '55': toothRecord, '16': toothRecord },
    },
    odontogramSourceAppointmentId: 88,
  });

  assert.equal(result.success, true);
  assert.match(result.data.content, /<strong>/);
  assert.doesNotMatch(result.data.content, /script|unsafe/i);
  assert.equal(prescriptionSchema.safeParse({ patientId: 0, content: ' ' }).success, false);
  assert.equal(prescriptionSchema.safeParse({
    patientId: 4,
    content: '<p>valid</p>',
    createdAt: '2026-08-27T00:00:00.000Z',
  }).success, false);
});

test('supports text and PDF template metadata plus patient-linked document issuance', () => {
  assert.equal(documentTemplateSchema.safeParse({
    title: 'Termo sintético',
    kind: 'pdf',
    content: '',
  }).success, true);
  assert.equal(documentTemplateSchema.safeParse({
    title: 'Modelo sintético',
    kind: 'text',
    content: '<p>Texto do modelo</p>',
  }).success, true);
  assert.equal(documentTemplateSchema.safeParse({
    title: 'Modelo inválido',
    kind: 'spreadsheet',
    content: '',
  }).success, false);

  const issuedDocument = patientDocumentSchema.safeParse({
    title: 'Termo emitido',
    content: '<p>Documento sintético</p>',
    patientId: 4,
    templateId: 8,
    sourceKind: 'pdf',
  });
  assert.equal(issuedDocument.success, true);
});

test('limits signed attachments to private supported file metadata', () => {
  assert.equal(attachmentUploadSchema.safeParse({
    documentId: 4,
    mimeType: 'image/jpeg',
    originalName: 'scan.jpg',
    size: 2000,
  }).success, true);
  assert.equal(attachmentUploadSchema.safeParse({
    documentId: 4,
    mimeType: 'application/javascript',
    originalName: 'x.js',
    size: 2000,
  }).success, false);
  assert.equal(attachmentUploadSchema.safeParse({
    documentId: 4,
    mimeType: 'application/pdf',
    originalName: '..\\private.pdf',
    size: 2000,
  }).success, false);
});

test('rich sanitizer keeps approved formatting and removes active content', () => {
  const html = sanitizeBlogContent(
    '<p style="font-family: Georgia; font-size: 14px; color: #123456; background-color: rgb(250, 250, 250); line-height: 1.5; text-align: center" onclick="unsafe()">safe <u>text</u> <a href="https://example.test">link</a> <a href="javascript:alert(1)">bad</a><script>alert(1)</script></p>',
  );

  assert.match(html, /font-family/);
  assert.match(html, /font-size/);
  assert.match(html, /color/);
  assert.match(html, /background-color/);
  assert.match(html, /line-height/);
  assert.match(html, /text-align/);
  assert.match(html, /href="https:\/\/example\.test"/);
  assert.doesNotMatch(html, /script|alert|onclick|javascript:/i);
});

test('Prisma schema and migration expose additive document workflow fields with explicit deletion rules', () => {
  for (const field of [
    'birthDate',
    'odontogramSnapshot',
    'odontogramSourceAppointmentId',
    'kind',
    'storageKey',
    'mimeType',
    'originalName',
    'archivedAt',
    'templateId',
    'status',
    'issuedAt',
    'issuedById',
    'sourceKind',
    'PatientDocumentAttachment',
  ]) assert.match(schemaSource, new RegExp(field));

  assert.match(migrationSource, /ON DELETE SET NULL/i);
  assert.match(migrationSource, /ON DELETE CASCADE/i);
  assert.match(migrationSource, /CREATE TABLE IF NOT EXISTS "PatientDocumentAttachment"/i);
  for (const index of [
    'odontogramSourceAppointmentId',
    'templateId',
    'issuedById',
    'uploadedById',
  ]) assert.match(schemaSource, new RegExp(`@@index\\(\\[${index}\\]\\)`));
});

test('repair migration is ordered before historical ALTER TABLE statements and bootstraps missing base tables', () => {
  const migrationNames = fs.readdirSync(migrationRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const initialIndex = migrationNames.indexOf('20260110042556_init');
  const repairIndex = migrationNames.indexOf(repairMigrationName);
  const patientAlterIndex = migrationNames.indexOf('20260730040000_add_patient_cpf_index');

  assert.ok(initialIndex >= 0);
  assert.ok(repairIndex > initialIndex);
  assert.ok(repairIndex < patientAlterIndex);
  assert.match(repairMigrationSource, /CREATE TABLE IF NOT EXISTS "Patient"/i);
  assert.match(repairMigrationSource, /CREATE TABLE IF NOT EXISTS "FinanceTransaction"/i);
  assert.match(repairMigrationSource, /CREATE TABLE IF NOT EXISTS "Prescription"/i);
  assert.match(repairMigrationSource, /CREATE TABLE IF NOT EXISTS "DocumentTemplate"/i);
  assert.match(repairMigrationSource, /CREATE TABLE IF NOT EXISTS "PatientDocument"/i);
  assert.match(repairMigrationSource, /ADD COLUMN IF NOT EXISTS "patientId"/i);
});
