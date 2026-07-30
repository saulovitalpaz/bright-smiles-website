import { describe, expect, expectTypeOf, it } from "vitest";
import {
  getFaceLabels,
  getClinicalStageLabel,
  getConditionTargetLabel,
  getToothFamily,
  createCondition,
  normalizeOdontogram,
  upsertCondition,
  updateToothFace,
  updateWholeTooth,
  type FaceStatus,
  type ToothFaceData,
  type ToothStatus,
  type WholeToothStatus,
  type ToothData,
} from "./odontogramModel";

describe("odontogramModel", () => {
  it("normalizes legacy status, faces and notes without dropping data", () => {
    const result = normalizeOdontogram({
      "16": {
        status: "Implante",
        notes: "controle anual",
        faces: { center: { status: "Tratado" } },
      },
    });

    expect(result).toMatchObject({ version: 2, dentition: "permanent" });
    expect(result.teeth["16"].notes).toBe("controle anual");
    expect(result.teeth["16"].conditions).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "implante", targets: [{ kind: "tooth" }] }),
      expect.objectContaining({
        type: "legado_tratado",
        targets: [{ kind: "surface", face: "center", region: "entire" }],
      }),
    ]));
  });

  it("keeps two conditions on the same exact target", () => {
    const target = [{ kind: "surface" as const, face: "center" as const, region: "incisalOcclusal" as const }];
    const caries = createCondition({ category: "achado", type: "carie", stage: "planejado", targets: target });
    const resin = createCondition({ category: "restauracao", type: "resina_composta", stage: "concluido", targets: target });

    const result = upsertCondition(upsertCondition(normalizeOdontogram({}), 16, caries), 16, resin);
    expect(result.teeth["16"].conditions).toEqual([caries, resin]);
  });

  it("rejects a partial target for a crown", () => {
    expect(() => createCondition({
      category: "protese",
      type: "coroa_total",
      stage: "planejado",
      targets: [{ kind: "surface", face: "center", region: "entire" }],
    })).toThrow("coroa_total exige o alvo dente inteiro");
  });

  it("keeps face and whole-tooth status contracts distinct", () => {
    expectTypeOf<ToothFaceData["status"]>().toEqualTypeOf<FaceStatus>();
    expectTypeOf<ToothData["status"]>().toEqualTypeOf<WholeToothStatus>();
    expectTypeOf<Parameters<typeof updateToothFace>[3]>().toEqualTypeOf<FaceStatus>();
    expectTypeOf<Parameters<typeof updateWholeTooth>[2]>().toEqualTypeOf<WholeToothStatus>();
    expectTypeOf<ToothStatus>().toEqualTypeOf<FaceStatus | WholeToothStatus>();
  });

  it("maps FDI numbers to anatomical families", () => {
    expect(getToothFamily(11)).toBe("incisor");
    expect(getToothFamily(13)).toBe("canine");
    expect(getToothFamily(15)).toBe("premolar");
    expect(getToothFamily(18)).toBe("molar");
  });

  it("maps positional faces to clinical labels", () => {
    expect(getFaceLabels(11).right).toBe("Mesial");
    expect(getFaceLabels(31).bottom).toBe("Vestibular");
  });

  it("formats a stage and exact target for a tooth", () => {
    expect(getClinicalStageLabel("emAndamento")).toBe("Em andamento");
    expect(getConditionTargetLabel(16, { kind: "surface", face: "center", region: "incisalOcclusal" }))
      .toBe("Oclusal / Incisal - oclusal/incisal");
    expect(getConditionTargetLabel(36, { kind: "tooth" })).toBe("Dente inteiro");
  });

  it("updates one face without erasing other clinical data", () => {
    const input: Record<string, ToothData> = {
      "16": {
        status: "Saudável",
        notes: "sensibilidade",
        faces: { left: { status: "Tratado" } },
      },
    };
    const result = updateToothFace(input, 16, "center", "Tratar");
    expect(result["16"].faces).toEqual({
      left: { status: "Tratado" },
      center: { status: "Tratar" },
    });
    expect(result["16"].notes).toBe("sensibilidade");
    expect(input["16"].faces?.center).toBeUndefined();
  });

  it("updates the whole tooth without erasing faces", () => {
    const input: Record<string, ToothData> = {
      "21": {
        status: "Saudável",
        notes: "controle",
        faces: { top: { status: "Tratar" } },
      },
    };
    expect(updateWholeTooth(input, 21, "Implante")["21"]).toEqual({
      status: "Implante",
      notes: "controle",
      faces: { top: { status: "Tratar" } },
    });
  });
});
