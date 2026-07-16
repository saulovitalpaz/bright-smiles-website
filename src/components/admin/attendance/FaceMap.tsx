import React from "react";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface FaceRegionData {
  dose: string;
  product: string;
  notes: string;
}

interface FaceMapProps {
  data: Record<string, FaceRegionData>;
  onChange: (data: Record<string, FaceRegionData>) => void;
  readOnly?: boolean;
  compact?: boolean;
}

interface FaceRegionDefinition {
  id: string;
  name: string;
  paths: Array<{ d: string; side?: "left" | "right" }>;
  hitPaths?: string[];
}

const EMPTY_REGION: FaceRegionData = { dose: "", product: "", notes: "" };

const REGIONS: FaceRegionDefinition[] = [
  {
    id: "frontal",
    name: "Frontal (Testa)",
    paths: [
      {
        d: "M102 78 C116 50 139 42 160 42 C181 42 204 50 218 78 C211 105 197 121 160 122 C123 121 109 105 102 78 Z",
      },
    ],
  },
  {
    id: "glabela",
    name: "Glabela",
    paths: [
      {
        d: "M146 118 C150 110 170 110 174 118 C176 130 171 143 160 148 C149 143 144 130 146 118 Z",
      },
    ],
    hitPaths: ["M139 108 C148 100 172 100 181 108 L181 151 C172 160 148 160 139 151 Z"],
  },
  {
    id: "periorbital",
    name: "Periorbital",
    paths: [
      {
        side: "left",
        d: "M88 135 C101 119 130 116 148 130 C148 151 133 166 111 164 C94 162 84 151 88 135 Z",
      },
      {
        side: "right",
        d: "M172 130 C190 116 219 119 232 135 C236 151 226 162 209 164 C187 166 172 151 172 130 Z",
      },
    ],
  },
  {
    id: "malar",
    name: "Malar / Zigomático",
    paths: [
      {
        side: "left",
        d: "M84 171 C102 157 135 160 151 178 C148 205 128 224 101 219 C83 208 76 189 84 171 Z",
      },
      {
        side: "right",
        d: "M169 178 C185 160 218 157 236 171 C244 189 237 208 219 219 C192 224 172 205 169 178 Z",
      },
    ],
  },
  {
    id: "nasolabial",
    name: "Sulco Nasolabial",
    paths: [
      {
        side: "left",
        d: "M134 195 C143 205 145 220 143 242 C139 256 132 263 124 269 C129 248 130 219 124 202 Z",
      },
      {
        side: "right",
        d: "M186 195 C177 205 175 220 177 242 C181 256 188 263 196 269 C191 248 190 219 196 202 Z",
      },
    ],
    hitPaths: [
      "M121 190 C145 202 151 238 132 274 L114 269 C128 244 126 215 115 200 Z",
      "M199 190 C175 202 169 238 188 274 L206 269 C192 244 194 215 205 200 Z",
    ],
  },
  {
    id: "labios",
    name: "Lábios",
    paths: [
      {
        d: "M126 265 C139 257 150 260 160 264 C170 260 181 257 194 265 C184 282 174 289 160 289 C146 289 136 282 126 265 Z",
      },
    ],
    hitPaths: ["M116 253 C136 244 184 244 204 253 L201 292 C184 304 136 304 119 292 Z"],
  },
  {
    id: "mento",
    name: "Mento (Queixo)",
    paths: [
      {
        d: "M126 300 C139 292 181 292 194 300 C192 326 178 342 160 345 C142 342 128 326 126 300 Z",
      },
    ],
  },
  {
    id: "mandibula",
    name: "Contorno de Mandíbula",
    paths: [
      {
        side: "left",
        d: "M77 238 C84 271 99 307 126 330 C136 339 146 345 160 349 L151 362 C128 357 106 344 91 323 C73 298 62 268 60 242 Z",
      },
      {
        side: "right",
        d: "M243 238 C236 271 221 307 194 330 C184 339 174 345 160 349 L169 362 C192 357 214 344 229 323 C247 298 258 268 260 242 Z",
      },
    ],
  },
  {
    id: "pescoço",
    name: "Pescoço",
    paths: [
      {
        d: "M116 338 C124 355 126 370 119 389 L96 416 L224 416 L201 389 C194 370 196 355 204 338 C189 354 177 363 160 365 C143 363 131 354 116 338 Z",
      },
    ],
  },
];

function hasRegionData(region: FaceRegionData | undefined): boolean {
  return Boolean(
    region &&
      [region.product, region.dose, region.notes].some((value) =>
        value === null || value === undefined ? false : String(value).trim().length > 0,
      ),
  );
}

function getRegionPathClass(isFilled: boolean, isActive: boolean): string {
  if (isActive) {
    return "fill-primary/35 stroke-primary stroke-[2]";
  }
  if (isFilled) {
    return "fill-teal-300/40 stroke-teal-700 stroke-[1.5]";
  }
  return "fill-sky-50/45 stroke-slate-300 stroke-[1]";
}

interface FaceSvgProps {
  activeRegion: string | null;
  compact: boolean;
  data: Record<string, FaceRegionData>;
  onRegionSelect: (id: string) => void;
  readOnly: boolean;
}

function FaceSvg({
  activeRegion,
  compact,
  data,
  onRegionSelect,
  readOnly,
}: FaceSvgProps) {
  const svgId = React.useId().replace(/:/g, "");

  const handleKeyDown = (
    event: React.KeyboardEvent<SVGGElement>,
    regionId: string,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onRegionSelect(regionId);
  };

  return (
    <div className={`mx-auto w-full ${compact ? "max-w-[250px]" : "max-w-[360px]"}`}>
      <svg
        viewBox="0 0 320 420"
        className="h-auto w-full max-w-full"
        aria-labelledby={`${svgId}-title ${svgId}-description`}
      >
        <title id={`${svgId}-title`}>Mapa facial anatômico frontal</title>
        <desc id={`${svgId}-description`}>
          Nove regiões clínicas sobre uma face humana frontal.
        </desc>
        <defs>
          <linearGradient id={`${svgId}-skin`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fffaf2" />
            <stop offset="0.52" stopColor="#f5e9dc" />
            <stop offset="1" stopColor="#ead7c8" />
          </linearGradient>
          <linearGradient id={`${svgId}-neck`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ead8ca" />
            <stop offset="1" stopColor="#f8eee4" />
          </linearGradient>
          <radialGradient id={`${svgId}-cheek`}>
            <stop offset="0" stopColor="#d7a89b" stopOpacity="0.2" />
            <stop offset="1" stopColor="#d7a89b" stopOpacity="0" />
          </radialGradient>
          <filter id={`${svgId}-soft-shadow`} x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="7" stdDeviation="9" floodColor="#7c6658" floodOpacity="0.13" />
          </filter>
        </defs>

        <g aria-hidden="true" pointerEvents="none">
          <path
            d="M116 319 C126 342 125 368 112 390 L86 420 H234 L208 390 C195 368 194 342 204 319 Z"
            fill={`url(#${svgId}-neck)`}
            stroke="#d9c5b6"
            strokeWidth="1.4"
          />
          <path
            d="M73 144 C50 140 43 164 50 195 C55 217 65 231 78 226 C85 209 84 164 73 144 Z"
            fill={`url(#${svgId}-skin)`}
            stroke="#d9c5b6"
            strokeWidth="1.4"
          />
          <path
            d="M247 144 C270 140 277 164 270 195 C265 217 255 231 242 226 C235 209 236 164 247 144 Z"
            fill={`url(#${svgId}-skin)`}
            stroke="#d9c5b6"
            strokeWidth="1.4"
          />
          <path
            d="M160 30 C105 30 75 72 70 137 C66 190 77 258 104 306 C120 334 143 352 160 354 C177 352 200 334 216 306 C243 258 254 190 250 137 C245 72 215 30 160 30 Z"
            fill={`url(#${svgId}-skin)`}
            stroke="#d6c0b1"
            strokeWidth="1.8"
            filter={`url(#${svgId}-soft-shadow)`}
          />
          <ellipse cx="111" cy="205" rx="43" ry="38" fill={`url(#${svgId}-cheek)`} />
          <ellipse cx="209" cy="205" rx="43" ry="38" fill={`url(#${svgId}-cheek)`} />
          <path d="M92 126 C108 116 128 117 142 126" fill="none" stroke="#806f65" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M178 126 C192 117 212 116 228 126" fill="none" stroke="#806f65" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M91 143 C106 132 132 133 146 145 C132 155 106 156 91 143 Z" fill="#fffdf9" stroke="#9b887c" strokeWidth="1.2" />
          <path d="M174 145 C188 133 214 132 229 143 C214 156 188 155 174 145 Z" fill="#fffdf9" stroke="#9b887c" strokeWidth="1.2" />
          <ellipse cx="119" cy="144" rx="5" ry="6" fill="#77685f" />
          <ellipse cx="201" cy="144" rx="5" ry="6" fill="#77685f" />
          <circle cx="117.5" cy="142" r="1.5" fill="#fffdf9" />
          <circle cx="199.5" cy="142" r="1.5" fill="#fffdf9" />
          <path d="M155 151 C151 181 146 208 151 223 C155 228 165 228 169 223" fill="none" stroke="#b49a8c" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M145 226 C151 231 169 231 175 226" fill="none" stroke="#a98f82" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M157 237 L157 251 M163 237 L163 251" fill="none" stroke="#bda497" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M127 266 C141 260 150 262 160 266 C170 262 179 260 193 266 C181 273 173 275 160 275 C147 275 139 273 127 266 Z" fill="#c98f8f" stroke="#a87575" strokeWidth="1" />
          <path d="M132 269 C145 278 175 278 188 269 C181 283 173 288 160 288 C147 288 139 283 132 269 Z" fill="#b9787b" opacity="0.84" />
          <path d="M137 309 C150 316 170 316 183 309" fill="none" stroke="#c8aea0" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M58 179 C62 163 68 157 74 159 M262 179 C258 163 252 157 246 159" fill="none" stroke="#c5aa9c" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {REGIONS.map((region) => {
          const isFilled = hasRegionData(data[region.id]);
          const isActive = activeRegion === region.id;
          const interactiveProps: React.SVGProps<SVGGElement> = readOnly
            ? {}
            : {
                role: "button",
                tabIndex: 0,
                "aria-label": region.name,
                "aria-pressed": isActive,
                onClick: () => onRegionSelect(region.id),
                onKeyDown: (event) => handleKeyDown(event, region.id),
              };

          return (
            <g
              key={region.id}
              data-face-region={region.id}
              data-filled={isFilled}
              className={
                readOnly
                  ? "outline-none"
                  : "group cursor-pointer touch-manipulation outline-none"
              }
              {...interactiveProps}
            >
              {region.hitPaths?.map((path) => (
                <path
                  key={path}
                  d={path}
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth="8"
                />
              ))}
              {region.paths.map((path) => (
                <path
                  key={path.d}
                  d={path.d}
                  data-side={path.side}
                  className={`transition-colors duration-150 ${getRegionPathClass(isFilled, isActive)} ${
                    readOnly
                      ? ""
                      : "group-hover:fill-primary/20 group-hover:stroke-primary group-focus:fill-primary/25 group-focus:stroke-primary group-focus:stroke-[2.5]"
                  }`}
                  strokeLinejoin="round"
                />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface RegionSummaryProps {
  data: Record<string, FaceRegionData>;
  compact: boolean;
}

function RegionSummary({ data, compact }: RegionSummaryProps) {
  const filledRegions = REGIONS.filter((region) => hasRegionData(data[region.id]));
  const summaryId = `face-map-summary-${React.useId().replace(/:/g, "")}`;

  return (
    <section className={compact ? "space-y-2" : "space-y-3"} aria-labelledby={summaryId}>
      <h3 id={summaryId} className="text-sm font-bold text-slate-900">
        Resumo Clínico
      </h3>
      {filledRegions.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma aplicação facial registrada.</p>
      ) : (
        <div className={`grid min-w-0 grid-cols-1 ${compact ? "gap-2" : "gap-3 sm:grid-cols-2"}`}>
          {filledRegions.map((region) => {
            const regionData = data[region.id];
            return (
              <article
                key={region.id}
                className={`min-w-0 rounded-xl border border-slate-200 bg-white ${compact ? "p-3" : "p-4"}`}
              >
                <h4 className="text-sm font-semibold text-slate-900">{region.name}</h4>
                <dl className="mt-2 space-y-1 text-xs text-slate-600">
                  {regionData.product ? (
                    <div className="flex min-w-0 gap-1">
                      <dt className="font-medium text-slate-500">Produto:</dt>
                      <dd className="min-w-0 break-words">{regionData.product}</dd>
                    </div>
                  ) : null}
                  {regionData.dose ? (
                    <div className="flex min-w-0 gap-1">
                      <dt className="font-medium text-slate-500">Dose:</dt>
                      <dd className="min-w-0 break-words">{regionData.dose}</dd>
                    </div>
                  ) : null}
                  {regionData.notes ? (
                    <div className="border-t border-slate-100 pt-2">
                      <dt className="sr-only">Observações</dt>
                      <dd className="break-words text-slate-600">{regionData.notes}</dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

const FaceMap: React.FC<FaceMapProps> = ({
  data = {},
  onChange,
  readOnly = false,
  compact = false,
}) => {
  const [selectedRegionId, setSelectedRegionId] = React.useState<string | null>(null);
  const formId = React.useId().replace(/:/g, "");

  React.useEffect(() => {
    if (readOnly) setSelectedRegionId(null);
  }, [readOnly]);

  const selectRegion = (regionId: string) => {
    if (readOnly) return;
    setSelectedRegionId(regionId);
  };

  const updateRegion = (
    regionId: string,
    field: keyof FaceRegionData,
    value: string,
  ) => {
    if (readOnly) return;
    const currentRegion = data[regionId] || EMPTY_REGION;
    onChange({
      ...data,
      [regionId]: { ...currentRegion, [field]: value },
    });
  };

  const selectedRegion = REGIONS.find((region) => region.id === selectedRegionId);
  const selectedData = selectedRegionId
    ? data[selectedRegionId] || EMPTY_REGION
    : null;

  return (
    <Card
      data-face-map
      data-compact={compact}
      className="min-w-0 max-w-full overflow-hidden border-slate-200 shadow-sm"
    >
      <CardHeader
        className={`border-b border-slate-100 bg-slate-50 ${compact ? "p-3" : "pb-4"}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ${
              compact ? "h-8 w-8" : "h-10 w-10"
            }`}
          >
            <User size={compact ? 16 : 20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <CardTitle className={compact ? "text-base" : "text-lg font-serif"}>
              Mapeamento Facial Interativo
            </CardTitle>
            {!compact ? (
              <CardDescription>
                Selecione uma região para registrar aplicações e doses.
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className={`min-w-0 max-w-full ${compact ? "p-3" : "p-4 sm:p-6"}`}>
        <div
          className={`grid min-w-0 max-w-full items-start ${
            compact ? "gap-4" : "gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-8"
          }`}
        >
          <div
            className={`min-w-0 max-w-full rounded-2xl border border-slate-100 bg-slate-50/70 ${
              compact ? "p-2" : "p-3 sm:p-5"
            }`}
          >
            <FaceSvg
              activeRegion={selectedRegionId}
              compact={compact}
              data={data}
              onRegionSelect={selectRegion}
              readOnly={readOnly}
            />
          </div>

          {readOnly ? (
            <RegionSummary data={data} compact={compact} />
          ) : (
            <div
              data-face-region-controls
              className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1"
            >
              {REGIONS.map((region) => {
                const isActive = selectedRegionId === region.id;
                const isFilled = hasRegionData(data[region.id]);
                return (
                  <button
                    key={region.id}
                    type="button"
                    data-face-region-control={region.id}
                    data-filled={isFilled}
                    aria-pressed={isActive}
                    onClick={() => selectRegion(region.id)}
                    className={`flex min-h-11 min-w-0 touch-manipulation items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isFilled
                          ? "border-teal-600/35 bg-teal-50 text-teal-900 hover:bg-teal-100"
                          : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <span className="min-w-0 leading-snug">{region.name}</span>
                    {isFilled ? (
                      <Badge
                        variant="secondary"
                        className="h-auto shrink-0 bg-white/75 px-1.5 py-0.5 text-[10px] text-current"
                      >
                        Preenchido
                      </Badge>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>

      {!readOnly ? (
        <Dialog
          open={selectedRegionId !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedRegionId(null);
          }}
        >
          <DialogContent
            className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[520px] overflow-y-auto overscroll-y-contain"
          >
            <DialogHeader>
              <DialogTitle>{selectedRegion?.name}</DialogTitle>
              <DialogDescription>
                Registre o produto, a dose e as observações clínicas da região.
              </DialogDescription>
            </DialogHeader>
            {selectedRegionId && selectedData ? (
              <div className="space-y-4 py-2">
                <div
                  data-testid="face-map-fields"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor={`${formId}-product`}>Produto</Label>
                    <Input
                      id={`${formId}-product`}
                      placeholder="Ex.: toxina botulínica"
                      value={selectedData.product}
                      onChange={(event) =>
                        updateRegion(selectedRegionId, "product", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${formId}-dose`}>Dose / Volume</Label>
                    <Input
                      id={`${formId}-dose`}
                      placeholder="Ex.: 8U ou 1 ml"
                      value={selectedData.dose}
                      onChange={(event) =>
                        updateRegion(selectedRegionId, "dose", event.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${formId}-notes`}>Resumo Clínico da Aplicação</Label>
                  <Textarea
                    id={`${formId}-notes`}
                    placeholder="Técnica, profundidade e observações clínicas"
                    className="min-h-[112px]"
                    value={selectedData.notes}
                    onChange={(event) =>
                      updateRegion(selectedRegionId, "notes", event.target.value)
                    }
                  />
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  );
};

export default FaceMap;
