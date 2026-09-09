import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createExpenseCategorySummary } from "@/lib/finance";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("finance navigation and accounting contracts", () => {
    const header = read("src/components/layout/Header.tsx");
    const financePage = read("src/pages/AdminFinance.tsx");
    const financeHelpers = read("src/lib/finance.ts");
    const financePdf = read("src/components/admin/FinanceReportPDF.tsx");
    const settingsPage = read("src/pages/AdminSettings.tsx");

    it("removes Stories and Contato from the public header", () => {
        expect(header).not.toMatch(/\{ label: "Stories"/);
        expect(header).not.toMatch(/\{ label: "Contato"/);
    });

    it("uses dated transactions with nullable descriptions", () => {
        expect(financePage).toContain('type="date"');
        expect(financePage).toContain('id="transaction-date"');
        expect(financePage).toContain("newDate");
        expect(financePage).toContain("description: newDesc.trim() || null");
        expect(financePage).toContain("date: newDate");
        expect(financePage).toContain("category: newType === \"expense\" ? selectedCategory?.name : undefined");
        expect(financePage).toContain("setNewDate(todayInput)");
        expect(financePage).toContain('to="/admin/settings"');
    });

    it("loads global categories and uses them only for expense transactions", () => {
        expect(financePage).toContain('fetchClient("/finance/categories")');
        expect(financePage).toContain("financeCategories");
        expect(financePage).toContain("newCategoryId");
        expect(financePage).toContain("!selectedCategory");
        expect(financePage).toContain('newType === "expense"');
        expect(financePage).toContain("category.name");
        expect(financePage).toContain("category: newType === \"expense\" ? selectedCategory?.name : undefined");
        expect(financePage).not.toContain("categoryId: newType === 'expense'");
    });

    it("keeps finance records independent from appointment identifiers", () => {
        for (const source of [financePage, financePdf]) {
            expect(source).not.toContain("appointmentId");
            expect(source).not.toMatch(/atendimento\s+n[uºo]mero/i);
            expect(source).not.toContain("nº do atendimento");
        }
        expect(financePage).toContain("t.patient?.name");
    });

    it("exposes accounting totals without browser print controls", () => {
        expect(financePage).toContain("openingBalance");
        expect(financePage).toContain("closingBalance");
        expect(financePage).toContain("categorySummary");
        expect(financePage).toContain("createExpenseCategorySummary(transactions)");
        expect(financeHelpers).toContain("new Map<string, number>()");
        expect(financePage).toContain("Líquido do mês");
        expect(financePage).toContain("Inclui o fechamento anterior");
        expect(financePage).not.toContain("window.print()");
        expect(financePage).not.toContain("<Printer");
    });

    it("keeps rows patient-first and exports the whole selected period", () => {
        expect(financePage).toContain("t.patient?.name || (t.description || t.category)");
        expect(financePage).toContain("t.patient && t.description");
        expect(financePage).toContain("t.description || t.category");
        expect(financePage).toContain("PDF do período selecionado");
        expect(financePage).toContain("transactions={transactions}");
        expect(financePage).toContain("financePeriodTitle(filterByMonth, filterByYear)");
    });

    it("gives finance loading failures a safe UI feedback path", () => {
        expect(financePage).toContain("Não foi possível carregar o fluxo financeiro.");
        expect(financePage).toContain('role="alert"');
    });

    it("keeps the PDF accounting summary and deterministic selected-period filename", () => {
        expect(financePdf).toContain("monthlyBalance");
        expect(financePdf).toContain("openingBalance");
        expect(financePdf).toContain("closingBalance");
        expect(financePdf).toContain("periodKey");
        expect(financePdf).toContain("periodLabel");
        expect(financePdf).toContain("generatedAt");
        expect(financePdf).toContain("patient?.name");
        expect(financePdf).not.toContain("Math.random");
        expect(financePdf).not.toContain("PrintMode");
    });

    it("excludes voided expenses from the category summary", () => {
        expect(createExpenseCategorySummary([
            { type: "expense", category: "Materiais", amount: 100, paymentStatus: "voided" },
            { type: "expense", category: "Materiais", amount: 40, paymentStatus: "received" },
            { type: "expense", category: "Laboratório", amount: 60, paymentStatus: "paid" },
            { type: "expense", category: null, amount: 80, paymentStatus: "received" },
        ])).toEqual([
            { name: "Laboratório", amount: 60, percentage: 60 },
            { name: "Materiais", amount: 40, percentage: 40 },
        ]);
    });

    it("uses the global finance categories endpoint", () => {
        expect(settingsPage).toContain("/finance/categories");
        expect(settingsPage).toContain("Categorias financeiras");
        expect(settingsPage).not.toContain('"finance_categories"');
    });
});
