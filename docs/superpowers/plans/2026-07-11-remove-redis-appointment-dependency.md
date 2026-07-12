# Remove Redis Appointment Dependency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the Railway API starts and handles appointments without attempting a Redis connection.

**Architecture:** Remove the inactive BullMQ reminder worker from the API process and remove its runtime packages. Appointment requests continue through Express, validation, Prisma, and PostgreSQL with no queue in their execution path.

**Tech Stack:** Node.js, Express, Prisma, PostgreSQL, Node built-in test runner, npm

## Global Constraints

- Do not introduce a replacement queue library.
- Do not change appointment validation or persistence behavior.
- Do not retain a localhost Redis fallback in production code.

---

### Task 1: Remove the inactive Redis reminder subsystem

**Files:**
- Create: `server/test/no-redis-runtime.test.js`
- Modify: `server/index.js:16-24`
- Modify: `server/package.json`
- Modify: `server/package-lock.json`
- Delete: `server/workers/whatsappWorker.js`

**Interfaces:**
- Consumes: `server/index.js` as the Railway API entry point and `server/package.json` as its dependency manifest.
- Produces: An API runtime whose startup path contains no BullMQ/ioredis imports and no Redis-backed scheduler.

- [ ] **Step 1: Write the failing regression test**

Create `server/test/no-redis-runtime.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');

test('API runtime has no Redis reminder dependency', () => {
    const indexSource = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const packageJson = JSON.parse(
        fs.readFileSync(path.join(serverRoot, 'package.json'), 'utf8')
    );

    assert.doesNotMatch(indexSource, /whatsappWorker|scheduleReminders|notificationQueue/);
    assert.equal(packageJson.dependencies.bullmq, undefined);
    assert.equal(packageJson.dependencies.ioredis, undefined);
    assert.equal(fs.existsSync(path.join(serverRoot, 'workers', 'whatsappWorker.js')), false);
});
```

- [ ] **Step 2: Run the test and verify the regression is reproduced**

Run: `node --test test/no-redis-runtime.test.js` from `server/`.

Expected: FAIL because `index.js` imports `whatsappWorker`, `package.json` contains `bullmq` and `ioredis`, and the worker file exists.

- [ ] **Step 3: Remove worker startup from the API**

Delete these statements from `server/index.js`:

```js
const { notificationQueue, scheduleReminders } = require('./workers/whatsappWorker');

// Start scheduler
setInterval(scheduleReminders, 1000 * 60 * 60); // Check every hour
```

Also delete the commented queue call inside the appointment route:

```js
// await notificationQueue.add('appointmentReminder', { appointmentId: appointment.id }, { delay: ... });
```

Delete `server/workers/whatsappWorker.js`.

- [ ] **Step 4: Remove unused packages and refresh the lockfile**

Run from `server/`:

```powershell
npm uninstall bullmq ioredis
```

Expected: `package.json` and `package-lock.json` no longer contain runtime dependency entries for BullMQ or ioredis.

- [ ] **Step 5: Run the regression test**

Run: `node --test test/no-redis-runtime.test.js` from `server/`.

Expected: PASS with one passing test and no Redis connection errors.

- [ ] **Step 6: Verify dependency and source cleanup**

Run from the repository root:

```powershell
rg -n "whatsappWorker|scheduleReminders|notificationQueue|bullmq|ioredis|6379" server -g '!node_modules'
```

Expected: no matches.

- [ ] **Step 7: Verify server and application builds**

Run from `server/`: `npm run build`.

Expected: Prisma client generation completes successfully.

Run from the repository root: `npm run build`.

Expected: Vite production build exits successfully.

- [ ] **Step 8: Commit the implementation**

```powershell
git add server/index.js server/package.json server/package-lock.json server/test/no-redis-runtime.test.js
git add -u server/workers/whatsappWorker.js
git commit -m "fix: remove redis dependency from appointment api"
```
