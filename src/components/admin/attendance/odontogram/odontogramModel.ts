export const FACE_KEYS = ["top", "right", "bottom", "left", "center"] as const;
export type FaceKey = (typeof FACE_KEYS)[number];
export type ToothFamily = "incisor" | "canine" | "premolar" | "molar";
export type FaceStatus = "Saudável" | "Tratar" | "Tratado";
export type WholeToothStatus = "Saudável" | "Ausente" | "Implante" | "Ponte";
export type ToothStatus = FaceStatus | WholeToothStatus;
export type Dentition = "deciduous" | "mixed" | "permanent";

export interface ToothFaceData {
  status: FaceStatus;
}

export interface ToothData {
  status: WholeToothStatus;
  notes: string;
  faces?: Partial<Record<FaceKey, ToothFaceData>>;
}

export const EMPTY_TOOTH: ToothData = { status: "Saudável", notes: "" };

export function getToothFamily(toothNumber: number): ToothFamily {
  const position = toothNumber % 10;
  if (toothNumber >= 51 && toothNumber <= 85) {
    if (position === 3) return "canine";
    if (position >= 4) return "molar";
    return "incisor";
  }
  if (position >= 6) return "molar";
  if (position >= 4) return "premolar";
  if (position === 3) return "canine";
  return "incisor";
}

export function getFaceLabels(toothNumber: number): Record<FaceKey, string> {
  const upper = (toothNumber >= 11 && toothNumber <= 28) || (toothNumber >= 51 && toothNumber <= 65);
  const rightQuadrant =
    (toothNumber >= 11 && toothNumber <= 18) ||
    (toothNumber >= 41 && toothNumber <= 48) ||
    (toothNumber >= 51 && toothNumber <= 55) ||
    (toothNumber >= 81 && toothNumber <= 85);
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
  status: FaceStatus,
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
  status: WholeToothStatus,
): Record<string, ToothData> {
  return {
    ...data,
    [toothNumber]: { ...getTooth(data, toothNumber), status },
  };
}

export const CLINICAL_CATALOG = {
  achado: ["carie", "lesao_carie_inicial", "infiltracao", "fratura", "trinca", "desgaste", "abrasao", "erosao", "abfracao", "mancha", "hipoplasia", "sensibilidade", "mobilidade", "furca", "retracao_gengival", "dente_ausente"],
  restauracao: ["resina_composta", "amalgama", "ionomero_vidro", "restauracao_provisoria", "selante", "inlay", "onlay", "overlay", "faceta"],
  endodontia: ["tratamento_endodontico", "retratamento", "obturacao_radicular", "lesao_periapical", "pino_intrarradicular", "nucleo"],
  protese: ["coroa_total", "coroa_parcial", "coroa_provisoria", "coroa_sobre_implante", "implante", "ponte_fixa", "protese_removivel", "elemento_pontico"],
  periodontiaCirurgia: ["gengivectomia", "enxerto", "cirurgia_periodontal", "exodontia_indicada", "exodontia_executada"],
  ortodontia: ["bracket", "banda", "contencao", "aparelho"],
} as const;

export type ClinicalCategory = keyof typeof CLINICAL_CATALOG | "legado";
export type ClinicalConditionType = (typeof CLINICAL_CATALOG)[Exclude<ClinicalCategory, "legado">][number] | "legado_tratar" | "legado_tratado" | "legado_ausente" | "legado_ponte";
export type ClinicalStage = "aAvaliar" | "planejado" | "emAndamento" | "concluido" | "monitorado" | "suspenso" | "removido";
export type ConditionTarget = { kind: "tooth" } | { kind: "surface"; face: FaceKey; region: "entire" | "cervical" | "middle" | "incisalOcclusal" };
export const MAX_CONDITION_TARGETS = 5;
export interface ClinicalCondition { id: string; category: ClinicalCategory; type: ClinicalConditionType; targets: ConditionTarget[]; stage: ClinicalStage; notes?: string; }
export interface ToothRecord { notes: string; conditions: ClinicalCondition[]; }
export interface OdontogramV2 { version: 2; dentition: "permanent"; teeth: Record<string, ToothRecord>; }
export interface OdontogramV3 { version: 3; dentition: Dentition; teeth: Record<string, ToothRecord>; }
export type LayeredOdontogram = OdontogramV2 | OdontogramV3;
export type OdontogramData = Record<string, ToothData> | OdontogramV2 | OdontogramV3;

export const PERMANENT_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38] as const;
export const DECIDUOUS_TEETH = [55, 54, 53, 52, 51, 65, 64, 63, 62, 61, 85, 84, 83, 82, 81, 75, 74, 73, 72, 71] as const;

export function getTeethForDentition(dentition: Dentition): readonly number[] {
  if (dentition === "deciduous") return DECIDUOUS_TEETH;
  if (dentition === "mixed") return [...DECIDUOUS_TEETH, ...PERMANENT_TEETH];
  return PERMANENT_TEETH;
}

export function createEmptyOdontogram(dentition: Dentition = "permanent"): OdontogramV3 {
  return { version: 3, dentition, teeth: {} };
}

export type ConditionVisual = {
  label: string;
  fill: string;
  stroke: string;
  pattern?: "dots" | "diagonal" | "crosshatch" | "dashed";
};

const CLINICAL_STAGE_LABELS: Record<ClinicalStage, string> = {
  aAvaliar: "A avaliar",
  planejado: "Planejado",
  emAndamento: "Em andamento",
  concluido: "Concluído",
  monitorado: "Monitorado",
  suspenso: "Suspenso",
  removido: "Removido",
};

const CLINICAL_STAGE_VISUALS: Record<ClinicalStage, ConditionVisual> = {
  aAvaliar: { label: "A avaliar", fill: "#fef3c7", stroke: "#b45309", pattern: "dots" },
  planejado: { label: "Planejado / a tratar", fill: "#fce8e6", stroke: "#b42318", pattern: "diagonal" },
  emAndamento: { label: "Em andamento", fill: "#ffedd5", stroke: "#c2410c", pattern: "crosshatch" },
  concluido: { label: "Concluído", fill: "#99f6e4", stroke: "#0f766e" },
  monitorado: { label: "Monitorado", fill: "#ede9fe", stroke: "#6d28d9", pattern: "dashed" },
  suspenso: { label: "Suspenso", fill: "#e2e8f0", stroke: "#475569", pattern: "dashed" },
  removido: { label: "Removido", fill: "#cbd5e1", stroke: "#64748b", pattern: "dashed" },
};

const WHOLE_TOOTH_TYPES = new Set<ClinicalConditionType>(["coroa_total", "implante", "ponte_fixa", "protese_removivel", "elemento_pontico", "exodontia_indicada", "exodontia_executada"]);
let conditionSequence = 0;

export function getAllowedTargets(type: ClinicalConditionType): readonly ConditionTarget["kind"][] {
  return WHOLE_TOOTH_TYPES.has(type) ? ["tooth"] : ["surface", "tooth"];
}

export function createCondition(input: Omit<ClinicalCondition, "id"> & { id?: string }): ClinicalCondition {
  const targets = input.targets.map((target) => ({ ...target }));
  if (WHOLE_TOOTH_TYPES.has(input.type) && (targets.length !== 1 || targets[0].kind !== "tooth")) {
    throw new Error(`${input.type} exige o alvo dente inteiro`);
  }
  if (!targets.length) throw new Error("A ocorrência exige ao menos um alvo");
  return { ...input, id: input.id ?? `condition-${++conditionSequence}`, targets };
}

function isV2(value: OdontogramData): value is OdontogramV2 {
  return "version" in value && value.version === 2 && "teeth" in value;
}

function isV3(value: OdontogramData): value is OdontogramV3 {
  return "version" in value && value.version === 3 && "teeth" in value;
}

function legacyCondition(type: ClinicalConditionType, target: ConditionTarget): ClinicalCondition {
  return createCondition({ category: "legado", type, targets: [target], stage: "concluido" });
}

export function normalizeOdontogram(data: OdontogramData | null | undefined): OdontogramV2 | OdontogramV3 {
  if (data && isV3(data)) return data;
  if (data && isV2(data)) return data;
  const teeth: Record<string, ToothRecord> = {};
  for (const [toothNumber, tooth] of Object.entries(data ?? {})) {
    const conditions: ClinicalCondition[] = [];
    if (tooth.status === "Implante") conditions.push(legacyCondition("implante", { kind: "tooth" }));
    if (tooth.status === "Ausente") conditions.push(legacyCondition("legado_ausente", { kind: "tooth" }));
    if (tooth.status === "Ponte") conditions.push(legacyCondition("legado_ponte", { kind: "tooth" }));
    for (const face of FACE_KEYS) {
      const status = tooth.faces?.[face]?.status;
      if (status === "Tratar") conditions.push(legacyCondition("legado_tratar", { kind: "surface", face, region: "entire" }));
      if (status === "Tratado") conditions.push(legacyCondition("legado_tratado", { kind: "surface", face, region: "entire" }));
    }
    if (conditions.length || tooth.notes) teeth[toothNumber] = { notes: tooth.notes ?? "", conditions };
  }
  return { version: 2, dentition: "permanent", teeth };
}

export function upsertCondition(data: LayeredOdontogram, toothNumber: number, condition: ClinicalCondition): LayeredOdontogram {
  const current = data.teeth[String(toothNumber)] ?? { notes: "", conditions: [] };
  const conditions = current.conditions.some((item) => item.id === condition.id)
    ? current.conditions.map((item) => item.id === condition.id ? condition : item)
    : [...current.conditions, condition];
  return { ...data, teeth: { ...data.teeth, [toothNumber]: { ...current, conditions } } };
}

export function removeCondition(data: LayeredOdontogram, toothNumber: number, conditionId: string): LayeredOdontogram {
  const current = data.teeth[String(toothNumber)];
  if (!current) return data;
  return { ...data, teeth: { ...data.teeth, [toothNumber]: { ...current, conditions: current.conditions.filter((item) => item.id !== conditionId) } } };
}

export function getConditionDisplayName(type: ClinicalConditionType): string {
  return type.replace(/^legado_/, "").replaceAll("_", " ");
}

export function getClinicalStageLabel(stage: ClinicalStage): string {
  return CLINICAL_STAGE_LABELS[stage];
}

export function getConditionVisual(condition: Pick<ClinicalCondition, "stage">): ConditionVisual {
  return CLINICAL_STAGE_VISUALS[condition.stage];
}

export function getClinicalStageVisuals(): ReadonlyArray<ConditionVisual> {
  return [
    CLINICAL_STAGE_VISUALS.aAvaliar, CLINICAL_STAGE_VISUALS.planejado,
    CLINICAL_STAGE_VISUALS.emAndamento, CLINICAL_STAGE_VISUALS.concluido,
    CLINICAL_STAGE_VISUALS.monitorado, CLINICAL_STAGE_VISUALS.suspenso,
  ];
}

export function getConditionTargetLabel(toothNumber: number, target: ConditionTarget): string {
  if (target.kind === "tooth") return "Dente inteiro";
  const region = target.region === "incisalOcclusal" ? "incisal/oclusal"
    : target.region === "middle" ? "média"
      : target.region === "cervical" ? "cervical" : "face inteira";
  return `${getFaceLabels(toothNumber)[target.face]} - ${region}`;
}
