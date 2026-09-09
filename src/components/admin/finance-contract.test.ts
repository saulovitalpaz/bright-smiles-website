import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("finance navigation and accounting contracts", () => {
    const header = read("src/components/layout/Header.tsx");
    const financePage = read("src/pages/AdminFinance.tsx");
    const financePdf = read("src/components/admin/FinanceReportPDF.tsx");
    const settingsPage = read("src/pages/AdminSettings.tsx");

    it("removes Stories and Contato from the public header", () => {
        expect(header).not.toMatch(/\{ label: "Stories"/);
        expect(header).not.toMatch(/\{ label: "Contato"/);
    });

    it("uses dated transactions with nullable descriptions", () => {
        expect(financePage).toContain('type="date"');
        expect(financePage).toContain("newDate");
        expect(financePage).toContain("description: newDesc.trim() || null");
        expect(financePage).toContain("date: newDate");
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
        expect(financePage).not.toContain("window.print()");
        expect(financePage).not.toContain("<Printer");
    });

    it("uses the global finance categories endpoint", () => {
        expect(settingsPage).toContain("/finance/categories");
        expect(settingsPage).toContain("Categorias financeiras");
        expect(settingsPage).not.toContain('"finance_categories"');
    });
});
