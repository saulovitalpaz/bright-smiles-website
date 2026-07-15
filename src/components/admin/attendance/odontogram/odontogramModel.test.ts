import { describe, expect, expectTypeOf, it } from "vitest";
import {
  getFaceLabels,
  getToothFamily,
  updateToothFace,
  updateWholeTooth,
  type FaceStatus,
  type ToothFaceData,
  type ToothStatus,
  type WholeToothStatus,
  type ToothData,
} from "./odontogramModel";

describe("odontogramModel", () => {
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
