### Task 3: Add global category management to `/admin/settings`

**Files:**
- Modify: `src/pages/AdminSettings.tsx`
- Modify: `src/pages/AdminSettings.test.tsx`

**Interfaces:**
- Consumes: `GET/POST/DELETE /finance/categories` and existing authenticated settings state.
- Produces: accessible global category management without adding financial data to public settings.

- [ ] **Step 1: Add category state and loading**

Add `FinanceCategory`, `financeCategories`, `newFinanceCategory` and `isCategorySaving` state. Fetch categories with `withCredentials: true` alongside the existing `/settings` load using `Promise.all`; do not add categories to `settings` or `EDITABLE_SETTING_KEYS`.

- [ ] **Step 2: Add create/delete handlers**

Implement create with `axios.post(`${API_URL}/finance/categories`, { name }, { withCredentials: true })`, trim and reject empty input in the UI, append the returned category sorted by name, clear the input and show success/error toast. Implement delete with `axios.delete(`${API_URL}/finance/categories/${id}`, { withCredentials: true })`; on 409 show `Não é possível remover uma categoria usada em transações.` and keep the item visible.

- [ ] **Step 3: Render the settings card**

Add a `Card` titled `Categorias financeiras` with `Label htmlFor="new-finance-category"`, input accessible as `Nova categoria financeira`, `Adicionar categoria` button, list of names and delete buttons with `aria-label={`Remover categoria ${category.name}`}` and 44px touch targets.

- [ ] **Step 4: Run settings tests**

Run: `npm test -- src/pages/AdminSettings.test.tsx`

Expected: existing profile/settings tests and category CRUD coverage pass.

- [ ] **Step 5: Commit settings category management**

```powershell
git add -- src/pages/AdminSettings.tsx src/pages/AdminSettings.test.tsx
git commit -m "feat: manage global finance categories in settings"
```

