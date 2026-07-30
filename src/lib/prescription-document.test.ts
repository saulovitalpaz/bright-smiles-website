import { describe, expect, it } from "vitest";
import { getPdfOdontogramSummary } from "./prescription-document";

describe("getPdfOdontogramSummary", () => {
  it("lists every layered condition for the same precise region", () => {
    expect(getPdfOdontogramSummary({
      version: 2,
      dentition: "permanent",
      teeth: {
        "16": { notes: "", conditions: [
          { id: "c1", category: "achado", type: "carie", stage: "planejado", targets: [{ kind: "surface", face: "center", region: "incisalOcclusal" }] },
          { id: "c2", category: "restauracao", type: "resina_composta", stage: "concluido", targets: [{ kind: "surface", face: "center", region: "incisalOcclusal" }] },
        ] },
      },
    })).toEqual(["16: carie planejado (Oclusal / Incisal - oclusal/incisal); resina composta concluido (Oclusal / Incisal - oclusal/incisal)"]);
  });
});
