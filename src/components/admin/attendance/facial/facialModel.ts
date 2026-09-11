import type { FaceRegionData } from "../FaceMap";

export type FacialSide = "left" | "right" | "center";

export type FacialProcedureType =
  | "botulinum-toxin"
  | "filler"
  | "biostimulator"
  | "thread"
  | "other";

export type FacialRegion = {
  id: string;
  name: string;
  side: FacialSide;
  svgId: string;
  group: string;
  paths: string[];
  hitPaths?: string[];
};

export type FacialApplication = {
  id: string;
  regionId: string;
  procedureType: FacialProcedureType;
  coordinates?: { x: number; y: number };
  productId?: string;
  productName?: string;
  amount?: number;
  unit?: "U" | "ml";
  technique?: string;
  plane?: string;
  device?: string;
  notes?: string;
};

export type FacialLegacyRegionData = FaceRegionData;

export type FacialNotesDocument = {
  version: 2;
  applications: FacialApplication[];
  legacyRegions?: Record<string, FacialLegacyRegionData>;
};

export const FACIAL_VIEWBOX = { x: 0, y: 0, width: 320, height: 420 } as const;

export const FACIAL_REGIONS: FacialRegion[] = [
  {
    id: "frontal",
    name: "Frontal (testa)",
    side: "center",
    svgId: "frontal",
    group: "testa",
    paths: ["M102 78 C116 50 139 42 160 42 C181 42 204 50 218 78 C211 105 197 121 160 122 C123 121 109 105 102 78 Z"],
  },
  {
    id: "glabella",
    name: "Glabela",
    side: "center",
    svgId: "glabella",
    group: "testa",
    paths: ["M146 118 C150 110 170 110 174 118 C176 130 171 143 160 148 C149 143 144 130 146 118 Z"],
    hitPaths: ["M139 108 C148 100 172 100 181 108 L181 151 C172 160 148 160 139 151 Z"],
  },
  {
    id: "periorbital-left",
    name: "Periorbital",
    side: "left",
    svgId: "periorbital-left",
    group: "olhos",
    paths: ["M88 135 C101 119 130 116 148 130 C148 151 133 166 111 164 C94 162 84 151 88 135 Z"],
  },
  {
    id: "periorbital-right",
    name: "Periorbital",
    side: "right",
    svgId: "periorbital-right",
    group: "olhos",
    paths: ["M172 130 C190 116 219 119 232 135 C236 151 226 162 209 164 C187 166 172 151 172 130 Z"],
  },
  {
    id: "malar-left",
    name: "Malar / zigomático",
    side: "left",
    svgId: "malar-left",
    group: "terço médio",
    paths: ["M84 171 C102 157 135 160 151 178 C148 205 128 224 101 219 C83 208 76 189 84 171 Z"],
  },
  {
    id: "malar-right",
    name: "Malar / zigomático",
    side: "right",
    svgId: "malar-right",
    group: "terço médio",
    paths: ["M169 178 C185 160 218 157 236 171 C244 189 237 208 219 219 C192 224 172 205 169 178 Z"],
  },
  {
    id: "nasolabial-left",
    name: "Sulco nasolabial",
    side: "left",
    svgId: "nasolabial-left",
    group: "terço inferior",
    paths: ["M134 195 C143 205 145 220 143 242 C139 256 132 263 124 269 C129 248 130 219 124 202 Z"],
    hitPaths: ["M121 190 C145 202 151 238 132 274 L114 269 C128 244 126 215 115 200 Z"],
  },
  {
    id: "nasolabial-right",
    name: "Sulco nasolabial",
    side: "right",
    svgId: "nasolabial-right",
    group: "terço inferior",
    paths: ["M186 195 C177 205 175 220 177 242 C181 256 188 263 196 269 C191 248 190 219 196 202 Z"],
    hitPaths: ["M199 190 C175 202 169 238 188 274 L206 269 C192 244 194 215 205 200 Z"],
  },
  {
    id: "lips",
    name: "Lábios",
    side: "center",
    svgId: "lips",
    group: "terço inferior",
    paths: ["M126 265 C139 257 150 260 160 264 C170 260 181 257 194 265 C184 282 174 289 160 289 C146 289 136 282 126 265 Z"],
    hitPaths: ["M116 253 C136 244 184 244 204 253 L201 292 C184 304 136 304 119 292 Z"],
  },
  {
    id: "chin",
    name: "Mento (queixo)",
    side: "center",
    svgId: "chin",
    group: "terço inferior",
    paths: ["M126 300 C139 292 181 292 194 300 C192 326 178 342 160 345 C142 342 128 326 126 300 Z"],
  },
  {
    id: "jawline-left",
    name: "Contorno de mandíbula",
    side: "left",
    svgId: "jawline-left",
    group: "terço inferior",
    paths: ["M77 238 C84 271 99 307 126 330 C136 339 146 345 160 349 L151 362 C128 357 106 344 91 323 C73 298 62 268 60 242 Z"],
  },
  {
    id: "jawline-right",
    name: "Contorno de mandíbula",
    side: "right",
    svgId: "jawline-right",
    group: "terço inferior",
    paths: ["M243 238 C236 271 221 307 194 330 C184 339 174 345 160 349 L169 362 C192 357 214 344 229 323 C247 298 258 268 260 242 Z"],
  },
  {
    id: "neck",
    name: "Pescoço",
    side: "center",
    svgId: "neck",
    group: "pescoço",
    paths: ["M116 338 C124 355 126 370 119 389 L96 416 L224 416 L201 389 C194 370 196 355 204 338 C189 354 177 363 160 365 C143 363 131 354 116 338 Z"],
  },
];

export const PROCEDURE_OPTIONS: Array<{ value: FacialProcedureType; label: string }> = [
  { value: "botulinum-toxin", label: "Toxina" },
  { value: "filler", label: "Preenchimento" },
  { value: "biostimulator", label: "Bioestimulador" },
  { value: "thread", label: "Fios" },
  { value: "other", label: "Outro" },
];

const PROCEDURE_LABELS: Record<FacialProcedureType, string> = Object.fromEntries(
  PROCEDURE_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<FacialProcedureType, string>;

const LEGACY_REGION_BY_ID: Record<string, string> = {
  frontal: "frontal",
  glabella: "glabela",
  "periorbital-left": "periorbital",
  "periorbital-right": "periorbital",
  "malar-left": "malar",
  "malar-right": "malar",
  "nasolabial-left": "nasolabial",
  "nasolabial-right": "nasolabial",
  lips: "labios",
  chin: "mento",
  "jawline-left": "mandibula",
  "jawline-right": "mandibula",
  neck: "pescoço",
};

const PROCEDURE_VALUES = new Set<FacialProcedureType>(PROCEDURE_OPTIONS.map(({ value }) => value));

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const asText = (value: unknown): string => value === null || value === undefined ? "" : String(value);

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const clamp01 = (value: unknown): number | undefined => {
  const number = asNumber(value);
  return number === undefined ? undefined : Math.min(1, Math.max(0, number));
};

const normalizeLegacyRegion = (value: unknown): FaceRegionData | null => {
  const record = asRecord(value);
  if (!record) return null;
  return { dose: asText(record.dose), product: asText(record.product), notes: asText(record.notes) };
};

const normalizeApplication = (value: unknown, index: number): FacialApplication | null => {
  const record = asRecord(value);
  if (!record || typeof record.regionId !== "string" || !record.regionId) return null;
  const procedureType = PROCEDURE_VALUES.has(record.procedureType as FacialProcedureType)
    ? record.procedureType as FacialProcedureType
    : "other";
  const coordinatesRecord = asRecord(record.coordinates);
  const x = clamp01(coordinatesRecord?.x);
  const y = clamp01(coordinatesRecord?.y);
  const application: FacialApplication = {
    id: asText(record.id) || `facial-application-${index + 1}`,
    regionId: record.regionId,
    procedureType,
  };
  if (x !== undefined && y !== undefined) application.coordinates = { x, y };
  if (asText(record.productId)) application.productId = asText(record.productId);
  if (asText(record.productName)) application.productName = asText(record.productName);
  const amount = asNumber(record.amount);
  if (amount !== undefined) application.amount = amount;
  if (record.unit === "U" || record.unit === "ml") application.unit = record.unit;
  for (const key of ["technique", "plane", "device", "notes"] as const) {
    const text = asText(record[key]);
    if (text) application[key] = text;
  }
  return application;
};

export function normalizeFacialNotes(value: unknown): FacialNotesDocument {
  const record = asRecord(value);
  if (!record) return { version: 2, applications: [] };
  const legacyRegions: Record<string, FacialLegacyRegionData> = {};
  const legacyCandidate = asRecord(record.legacyRegions);
  if (legacyCandidate) {
    Object.entries(legacyCandidate).forEach(([key, region]) => {
      const normalized = normalizeLegacyRegion(region);
      if (normalized) legacyRegions[key] = normalized;
    });
  }
  Object.entries(record).forEach(([key, region]) => {
    if (key === "version" || key === "applications" || key === "legacyRegions") return;
    const normalized = normalizeLegacyRegion(region);
    if (normalized) legacyRegions[key] = normalized;
  });
  const applications = Array.isArray(record.applications)
    ? record.applications.map(normalizeApplication).filter((application): application is FacialApplication => Boolean(application))
    : [];
  return {
    version: 2,
    applications,
    ...(Object.keys(legacyRegions).length ? { legacyRegions } : {}),
  };
}

const formatAmount = (amount: number): string => amount.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

export function toLegacyFaceMapData(value: unknown): Record<string, FaceRegionData> {
  const document = normalizeFacialNotes(value);
  const legacy: Record<string, FaceRegionData> = { ...(document.legacyRegions ?? {}) };
  document.applications.forEach((application) => {
    const key = LEGACY_REGION_BY_ID[application.regionId] ?? application.regionId;
    const previous = legacy[key] ?? { dose: "", product: "", notes: "" };
    const amount = application.amount === undefined ? "" : `${formatAmount(application.amount)}${application.unit ? ` ${application.unit}` : ""}`;
    const product = application.productName ?? previous.product;
    const dose = amount || previous.dose;
    const notes = [previous.notes, application.notes].filter(Boolean).join(" | ");
    legacy[key] = { product, dose, notes };
  });
  return legacy;
}

export function summarizeFacialNotes(value: unknown) {
  const document = normalizeFacialNotes(value);
  const treated = new Set(document.applications.map((application) => application.regionId));
  Object.entries(document.legacyRegions ?? {}).forEach(([key, region]) => {
    if ([region.product, region.dose, region.notes].some((item) => item.trim())) treated.add(`legacy:${key}`);
  });
  let totalUnits = 0;
  let totalMl = 0;
  document.applications.forEach((application) => {
    if (application.unit === "U" && application.amount) totalUnits += application.amount;
    if (application.unit === "ml" && application.amount) totalMl += application.amount;
  });
  return {
    treatedRegions: treated.size,
    applications: document.applications.length,
    totalUnits,
    totalMl,
  };
}

export const procedureLabel = (value: FacialProcedureType): string => PROCEDURE_LABELS[value];

export const legacyRegionKeyForId = (regionId: string): string | undefined => LEGACY_REGION_BY_ID[regionId];

export const regionLabel = (region: FacialRegion): string =>
  `${region.name} — ${region.side === "center" ? "Centro" : region.side === "left" ? "Esquerdo" : "Direito"}`;
