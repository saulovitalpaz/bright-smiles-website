const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');
const storage = fs.readFileSync(path.join(__dirname, '..', 'utils', 'patientDocumentStorage.js'), 'utf8');

test('document template routes support validated text/PDF templates and private template file delivery', () => {
  const route = source.slice(source.indexOf("app.get('/document-templates'"), source.indexOf("app.delete('/document-templates/:id'"));
  const deleteRoute = source.slice(source.indexOf("app.delete('/document-templates/:id'"), source.indexOf("// Patient Documents API"));

  assert.match(route, /documentTemplateSchema\.safeParse/);
  assert.match(route, /templateUpload\.single\(['"]file['"]\)/);
  assert.match(route, /uploadDocumentTemplate/);
  assert.match(route, /document-templates\/:id\/file/);
  assert.match(deleteRoute, /archivedAt/);
  assert.doesNotMatch(deleteRoute, /prisma\.documentTemplate\.delete/);
});

test('patient document issuance records patient/template/status/issuer and accepts private signed attachments', () => {
  const route = source.slice(source.indexOf("app.get('/patient-documents/:patientId'"), source.indexOf("app.delete('/patient-documents/:id'"));

  assert.match(route, /patientDocumentSchema\.safeParse/);
  assert.match(route, /templateId/);
  assert.match(route, /issuedById/);
  assert.match(route, /status/);
  assert.match(route, /patient-documents\/\:id\/attachments/);
  assert.match(route, /attachmentUpload\.array\(['"]files['"][^)]*\)/);
  assert.match(route, /uploadPatientDocumentAttachment/);
  assert.match(route, /PatientDocumentAttachment/);
  assert.match(route, /isSupportedUpload/);
});

test('private document storage derives scoped keys and preserves legacy PDF helpers', () => {
  assert.match(storage, /patient-documents/);
  assert.match(storage, /document-templates/);
  assert.match(storage, /attachments/);
  assert.match(storage, /ContentType: mimeType/);
  assert.match(storage, /uploadPatientDocument/);
  assert.match(storage, /createPatientDocumentUrl/);
});
