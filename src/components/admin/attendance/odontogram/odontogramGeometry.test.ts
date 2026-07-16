import { describe, expect, it } from "vitest";
import { ANATOMICAL_GEOMETRY } from "./odontogramGeometry";

describe("odontogram frontal geometry", () => {
  it.each(["incisor", "canine", "premolar", "molar"] as const)(
    "defines five frontal surfaces for %s",
    (family) => {
      const geometry = ANATOMICAL_GEOMETRY[family].frontal;

      expect(Object.keys(geometry.surfaces).sort()).toEqual([
        "bottom",
        "center",
        "left",
        "right",
        "top",
      ]);
      expect(Object.values(geometry.surfaces).every((path) => path.length > 20)).toBe(true);
    },
  );

  it("uses separated curved roots for molars", () => {
    const roots = ANATOMICAL_GEOMETRY.molar.frontal.roots;

    expect(roots).toHaveLength(3);
    expect(roots.every((path) => /C|S/.test(path))).toBe(true);
    expect(new Set(roots).size).toBe(3);
  });
});
