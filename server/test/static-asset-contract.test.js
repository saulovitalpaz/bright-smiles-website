const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

test('all local media references resolve under public', () => {
    const sources = ['src/data/posts.ts', 'src/data/treatments.ts', 'server/seed.js']
        .map((file) => fs.readFileSync(path.join(repoRoot, file), 'utf8'))
        .join('\n');
    const references = [...sources.matchAll(/["'](\/images\/[^"']+)["']/g)].map((match) => match[1]);
    assert.ok(references.length > 0);
    for (const reference of references) {
        assert.equal(fs.existsSync(path.join(repoRoot, 'public', reference.slice(1))), true, reference);
    }
});

test('content admin routes are nested under Conteúdo', () => {
    const layout = fs.readFileSync(path.join(repoRoot, 'src/components/admin/AdminLayout.tsx'), 'utf8');
    assert.match(layout, /label:\s*["']Conteúdo["']/);
    for (const route of ['/admin/comentarios', '/admin/tratamentos', '/admin/blog', '/admin/stories']) {
        assert.match(layout, new RegExp(route.replaceAll('/', '\\/')));
    }
});

test('public upload consumers request public scope', () => {
    for (const file of ['AdminBlog.tsx', 'AdminTreatments.tsx', 'AdminStories.tsx', 'AdminSettings.tsx']) {
        const source = fs.readFileSync(path.join(repoRoot, 'src/pages', file), 'utf8');
        assert.match(source, /scope.*public|public.*scope/, file);
    }
});
