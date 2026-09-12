## Task 2: Centralizar o envio e corrigir a página de analytics

**Files:**
- Create: `src/lib/analytics.ts`
- Create: `src/lib/analytics.test.ts`
- Modify: `src/components/PageTracker.tsx`
- Modify: `src/pages/BlogPost.tsx`
- Modify: `src/components/sections/Stories.tsx`
- Modify: `src/pages/AdminAnalytics.tsx`
- Create: `src/pages/AdminAnalytics.test.tsx`

**Interfaces:**
- Produces `trackAnalyticsEvent(event: { type: AnalyticsEventType; path: string; source?: string }): void`.
- `trackAnalyticsEvent` sends JSON to `${API_URL}/analytics` with `fetch`, `keepalive: true`, and never throws to the UI.
- `AdminAnalytics` reads protected data through `fetchClient('/analytics/stats')` and public posts through `fetch(`${API_URL}/posts`)`.

- [ ] **Step 1: Write failing helper and page tests**

Test that the helper sends the exact event contract and silently handles fetch failure:

```ts
it('sends a normalized event with keepalive', () => {
  trackAnalyticsEvent({ type: 'pageview', path: '/blog', source: 'Google' });
  expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/analytics`, expect.objectContaining({
    method: 'POST',
    keepalive: true,
    body: JSON.stringify({ type: 'pageview', path: '/blog', source: 'Google' })
  }));
});
```

Mock `fetchClient` and `fetch` in `AdminAnalytics.test.tsx`; assert that the stats request goes through `fetchClient('/analytics/stats')`, the page renders nonzero stats from the response, and a posts failure leaves the metrics visible.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```powershell
npx vitest run src/lib/analytics.test.ts src/pages/AdminAnalytics.test.tsx
```

Expected: FAIL because the helper/test page behavior is absent or still uses raw Axios calls.

- [ ] **Step 3: Implement the helper and replace duplicate senders**

Create `src/lib/analytics.ts`:

```ts
import { API_URL } from '@/lib/api';

export type AnalyticsEventType = 'pageview' | 'blog_view' | 'story_view';
export interface AnalyticsEvent { type: AnalyticsEventType; path: string; source?: string; }

export const trackAnalyticsEvent = (event: AnalyticsEvent) => {
  void fetch(`${API_URL}/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify(event),
  }).catch(() => undefined);
};
```

Use it in `PageTracker`, `BlogPost` and `Stories`, preserving each existing event type/path. `PageTracker` must keep its UTM/referrer source inference and effect dependency on pathname.

- [ ] **Step 4: Replace `AdminAnalytics` loading and aggregation**

Remove the direct Axios import and dashboard request. Load stats and posts in parallel with independent outcomes; use a visible error/retry state for stats and a local empty/error state for posts. Preserve cards and add the aggregate sections from the backend response (`topPaths`, `devices`, regions) while renaming the neighborhood card to approximate regions. Percentages must use `analytics.totalVisits || 1` and never divide content-event totals.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run:

```powershell
npx vitest run src/lib/analytics.test.ts src/pages/AdminAnalytics.test.tsx
```

Expected: all helper/page tests pass without `navigator.geolocation` references.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/analytics.ts src/lib/analytics.test.ts src/components/PageTracker.tsx src/pages/BlogPost.tsx src/components/sections/Stories.tsx src/pages/AdminAnalytics.tsx src/pages/AdminAnalytics.test.tsx
git commit -m "fix: restore authenticated analytics dashboard"
```

---

