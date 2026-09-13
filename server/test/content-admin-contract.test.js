const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const readSource = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8');

test('content administration uses the credentialed API client for every request', () => {
    const api = readSource('src/lib/api.ts');
    assert.match(api, /axios\.create\(\{\s*baseURL:\s*API_URL,\s*withCredentials:\s*true,?\s*}\)/s);

    for (const file of ['AdminTreatments.tsx', 'AdminStories.tsx', 'AdminComments.tsx']) {
        const source = readSource(`src/pages/${file}`);
        assert.match(source, /import\s+\{\s*adminApi\s*}\s+from\s+["']@\/lib\/api["']/);
        assert.doesNotMatch(source, /axios\.(?:get|post|put|delete)\(`\$\{API_URL\}\/(?:posts|treatments|treatment-results|stories|testimonials)/);
    }
});

test('managers can review stories and comments without being offered admin-only mutations', () => {
    for (const file of ['AdminStories.tsx', 'AdminComments.tsx']) {
        const source = readSource(`src/pages/${file}`);
        assert.match(source, /const isAdmin = currentUser\?\.role === ["']admin["'];/);
        assert.match(source, /isAdmin &&/);
    }
});

test('rich content remains sanitized for clinical documents', () => {
    const sanitizeRichContent = require('../utils/sanitizeRichContent');
    const malicious = '<p>Texto <strong>seguro</strong><img src=x onerror="alert(1)"><script>alert(1)</script></p>';
    assert.equal(sanitizeRichContent(malicious), '<p>Texto <strong>seguro</strong></p>');
    assert.match(readSource('server/utils/validationSchemas.js'), /transform\(sanitizeRichContent\)/);
});
