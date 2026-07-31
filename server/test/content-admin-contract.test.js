const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const readSource = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8');

test('content administration uses the credentialed API client for every request', () => {
    const api = readSource('src/lib/api.ts');
    assert.match(api, /axios\.create\(\{\s*baseURL:\s*API_URL,\s*withCredentials:\s*true,?\s*}\)/s);

    for (const file of ['AdminBlog.tsx', 'AdminTreatments.tsx', 'AdminStories.tsx', 'AdminComments.tsx']) {
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

test('blog content is sanitized before persistence and before it reaches the rich-text editor', () => {
    const sanitizeBlogContent = require('../utils/sanitizeBlogContent');
    const malicious = '<p>Texto <strong>seguro</strong><img src=x onerror="alert(1)"><script>alert(1)</script></p>';
    assert.equal(sanitizeBlogContent(malicious), '<p>Texto <strong>seguro</strong></p>');

    const server = readSource('server/index.js');
    const postsStart = server.indexOf("app.get('/posts'");
    const postsEnd = server.indexOf("app.post('/posts/:id/view'", postsStart);
    const postsRoutes = server.slice(postsStart, postsEnd);
    assert.match(postsRoutes, /content:\s*sanitizeBlogContent\(req\.body\.content\)/);
    assert.match(postsRoutes, /content:\s*sanitizeBlogContent\(post\.content\)/);
});
