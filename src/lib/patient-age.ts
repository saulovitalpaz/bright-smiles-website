export type PatientAgeGroup = "child" | "adolescent" | "adult";
export type PatientDentition = "deciduous" | "mixed" | "permanent" | "legacy";

export interface DerivedPatientAge {
  age: number | null;
  ageGroup: PatientAgeGroup | null;
  dentition: PatientDentition;
}

function parseDateParts(value: string | Date): [number, number, number] | null {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return null;
    return [value.getFullYear(), value.getMonth() + 1, value.getDate()];
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const parts = match.slice(1).map(Number) as [number, number, number];
  const check = new Date(parts[0], parts[1] - 1, parts[2]);
  if (check.getFullYear() !== parts[0] || check.getMonth() + 1 !== parts[1] || check.getDate() !== parts[2]) return null;
  return parts;
}

export function derivePatientAge(
  birthDate: string | Date | null | undefined,
  now = new Date(),
): DerivedPatientAge {
  if (!birthDate) return { age: null, ageGroup: null, dentition: "legacy" };
  const birth = parseDateParts(birthDate);
  const today = parseDateParts(now);
  if (!birth || !today) return { age: null, ageGroup: null, dentition: "legacy" };
  const birthTime = new Date(birth[0], birth[1] - 1, birth[2]).getTime();
  const todayTime = new Date(today[0], today[1] - 1, today[2]).getTime();
  if (birthTime > todayTime) return { age: null, ageGroup: null, dentition: "legacy" };
  let age = today[0] - birth[0];
  if (today[1] < birth[1] || (today[1] === birth[1] && today[2] < birth[2])) age -= 1;
  if (age < 0) return { age: null, ageGroup: null, dentition: "legacy" };
  if (age < 12) return { age, ageGroup: "child", dentition: age < 6 ? "deciduous" : "mixed" };
  if (age < 18) return { age, ageGroup: "adolescent", dentition: "permanent" };
  return { age, ageGroup: "adult", dentition: "permanent" };
}
