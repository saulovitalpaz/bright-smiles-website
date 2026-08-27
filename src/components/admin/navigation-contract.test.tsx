import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
    fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("admin navigation source contract", () => {
    const appSource = readSource("src/App.tsx");
    const layoutSource = readSource("src/components/admin/AdminLayout.tsx");
    const dashboardSource = readSource("src/pages/AdminDashboard.tsx");
    const authSource = readSource("src/hooks/useAuth.tsx");
    const prescriptionSource = readSource("src/pages/AdminPrescription.tsx");
    const documentsSource = readSource("src/pages/AdminDocuments.tsx");
    const cssSource = readSource("src/index.css");

    it("registers the standalone calendar route", () => {
        expect(appSource).toMatch(/path="\/admin\/calendario"/);
    });

    it("points the dashboard shortcut to the standalone calendar page", () => {
        expect(dashboardSource).toContain("navigate('/admin/calendario')");
        expect(dashboardSource).not.toContain("navigate('/admin/consultas?view=calendar')");
    });

    it("keeps attendances and settings grouped in the sidebar", () => {
        expect(layoutSource).toMatch(/label:\s*["']Atendimentos["']/);
        expect(layoutSource).toMatch(/label:\s*["']Agenda["'][\s\S]*href:\s*["']\/admin\/calendario["']/);
        expect(layoutSource).toMatch(/label:\s*["']Pacientes["'][\s\S]*href:\s*["']\/admin\/pacientes["']/);
        expect(layoutSource).toMatch(/label:\s*["']Configurações["']/);
        expect(layoutSource).toMatch(/label:\s*["']Equipe["'][\s\S]*href:\s*["']\/admin\/users["']/);
    });

    it("does not broaden manager access to the clinical calendar", () => {
        expect(authSource).not.toMatch(/MANAGER_ALLOWED_ROUTES[\s\S]*\/admin\/calendario/);
    });

    it("keeps the mobile menu trigger available during page scroll", () => {
        expect(layoutSource).toMatch(/admin-mobile-bar[\s\S]*sticky top-0/);
        expect(layoutSource).toContain("safe-area-inset-top");
    });

    it("uses disclosure buttons instead of default links for grouped navigation", () => {
        expect(layoutSource).toContain('type="button"');
        expect(layoutSource).toContain("aria-expanded={isGroupOpen}");
        expect(layoutSource).toContain("aria-controls={submenuId}");
        expect(layoutSource).toContain("renderNestedItems(item, isGroupOpen, submenuId)");
    });

    it("exposes separate prescription and odontogram print targets", () => {
        expect(prescriptionSource).toContain('type PrintTarget = "prescription" | "odontogram"');
        expect(prescriptionSource).toContain('setPrintTarget("odontogram")');
        expect(prescriptionSource).toContain("data-print-target={printTarget}");
        expect(prescriptionSource).toContain("print-page-odontogram");
    });

    it("waits for the document print root before invoking browser print", () => {
        expect(prescriptionSource).toContain("requestAnimationFrame");
        expect(prescriptionSource).toContain('addEventListener("afterprint"');
        expect(documentsSource).toContain("requestAnimationFrame");
        expect(documentsSource).toContain('addEventListener("afterprint"');
    });

    it("keeps the print flow fragmentable and page-break controlled", () => {
        expect(cssSource).toMatch(/\.print-root\s*\{[\s\S]*display:\s*none/);
        expect(cssSource).toMatch(/\.print-document\s*\{[\s\S]*display:\s*block\s*!important/);
        expect(cssSource).toContain(".print-page-odontogram");
    });

    it("offers a standalone odontogram print action in the odontogram card", () => {
        expect(prescriptionSource).toContain("Imprimir odontograma");
        expect(prescriptionSource).toContain("handlePrintOdontogram");
        expect(prescriptionSource).toContain("normalizeOdontogram(patientData.odontogram)");
    });

    it("preserves the page break only for a prescription that includes the odontogram", () => {
        expect(prescriptionSource).toContain('printTarget === "prescription"');
        expect(prescriptionSource).toContain("print-page-odontogram");
    });

    it("mounts the document print root only for an active print request", () => {
        expect(documentsSource).toContain("isPrintReady");
        expect(documentsSource).toContain("setIsPrintReady(true)");
        expect(documentsSource).toContain('data-print-target="document"');
        expect(documentsSource).toContain("hidden print-only print-root");
    });

    it("keeps key admin card actions reachable without hover", () => {
        expect(prescriptionSource).toContain("opacity-100 sm:opacity-0");
        expect(documentsSource).toContain("min-h-11");
    });

    it("keeps shared admin content bounded", () => {
        expect(cssSource).toMatch(/\.admin-content[\s\S]*min-width:\s*0/);
        expect(cssSource).toMatch(/\.admin-card[\s\S]*max-width:\s*100%/);
    });
});
