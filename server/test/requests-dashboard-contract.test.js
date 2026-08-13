const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..', '..');

const loadFetchClient = () => {
    const apiPath = path.join(projectRoot, 'src', 'lib', 'api.ts');
    const source = fs.readFileSync(apiPath, 'utf8')
        .replace("import axios from 'axios';", 'const axios = globalThis.__axios;')
        .replaceAll('import.meta.env', 'importMeta.env')
        .replace('export const API_URL', 'const API_URL')
        .replace('export const adminApi', 'const adminApi')
        .replace('export const fetchClient', 'const fetchClient')
        .concat('\nmodule.exports = { fetchClient };');
    const context = vm.createContext({
        __axios: { create: () => ({}) },
        FormData,
        fetch: undefined,
        importMeta: { env: { VITE_API_URL: 'https://api.test' } },
        module: { exports: {} },
        window: undefined
    });
    const executableSource = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    new vm.Script(executableSource, { filename: apiPath }).runInContext(context);
    return { fetchClient: context.module.exports.fetchClient, context };
};

test('fetchClient sends the authenticated browser cookie with lead requests', async () => {
    const { fetchClient, context } = loadFetchClient();
    let request;
    context.fetch = async (url, options) => {
        request = { url, options };
        return { status: 200 };
    };

    await fetchClient('/leads/7', { method: 'PUT', body: JSON.stringify({ status: 'scheduled' }) });

    assert.equal(request.url, 'https://api.test/leads/7');
    assert.equal(request.options.credentials, 'include');
    assert.equal(request.options.method, 'PUT');
    assert.equal(request.options.headers['Content-Type'], 'application/json');
});

test('dashboard stats returns the database count for all pending lead statuses', async () => {
    const { createDashboardStatsHandler } = require('../routes/dashboard');
    const leadCountCalls = [];
    const prisma = {
        user: { count: async () => 4 },
        post: { count: async () => 3 },
        appointment: {
            count: async () => 2,
            findMany: async () => []
        },
        lead: {
            count: async (options) => {
                leadCountCalls.push(options);
                return options ? 8 : 12;
            },
            findMany: async () => []
        },
        testimonial: {
            count: async () => 1,
            findMany: async () => []
        }
    };
    let payload;
    const res = {
        json: (value) => { payload = value; },
        status: () => res
    };

    await createDashboardStatsHandler(prisma, () => [])({}, res);

    assert.equal(payload.pendingLeadCount, 8);
    assert.equal(payload.leads, 12);
    assert.deepEqual(leadCountCalls[1], {
        where: { status: { in: ['new', 'contacted', 'scheduled'] } }
    });
    assert.deepEqual(payload.recentLeads, []);
});

test('lead mutations refresh both dashboard and lead query caches', () => {
    const source = fs.readFileSync(path.join(projectRoot, 'src', 'pages', 'AdminDashboard.tsx'), 'utf8');
    assert.match(source, /useQueryClient/);
    assert.match(source, /queryClient\.invalidateQueries\(\{\s*queryKey:\s*\['leads'\]\s*\}\)/);
});
