const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PUBLIC_SETTINGS_KEYS, toPublicSettings } = require('../utils/publicSettings');

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

test('public media consumers resolve dynamic media through mediaUrl', () => {
    const consumers = [
        ['src/pages/BlogList.tsx', 'post.image'],
        ['src/pages/TreatmentList.tsx', 'treatment.image'],
        ['src/components/sections/Stories.tsx', 'story.url'],
        ['src/components/layout/Header.tsx', 'settings?.site_logo'],
        ['src/components/layout/Footer.tsx', 'settings?.site_logo']
    ];

    for (const [file, value] of consumers) {
        const source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
        assert.match(source, new RegExp(`mediaUrl\\(${value.replaceAll('.', '\\.') .replaceAll('?', '\\?')}\\)`), file);
    }

    const stories = fs.readFileSync(path.join(repoRoot, 'src/components/sections/Stories.tsx'), 'utf8');
    assert.doesNotMatch(stories, /src=\{(?:story\.url|stories\[selectedStoryIndex\]\.url)\}/);
    assert.match(stories, /mediaUrl\(stories\[selectedStoryIndex\]\.url\)/);
});

test('Conteúdo preserves manager-visible and admin-only child routes', () => {
    const layout = fs.readFileSync(path.join(repoRoot, 'src/components/admin/AdminLayout.tsx'), 'utf8');
    assert.match(layout, /const contentSubItems\s*=\s*isManager\s*\?/);
    assert.match(layout, /label:\s*["']Comentários["'][\s\S]*label:\s*["']Stories["']/);
    assert.match(layout, /label:\s*["']Tratamentos["'][\s\S]*label:\s*["']Blog["']/);
    const contentItem = layout.match(/\{\s*label:\s*["']Conteúdo["'][\s\S]*?subItems:\s*contentSubItems[\s\S]*?\}/)?.[0];
    assert.ok(contentItem);
    assert.doesNotMatch(contentItem, /adminOnly/);
});

test('remaining public media consumers resolve detail, thumbnail, and card media through mediaUrl', () => {
    const consumers = [
        ['src/pages/BlogPost.tsx', /return mediaUrl\(image\) \|\| image/, /src=\{mediaUrl\(img\) \|\| img\}/],
        ['src/pages/TreatmentDetail.tsx', /mediaUrl\(treatment\.image\)/, /mediaUrl\(treatment\.results\[activeResultIndex\]\.image\)/],
        ['src/components/sections/Blog.tsx', /mediaUrl\(post\.image\)/],
        ['src/components/sections/Services.tsx', /mediaUrl\(service\.image\)/]
    ];

    for (const [file, ...expressions] of consumers) {
        const source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
        for (const expression of expressions) {
            assert.match(source, expression, file);
        }
    }
});

test('Conteúdo parent routes managers to a manager-visible child', () => {
    const layout = fs.readFileSync(path.join(repoRoot, 'src/components/admin/AdminLayout.tsx'), 'utf8');
    assert.match(layout, /href:\s*isManager\s*\?\s*["']\/admin\/comentarios["']\s*:\s*["']\/admin\/blog["']/);
});

test('public branding uses an allowlisted unauthenticated settings route', () => {
    const server = fs.readFileSync(path.join(repoRoot, 'server/index.js'), 'utf8');
    const publicSettings = fs.readFileSync(path.join(repoRoot, 'server/utils/publicSettings.js'), 'utf8');
    const header = fs.readFileSync(path.join(repoRoot, 'src/components/layout/Header.tsx'), 'utf8');
    const footer = fs.readFileSync(path.join(repoRoot, 'src/components/layout/Footer.tsx'), 'utf8');

    assert.match(server, /toPublicSettings\(settings\)/);
    for (const key of ['site_logo', 'clinic_name', 'clinic_slogan', 'contact_whatsapp', 'contact_instagram']) {
        assert.match(publicSettings, new RegExp(`['"]${key}['"]`));
    }
    assert.match(server, /app\.get\(['"]\/public-settings['"]/);
    assert.match(publicSettings, /PUBLIC_SETTINGS_KEYS\.has\(setting\.key\)/);
    for (const source of [header, footer]) {
        assert.match(source, /API_URL}\/public-settings/);
        assert.doesNotMatch(source, /API_URL}\/settings/);
        assert.match(source, /mediaUrl\(settings\?\.site_logo\)/);
    }
});

test('settings writes are admin-only and share the public settings allowlist', () => {
    const server = fs.readFileSync(path.join(repoRoot, 'server/index.js'), 'utf8');
    const settingsPage = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminSettings.tsx'), 'utf8');
    const settingsWrite = server.match(/app\.post\('\/settings',[\s\S]*?\n\}\);/)?.[0];

    assert.deepEqual([...PUBLIC_SETTINGS_KEYS].sort(), [
        'clinic_name',
        'clinic_slogan',
        'contact_instagram',
        'contact_whatsapp',
        'site_logo'
    ]);
    assert.deepEqual(toPublicSettings([
        { key: 'site_logo', value: 'bucket://public/logo.png' },
        { key: 'private_note', value: 'do-not-return' }
    ]), { site_logo: 'bucket://public/logo.png' });
    assert.ok(settingsWrite);
    assert.match(settingsWrite, /authenticateToken/);
    assert.match(settingsWrite, /authorizeRole\(\['admin'\]\)/);
    assert.match(settingsWrite, /PUBLIC_SETTINGS_KEYS\.has\(key\)/);
    assert.match(settingsPage, /axios\.get\(`\$\{API_URL\}\/settings`, \{ withCredentials: true \}\)/);
    assert.match(settingsPage, /axios\.post\(`\$\{API_URL\}\/settings`, \{ key, value \}, \{ withCredentials: true \}\)/);
});
