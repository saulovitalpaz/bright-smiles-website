const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('retired article routes and navigation cannot expose legacy posts', () => {
    for (const file of ['src/App.tsx', 'src/pages/Index.tsx', 'src/components/layout/Header.tsx', 'src/components/layout/Footer.tsx', 'src/components/admin/AdminLayout.tsx']) {
        assert.doesNotMatch(read(file), /Blog|\/blog|#blog/, file);
    }
    assert.doesNotMatch(read('server/index.js'), /app\.(?:get|post|put|delete)\(['"]\/posts|prisma\.post\./);
    assert.doesNotMatch(read('src/pages/AdminAnalytics.tsx'), /\/posts|topPosts/);
    assert.doesNotMatch(read('server/seed.js'), /prisma\.post\.|blogPosts/);
});

test('seed preserves existing account credentials and validates secrets before mutations', () => {
    const source = read('server/seed.js');
    assert.match(source, /update:\s*\{\}/);
    assert.ok(source.indexOf('await buildSeedUsers(process.env)') < source.indexOf('deleteMany'));
    assert.doesNotMatch(source, /password:\s*['"]/);
});
