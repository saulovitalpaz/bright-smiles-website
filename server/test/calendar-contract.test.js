const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(serverRoot, '..');

test('leads persist an optional professional assignment', () => {
    const schema = fs.readFileSync(path.join(serverRoot, 'prisma/schema.prisma'), 'utf8');
    const leads = fs.readFileSync(path.join(serverRoot, 'routes/leads.js'), 'utf8');

    assert.match(schema, /model Lead[\s\S]*professional\s+String\?/);
    assert.match(leads, /scheduledAt/);
    assert.match(leads, /professional/);
});
