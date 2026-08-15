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

    it("registers the standalone calendar route", () => {
        expect(appSource).toMatch(/path="\/admin\/calendario"/);
    });

    it("points the dashboard shortcut to the standalone calendar page", () => {
        expect(dashboardSource).toContain("navigate('/admin/calendario')");
        expect(dashboardSource).not.toContain("navigate('/admin/consultas?view=calendar')");
    });

    it("keeps attendances and settings grouped in the sidebar", () => {
        expect(layoutSource).toMatch(/label:\s*["']Atendimentos["']/);
        expect(layoutSource).toMatch(/label:\s*["']Calendário["'][\s\S]*href:\s*["']\/admin\/calendario["']/);
        expect(layoutSource).toMatch(/label:\s*["']Pacientes["'][\s\S]*href:\s*["']\/admin\/pacientes["']/);
        expect(layoutSource).toMatch(/label:\s*["']Configurações["']/);
        expect(layoutSource).toMatch(/label:\s*["']Equipe["'][\s\S]*href:\s*["']\/admin\/users["']/);
    });

    it("does not broaden manager access to the clinical calendar", () => {
        expect(authSource).not.toMatch(/MANAGER_ALLOWED_ROUTES[\s\S]*\/admin\/calendario/);
    });
});
