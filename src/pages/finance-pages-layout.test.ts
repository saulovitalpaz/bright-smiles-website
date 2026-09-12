import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("finance page layout contracts", () => {
  const css = read("src/index.css");
  const clinicFinance = read("src/pages/AdminFinance.tsx");
  const personalFinance = read("src/pages/AdminPersonalFinance.tsx");

  it("keeps the visible finance print scope visible on screen", () => {
    expect(css).toMatch(/\.print-root\s*\{\s*display:\s*block\s*;\s*\}/);
    expect(clinicFinance).toContain("print-root");
    expect(clinicFinance).not.toContain("hidden print-root");
  });

  it("keeps narrow clinic finance content inside flexible containers", () => {
    const mobileClasses = clinicFinance.match(/<div className="([^"]+)">\{displayedTransactions\.map\(\(t\) => <article/)?.[1].split(/\s+/);
    expect(mobileClasses).toEqual(expect.arrayContaining(["min-w-0", "md:hidden"]));
    expect(mobileClasses).not.toContain("hidden");
    expect(clinicFinance).toContain("min-w-0 flex-col");
  });

  it("switches from transaction cards to a scrollable table at the same breakpoint", () => {
    const tableClasses = clinicFinance.match(/<div className="([^"]+)"><table/)?.[1].split(/\s+/);
    expect(tableClasses).toEqual(expect.arrayContaining(["admin-scroll-region", "hidden", "md:block"]));
    expect(tableClasses).not.toContain("lg:block");
  });

  it("stacks personal finance fields and exposes row actions on touch", () => {
    expect(personalFinance).toContain('className="grid grid-cols-1 gap-4 sm:grid-cols-2"');
    expect(personalFinance).toContain("flex min-w-0 flex-col gap-4");
    expect(personalFinance).not.toContain("sm:opacity-0 sm:group-hover:opacity-100");
    expect(personalFinance).toContain("aria-label={`Excluir ${t.description}`}");
  });

  it("keeps the clinic finance report inside the print layout root", () => {
    expect(clinicFinance).toContain("print-report");
    expect(clinicFinance).toContain("DownloadFinanceReportButton");
    expect(clinicFinance).toContain("PDF do período selecionado");
    expect(clinicFinance).not.toContain("printDocumentClass");
    expect(clinicFinance).not.toContain("printMode");
  });
});
