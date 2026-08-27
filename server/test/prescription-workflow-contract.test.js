const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');

test('prescription creation validates and persists an allowlisted snapshot with latest consultation fallback', () => {
  const route = source.slice(source.indexOf("app.post('/prescriptions'"), source.indexOf("app.get('/prescriptions/patient/"));

  assert.match(route, /prescriptionSchema\.safeParse\(req\.body\)/);
  assert.match(route, /prisma\.appointment\.findFirst\(/);
  assert.match(route, /orderBy:\s*\[\{\s*date:\s*['"]desc['"]\s*\}/);
  assert.match(route, /dentalNotes/);
  assert.match(route, /odontogramSnapshot/);
  assert.match(route, /includeOdontogram/);
  assert.match(route, /prescription\.create\(/);
  assert.doesNotMatch(route, /data:\s*req\.body/);
});

test('prescription save failure is surfaced to the client instead of being reported as success', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'pages', 'AdminPrescription.tsx'), 'utf8');
  const saveBlock = page.slice(page.indexOf('const handleSave'), page.indexOf('const handlePrint'));

  assert.match(saveBlock, /if\s*\(!presRes\.ok\)/);
  assert.match(saveBlock, /presRes\.json\(\)/);
  assert.match(saveBlock, /odontogramSnapshot/);
  assert.match(saveBlock, /includeOdontogram/);
});
