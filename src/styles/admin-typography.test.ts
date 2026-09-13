import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve("src/styles/admin-typography.css"), "utf8");
const stylesheet = postcss.parse(source);

describe("admin typography contract", () => {
  it("keeps every typography rule screen-only and administratively scoped", () => {
    stylesheet.walkRules(rule => {
      expect(rule.selector).toContain(".admin-shell");
      let parent: postcss.Node | undefined = rule.parent;
      while (parent && !(parent.type === "atrule" && "name" in parent && parent.name === "media" && "params" in parent && parent.params === "screen")) {
        parent = parent.parent;
      }
      expect(parent, rule.selector).toBeDefined();
    });
    stylesheet.walkDecls(declaration => expect(declaration.important).toBeFalsy());
  });

  it("scopes portal typography to a mounted admin shell and preserves authored content", () => {
    expect(source).toContain('body:has(.admin-shell) [role="dialog"]');
    expect(source).toContain('body:has(.admin-shell) [role="alertdialog"]');
    expect(source).toContain('body:has(.admin-shell) [data-radix-popper-content-wrapper]');
    expect(source).toContain('.print-only *');
    expect(source).toContain('.prose *');
    expect(source).toContain('[contenteditable="true"] *');
    expect(source).toContain('.admin-brand *');
    expect(source).toContain('svg *');
  });

  it("keeps page headings separate from card headings and inputs readable on mobile", () => {
    const rules = stylesheet.nodes[1];
    expect(rules.type).toBe("atrule");
    expect(source).toContain('h1:not(');
    expect(source).toContain('font-size: 1.5rem;');
    expect(source).toContain(':is(h2, h3, h4, h5, h6, [data-card-slot="title"])');
    expect(source).toContain('@media (max-width: 639px)');
    expect(source).toContain('font-size: 1rem;');
  });
});
