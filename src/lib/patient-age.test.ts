import { describe, expect, it } from "vitest";
import { derivePatientAge } from "./patient-age";

describe("derivePatientAge", () => {
  const now = new Date("2026-08-27T12:00:00.000Z");

  it("classifies the exact adolescent and adult boundaries", () => {
    expect(derivePatientAge("2014-08-27", now)).toMatchObject({
      age: 12,
      ageGroup: "adolescent",
      dentition: "permanent",
    });
    expect(derivePatientAge("2008-08-27", now)).toMatchObject({
      age: 18,
      ageGroup: "adult",
      dentition: "permanent",
    });
  });

  it("derives deciduous and mixed dentition before the permanent stage", () => {
    expect(derivePatientAge("2021-08-27", now)).toMatchObject({ age: 5, dentition: "deciduous" });
    expect(derivePatientAge("2018-08-27", now)).toMatchObject({ age: 8, dentition: "mixed" });
  });

  it("uses a safe legacy result for missing, invalid, or future birth dates", () => {
    for (const birthDate of [undefined, null, "not-a-date", "2027-01-01"]) {
      expect(derivePatientAge(birthDate, now)).toEqual({
        age: null,
        ageGroup: null,
        dentition: "legacy",
      });
    }
  });
});
