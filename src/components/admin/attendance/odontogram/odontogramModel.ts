export const FACE_KEYS = ["top", "right", "bottom", "left", "center"] as const;
export type FaceKey = (typeof FACE_KEYS)[number];
export type ToothFamily = "incisor" | "canine" | "premolar" | "molar";
export type ToothStatus = "Saudável" | "Tratar" | "Tratado" | "Ausente" | "Implante" | "Ponte";

export interface ToothFaceData {
  status: string;
}

export interface ToothData {
  status: string;
  notes: string;
  faces?: Partial<Record<FaceKey, ToothFaceData>>;
}

export const EMPTY_TOOTH: ToothData = { status: "Saudável", notes: "" };

export function getToothFamily(toothNumber: number): ToothFamily {
  const position = toothNumber % 10;
  if (position >= 6) return "molar";
  if (position >= 4) return "premolar";
  if (position === 3) return "canine";
  return "incisor";
}

export function getFaceLabels(toothNumber: number): Record<FaceKey, string> {
  const upper = toothNumber >= 11 && toothNumber <= 28;
  const rightQuadrant =
    (toothNumber >= 11 && toothNumber <= 18) ||
    (toothNumber >= 41 && toothNumber <= 48);
  return {
    top: upper ? "Vestibular" : "Lingual",
    bottom: upper ? "Palatina" : "Vestibular",
    left: rightQuadrant ? "Distal" : "Mesial",
    right: rightQuadrant ? "Mesial" : "Distal",
    center: "Oclusal / Incisal",
  };
}

export function getTooth(data: Record<string, ToothData>, toothNumber: number): ToothData {
  return data[String(toothNumber)] ?? EMPTY_TOOTH;
}

export function updateToothFace(
  data: Record<string, ToothData>,
  toothNumber: number,
  face: FaceKey,
  status: ToothStatus,
): Record<string, ToothData> {
  const current = getTooth(data, toothNumber);
  return {
    ...data,
    [toothNumber]: {
      ...current,
      faces: { ...current.faces, [face]: { status } },
    },
  };
}

export function updateWholeTooth(
  data: Record<string, ToothData>,
  toothNumber: number,
  status: ToothStatus,
): Record<string, ToothData> {
  return {
    ...data,
    [toothNumber]: { ...getTooth(data, toothNumber), status },
  };
}
