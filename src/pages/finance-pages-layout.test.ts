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
    expect(clinicFinance).toContain('className="min-w-0 space-y-3 lg:hidden"');
    expect(clinicFinance).toContain("min-w-0 flex-col");
  });

  it("stacks personal finance fields and exposes row actions on touch", () => {
    expect(personalFinance).toContain('className="grid grid-cols-1 gap-4 sm:grid-cols-2"');
    expect(personalFinance).toContain("flex min-w-0 flex-col gap-4");
    expect(personalFinance).toContain("sm:opacity-0 sm:group-hover:opacity-100");
    expect(personalFinance).toContain("aria-label={`Excluir ${t.description}`}");
  });
});
