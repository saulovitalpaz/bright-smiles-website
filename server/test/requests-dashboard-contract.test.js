const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..', '..');
const readSource = (...segments) => fs.readFileSync(path.join(projectRoot, ...segments), 'utf8');

const adminLeadsSource = readSource('src', 'pages', 'AdminLeads.tsx');
const adminDashboardSource = readSource('src', 'pages', 'AdminDashboard.tsx');
const serverSource = readSource('server', 'index.js');

test('lead administration uses the credentialed client and refreshes lead and dashboard queries after mutations', () => {
    assert.match(adminLeadsSource, /import\s*\{\s*fetchClient\s*\}\s*from\s*["']@\/lib\/api["']/);
    assert.match(adminLeadsSource, /fetchClient\(['"]\/leads['"]\)/);
    assert.match(adminLeadsSource, /fetchClient\(`\/leads\/\$\{id\}`,[\s\S]*?method:\s*['"]PUT['"]/);
    assert.match(adminLeadsSource, /fetchClient\(`\/leads\/\$\{id\}`,[\s\S]*?method:\s*['"]DELETE['"]/);
    assert.doesNotMatch(adminLeadsSource, /axios\.(get|put|delete)\(/);
    assert.match(adminLeadsSource, /queryClient\.invalidateQueries\(\{\s*queryKey:\s*\['leads'\]\s*\}\)/);
    assert.match(adminLeadsSource, /queryClient\.invalidateQueries\(\{\s*queryKey:\s*\['dashboard-stats'\]\s*\}\)/);
    assert.match(adminLeadsSource, /await\s+res\.json\(\)/);
});

test('dashboard exposes a database-backed pending lead count and renders it without sampling recent leads', () => {
    const routeStart = serverSource.indexOf("app.get('/dashboard/stats'");
    const routeEnd = serverSource.indexOf("// Leads API", routeStart);
    const dashboardRoute = serverSource.slice(routeStart, routeEnd);

    assert.match(dashboardRoute, /prisma\.lead\.count\(\{\s*where:\s*\{\s*status:\s*\{\s*in:\s*\[['"]new['"],\s*['"]contacted['"],\s*['"]scheduled['"]\]/);
    assert.match(dashboardRoute, /pendingLeadCount/);
    assert.match(adminDashboardSource, /pendingLeadCount\??:\s*number/);
    assert.match(adminDashboardSource, /stats\.pendingLeadCount\s*\?\?\s*0/);
    assert.doesNotMatch(adminDashboardSource, /recentLeads\?\.filter/);
});
