import { describe, expect, it } from "vitest";
import {
  FACIAL_REGIONS,
  normalizeFacialNotes,
  summarizeFacialNotes,
  toLegacyFaceMapData,
} from "./facialModel";

describe("facial harmonization document", () => {
  it("keeps bilateral anatomy as stable selectable ids", () => {
    expect(FACIAL_REGIONS.map((region) => region.id)).toEqual(
      expect.arrayContaining([
        "nasolabial-left",
        "nasolabial-right",
        "malar-left",
        "malar-right",
        "periorbital-left",
        "periorbital-right",
        "glabella",
        "chin",
      ]),
    );
    expect(FACIAL_REGIONS.find((region) => region.id === "nasolabial-right")).toMatchObject({
      name: "Sulco nasolabial",
      side: "right",
      svgId: "nasolabial-right",
    });
  });

  it("normalizes legacy notes without losing clinical values", () => {
    const normalized = normalizeFacialNotes({
      nasolabial: { product: "Ácido hialurônico", dose: "0,2 ml", notes: "Plano profundo" },
      glabela: { product: "Toxina", dose: "4U", notes: "" },
    });

    expect(normalized.version).toBe(2);
    expect(normalized.applications).toHaveLength(0);
    expect(normalized.legacyRegions).toMatchObject({
      nasolabial: { product: "Ácido hialurônico", dose: "0,2 ml", notes: "Plano profundo" },
      glabela: { product: "Toxina", dose: "4U", notes: "" },
    });
  });

  it("preserves structured applications and computes session totals", () => {
    const document = normalizeFacialNotes({
      version: 2,
      applications: [
        { id: "a1", regionId: "nasolabial-right", procedureType: "filler", coordinates: { x: 0.62, y: 0.48 }, amount: 0.2, unit: "ml", productName: "AH" },
        { id: "a2", regionId: "glabella", procedureType: "botulinum-toxin", coordinates: { x: 0.5, y: 0.3 }, amount: 4, unit: "U" },
      ],
    });

    expect(document.applications[0]).toMatchObject({ regionId: "nasolabial-right", coordinates: { x: 0.62, y: 0.48 } });
    expect(summarizeFacialNotes(document)).toEqual({ treatedRegions: 2, applications: 2, totalUnits: 4, totalMl: 0.2 });
    expect(toLegacyFaceMapData(document)).toMatchObject({
      nasolabial: { product: "AH", dose: "0,2 ml" },
      glabela: { dose: "4 U" },
    });
  });

  it("counts legacy regions as treated until they are migrated", () => {
    expect(summarizeFacialNotes({ nasolabial: { product: "AH", dose: "0,2 ml", notes: "" } })).toEqual({
      treatedRegions: 1,
      applications: 0,
      totalUnits: 0,
      totalMl: 0,
    });
  });
});
