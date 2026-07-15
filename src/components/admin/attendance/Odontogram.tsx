import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface ToothFaceData { status: string; }
export interface ToothData { status: string; notes: string; faces?: Record<string, ToothFaceData>; }
interface OdontogramProps { data: Record<string, ToothData>; onChange: (data: Record<string, ToothData>) => void; readOnly?: boolean; }

const STATUSES = ['Saudável', 'Tratar', 'Tratado', 'Ausente', 'Implante', 'Ponte'];
const STATUS_COLORS: Record<string, { badge: string; fill: string; hex: string }> = {
  'Saudável': { badge: 'bg-white/10 text-slate-200 border-white/20', fill: 'url(#grad-enamel)', hex: '#f0f0e8' },
  'Tratar':   { badge: 'bg-red-500/20 text-red-300 border-red-500/30', fill: '#e05050', hex: '#e05050' },
  'Tratado':  { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', fill: '#4fa8d3', hex: '#4fa8d3' },
  'Ausente':  { badge: 'bg-slate-800/50 text-slate-500 border-slate-700', fill: 'transparent', hex: 'transparent' },
  'Implante': { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', fill: '#a87ffb', hex: '#a87ffb' },
  'Ponte':    { badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', fill: '#f59e0b', hex: '#f59e0b' },
};

const TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const getFaceLabels = (n: number) => {
  const isUpper = n >= 11 && n <= 28;
  const isRight = (n >= 11 && n <= 18) || (n >= 41 && n <= 48);
  return {
    top:    isUpper ? 'Vestibular' : 'Lingual',
    bottom: isUpper ? 'Palatina'   : 'Vestibular',
    left:   isRight ? 'Distal'     : 'Mesial',
    right:  isRight ? 'Mesial'     : 'Distal',
    center: 'Oclusal / Incisal',
  };
};

// ─── Tooth type per FDI number ───────────────────────────────────────────────
const getType = (n: number): 'MOLAR' | 'PREMOLAR' | 'CANINE' | 'INCISOR' => {
  const d = n % 10;
  if (d >= 6) return 'MOLAR';
  if (d >= 4) return 'PREMOLAR';
  if (d === 3) return 'CANINE';
  return 'INCISOR';
};

// ─── SVG DEFS shared ───────────────────────────────────────────────────────
const SvgDefs = () => (
  <defs>
    {/* Enamel gradient: ivory white with subtle highlight */}
    <radialGradient id="grad-enamel" cx="38%" cy="28%" r="65%">
      <stop offset="0%"   stopColor="#ffffff" stopOpacity="1" />
      <stop offset="45%"  stopColor="#f4f1e8" stopOpacity="1" />
      <stop offset="100%" stopColor="#c8c4b0" stopOpacity="1" />
    </radialGradient>
    {/* Root / dentin gradient: warm cream-yellow */}
    <radialGradient id="grad-root" cx="40%" cy="30%" r="70%">
      <stop offset="0%"   stopColor="#e8ddc8" stopOpacity="1" />
      <stop offset="60%"  stopColor="#c8b890" stopOpacity="1" />
      <stop offset="100%" stopColor="#a09070" stopOpacity="1" />
    </radialGradient>
    {/* Implant screw gradient */}
    <linearGradient id="grad-implant" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stopColor="#94a3b8" />
      <stop offset="50%"  stopColor="#e2e8f0" />
      <stop offset="100%" stopColor="#64748b" />
    </linearGradient>
    {/* Subtle inner shadow filter */}
    <filter id="tooth-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#00000040" />
    </filter>
    <filter id="glow-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000060" />
    </filter>
  </defs>
);

// ─── FRONTAL PATHS ─────────────────────────────────────────────────────────
// ViewBox: 0 0 60 130. Gumline at y≈68.
// CONVENTION: crown occupies y 68–128, roots y 5–68
// For UPPER teeth → rendered normally (anatomically: roots in skull = visual top)
// For LOWER teeth → SVG flipped vertically
const FRONTAL: Record<string, { crown: string; roots: string[]; neck?: string }> = {
  // ── MOLAR ───────────────────────────────────────────────────────────────
  MOLAR: {
    crown: 'M 12,68 L 12,88 L 18,95 L 28,91 L 32,91 L 42,95 L 48,88 L 48,68 Z',
    roots: ['M 15,68 L 15,48 L 19,31 L 24,48 L 28,48 L 30,28 L 32,48 L 36,48 L 41,31 L 45,48 L 45,68 Z'],
  },
  // ── PREMOLAR ───────────────────────────────────────────────────────────
  PREMOLAR: {
    crown: 'M 18,68 L 18,88 L 25,95 L 35,95 L 42,88 L 42,68 Z',
    roots: ['M 22,68 L 25,33 L 30,53 L 35,33 L 38,68 Z'],
  },
  // ── CANINE ──────────────────────────────────────────────────────────────
  CANINE: {
    crown: 'M 18,68 L 18,83 L 30,98 L 42,83 L 42,68 Z',
    roots: ['M 22,68 L 30,28 L 38,68 Z'],
  },
  // ── INCISOR ─────────────────────────────────────────────────────────────
  INCISOR: {
    crown: 'M 20,68 L 20,93 L 40,93 L 40,68 Z',
    roots: ['M 22,68 L 30,33 L 38,68 Z'],
  },
  // ── LOWER MOLAR variant (2 roots: mesial + distal) ───────────────────
  MOLAR_LOWER: {
    crown: 'M 12,68 L 12,88 L 18,95 L 28,91 L 32,91 L 42,95 L 48,88 L 48,68 Z',
    roots: ['M 15,68 L 15,48 L 20,31 L 26,48 L 34,48 L 40,31 L 45,48 L 45,68 Z'],
  },
};

// Implant screw path — rendered when status === Implante
const IMPLANT_PATH = 'M 20,68 L 20,20 C 20,15 40,15 40,20 L 40,68 Z M 18,55 L 42,55 M 18,48 L 42,48 M 18,41 L 42,41 M 18,34 L 42,34 M 18,27 L 42,27';

// ─── OCCLUSAL PATHS ────────────────────────────────────────────────────────
// ViewBox: 0 0 60 60. 5 faces: top/bottom/left/right/center
const OCCLUSAL: Record<string, Record<string, string>> = {
  MOLAR: {
    outer: 'M 6,6 L 54,6 L 54,54 L 6,54 Z',
    top: 'M 6,6 L 54,6 L 40,20 L 20,20 Z',
    bottom: 'M 54,54 L 6,54 L 20,40 L 40,40 Z',
    left: 'M 6,54 L 6,6 L 20,20 L 20,40 Z',
    right: 'M 54,6 L 54,54 L 40,40 L 40,20 Z',
    center: 'M 20,20 L 40,20 L 40,40 L 20,40 Z',
  },
  PREMOLAR: {
    outer: 'M 16,6 L 44,6 L 44,54 L 16,54 Z',
    top: 'M 16,6 L 44,6 L 36,20 L 24,20 Z',
    bottom: 'M 44,54 L 16,54 L 24,40 L 36,40 Z',
    left: 'M 16,54 L 16,6 L 24,20 L 24,40 Z',
    right: 'M 44,6 L 44,54 L 36,40 L 36,20 Z',
    center: 'M 24,20 L 36,20 L 36,40 L 24,40 Z',
  },
  CANINE: {
    outer: 'M 30,4 L 54,16 L 54,48 L 30,56 L 6,48 L 6,16 Z',
    top: 'M 6,16 L 30,4 L 54,16 L 42,26 L 30,18 L 18,26 Z',
    bottom: 'M 54,48 L 30,56 L 6,48 L 18,36 L 30,44 L 42,36 Z',
    left: 'M 6,48 L 6,16 L 18,26 L 18,36 Z',
    right: 'M 54,16 L 54,48 L 42,36 L 42,26 Z',
    center: 'M 30,18 L 42,26 L 42,36 L 30,44 L 18,36 L 18,26 Z',
  },
  INCISOR: {
    outer: 'M 6,16 L 54,16 L 54,44 L 6,44 Z',
    top: 'M 6,16 L 54,16 L 40,24 L 20,24 Z',
    bottom: 'M 54,44 L 6,44 L 20,36 L 40,36 Z',
    left: 'M 6,44 L 6,16 L 20,24 L 20,36 Z',
    right: 'M 54,16 L 54,44 L 40,36 L 40,24 Z',
    center: 'M 20,24 L 40,24 L 40,36 L 20,36 Z',
  },
};

// ─── FRONTAL TOOTH COMPONENT ───────────────────────────────────────────────
const FrontalTooth = ({
  toothNumber, data, onClick, large = false,
}: { toothNumber: number; data: ToothData; onClick?: () => void; large?: boolean }) => {
  const status = data.status || 'Saudável';
  const isUpper = toothNumber >= 11 && toothNumber <= 28;
  const type = getType(toothNumber);
  // Lower molars use different (2-root) paths
  const pathKey = (!isUpper && type === 'MOLAR') ? 'MOLAR_LOWER' : type;
  const paths = FRONTAL[pathKey] || FRONTAL.INCISOR;

  const crownFill = STATUS_COLORS[status]?.fill ?? 'url(#grad-enamel)';
  const size = large ? 'w-36 h-56' : 'aspect-[6/13] h-auto w-full max-w-8';

  if (status === 'Implante') {
    return (
      <svg viewBox="0 0 60 130" className={`${size} overflow-visible`} onClick={onClick}>
        <SvgDefs />
        {/* Grey implant screw */}
        <rect x="22" y="12" width="16" height="56" rx="3" fill="url(#grad-implant)" stroke="#475569" strokeWidth="0.5" />
        {[20, 27, 34, 41, 48, 55, 62].map(y => (
          <line key={y} x1="22" y1={y} x2="38" y2={y} stroke="#64748b" strokeWidth="1" />
        ))}
        {/* Crown */}
        <path d={paths.crown} fill={crownFill} stroke="#1e293b" strokeWidth="2.5" strokeLinejoin="round" filter="url(#tooth-shadow)" />
      </svg>
    );
  }

  if (status === 'Ausente') {
    return (
      <svg viewBox="0 0 60 130" className={`${size} overflow-visible opacity-25`} onClick={onClick}>
        <path d={paths.crown} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4,4" strokeLinejoin="round" />
        {paths.roots.map((r, i) => <path key={i} d={r} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4,4" strokeLinejoin="round" />)}
      </svg>
    );
  }

  // When flipping lower teeth, we flip around the gumline (y=68)
  const flipTransform = !isUpper ? `scale(1,-1) translate(0,-136)` : undefined;

  return (
    <svg
      viewBox="0 0 60 130"
      className={`${size} overflow-visible cursor-pointer transition-transform hover:scale-125`}
      onClick={onClick}
    >
      <SvgDefs />
      <g transform={flipTransform} className="origin-center">
        {/* Roots */}
        {paths.roots.map((r, i) => (
          <path
            key={i}
            d={r}
            fill="url(#grad-root)"
            stroke="#1e293b"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ))}
        {/* Neck / gumline separator — semi-transparent pink band */}
        <rect x="18" y="62" width="24" height="4" rx="2" fill="#d06070" fillOpacity="0.3" />
        {/* Crown */}
        <path
          d={paths.crown}
          fill={crownFill}
          stroke="#1e293b"
          strokeWidth="2.5"
          strokeLinejoin="round"
          filter="url(#tooth-shadow)"
        />
      </g>
    </svg>
  );
};

// ─── OCCLUSAL TOOTH COMPONENT ──────────────────────────────────────────────
const OcclusalTooth = ({
  toothNumber, data, onClick, large = false,
}: { toothNumber: number; data: ToothData; onClick?: (face: string) => void; large?: boolean }) => {
  const status = data.status || 'Saudável';
  const type = getType(toothNumber);
  const paths = OCCLUSAL[type] || OCCLUSAL.INCISOR;
  const size = large ? 'w-36 h-36' : 'aspect-square h-auto w-full max-w-9';

  const overrideAll = ['Ausente', 'Implante', 'Ponte'].includes(status);

  const getFill = (face: string) => {
    if (overrideAll) return STATUS_COLORS[status]?.fill ?? '#888';
    if (data.faces?.[face] && data.faces[face].status !== 'Saudável') {
      return STATUS_COLORS[data.faces[face].status]?.fill ?? 'url(#grad-enamel)';
    }
    return status !== 'Saudável' ? (STATUS_COLORS[status]?.fill ?? 'url(#grad-enamel)') : 'url(#grad-enamel)';
  };

  if (status === 'Ausente') {
    return (
      <svg viewBox="0 0 60 60" className={`${size} opacity-25`}>
        <path d={paths.outer} fill="none" stroke="#64748b" strokeWidth="2.5" strokeDasharray="6,4" strokeLinejoin="round" />
      </svg>
    );
  }

  const faceOrder = ['left', 'right', 'top', 'bottom', 'center'] as const;

  return (
    <svg viewBox="0 0 60 60" className={`${size} drop-shadow-md`}>
      <SvgDefs />
      {faceOrder.map(face => (
        <path
          key={face}
          d={paths[face]}
          fill={getFill(face)}
          stroke="#0f172a"
          strokeWidth={large ? "1.5" : "2.5"}
          strokeLinejoin="round"
          className="transition-all hover:brightness-125 cursor-pointer"
          onClick={onClick ? (e) => { e.stopPropagation(); onClick(face); } : undefined}
        />
      ))}
    </svg>
  );
};

// ─── MAIN ODONTOGRAM ───────────────────────────────────────────────────────
const Odontogram: React.FC<OdontogramProps> = ({ data = {}, onChange, readOnly = false }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [activeFace, setActiveFace] = useState<string | null>(null);

  const get = (n: number): ToothData => data[n.toString()] || { status: 'Saudável', notes: '' };

  const setStatus = (status: string) => {
    if (!selected || readOnly) return;
    onChange({ ...data, [selected]: { ...get(selected), status } });
  };

  const setFace = (face: string, status: string) => {
    if (!selected || readOnly) return;
    const cur = get(selected);
    onChange({
      ...data,
      [selected]: { ...cur, faces: { ...(cur.faces || {}), [face]: { status } } },
    });
  };

  const setNotes = (notes: string) => {
    if (!selected || readOnly) return;
    onChange({ ...data, [selected]: { ...get(selected), notes } });
  };

  const recorded = Object.keys(data).filter(k =>
    data[k].status !== 'Saudável' || data[k].notes || (data[k].faces && Object.keys(data[k].faces!).length)
  );

  const TeethRow = ({ teeth, upper }: { teeth: number[]; upper: boolean }) => (
    <div className="odontogram-grid">
      {teeth.map(n => {
        const td = get(n);
        return (
          <div key={n} className="group flex min-w-0 flex-col items-center gap-0.5">
            <span className="text-[9px] md:text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors font-mono">{n}</span>
            <button
              type="button"
              className="relative flex min-h-11 w-full min-w-0 touch-manipulation items-center justify-center"
              onClick={() => !readOnly && (setSelected(n), setActiveFace(null))}
              disabled={readOnly}
              title={`Dente ${n} — ${td.status}`}
            >
              {upper ? (
                <FrontalTooth toothNumber={n} data={td} />
              ) : (
                <FrontalTooth toothNumber={n} data={td} />
              )}
              {td.notes && <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.8)]" />}
            </button>
          </div>
        );
      })}
    </div>
  );

  const OcclusalRow = ({ teeth }: { teeth: number[] }) => (
    <div className="odontogram-grid">
      {teeth.map(n => (
        <button
          key={n}
          type="button"
          className="flex min-h-11 min-w-0 touch-manipulation items-center justify-center"
          onClick={() => !readOnly && (setSelected(n), setActiveFace(null))}
          disabled={readOnly}
          title={`Dente ${n} — ${get(n).status}`}
          aria-label={`Selecionar dente ${n}, condição ${get(n).status}`}
        >
          <OcclusalTooth toothNumber={n} data={get(n)} />
        </button>
      ))}
    </div>
  );

  return (
    <Card className="odontogram-card overflow-hidden border-slate-800 bg-[#0a1120] text-slate-200 shadow-2xl">
      <CardHeader className="border-b border-slate-800/70 bg-gradient-to-r from-[#0f172a] to-[#0a1120] p-4 pb-4 sm:p-6 sm:pb-4">
        <CardTitle className="text-xl font-serif tracking-wide text-white">Odontograma</CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          Vista frontal (raízes) e oclusal (faces) interativas por dente.
        </CardDescription>
      </CardHeader>

      <CardContent className="min-w-0 touch-pan-y overflow-x-hidden p-2 min-[360px]:p-3 sm:p-6">
        <div className="flex w-full min-w-0 flex-col gap-3">

          {/* ── UPPER ARCH ── */}
          <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">Arcada Superior</p>
          <TeethRow teeth={TEETH_UPPER} upper />
          <OcclusalRow teeth={TEETH_UPPER} />

          {/* ── DIVIDER ── */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <span className="text-[9px] text-slate-600 uppercase tracking-widest">Linha Oclusal</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </div>

          {/* ── LOWER ARCH ── */}
          <OcclusalRow teeth={TEETH_LOWER} />
          <TeethRow teeth={TEETH_LOWER} upper={false} />
          <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">Arcada Inferior</p>
        </div>

        {/* ── LEGEND ── */}
        <div className="mt-8 flex min-w-0 flex-wrap items-center justify-center gap-3 rounded-xl border border-slate-800 bg-[#0f172a] p-3 sm:p-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Legenda:</span>
          {STATUSES.map(s => (
            <div key={s} className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <div
                className="w-3 h-3 rounded-full ring-1 ring-white/10"
                style={{ background: s === 'Saudável' ? 'linear-gradient(135deg,#fff 0%,#c8c4b0 100%)' : STATUS_COLORS[s]?.hex }}
              />
              {s}
            </div>
          ))}
        </div>

        {/* ── READ-ONLY SUMMARY ── */}
        {readOnly && recorded.length > 0 && (
          <div className="mt-8 space-y-3">
            <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Resumo Clínico</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recorded.map(t => {
                const labels = getFaceLabels(parseInt(t));
                const td = data[t];
                return (
                  <div key={t} className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white">{t}</span>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[td.status]?.badge}`}>{td.status}</Badge>
                    </div>
                    {td.faces && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(td.faces).filter(([, v]) => v.status !== 'Saudável').map(([f, v]) => (
                          <Badge key={f} variant="secondary" className="text-[9px] bg-slate-900 text-slate-300 border-slate-700">
                            {labels[f as keyof typeof labels]}: {v.status}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {td.notes && <p className="text-slate-400 text-xs mt-2 italic border-t border-slate-700 pt-2">"{td.notes}"</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* ── DETAIL MODAL ── */}
      <Dialog open={selected !== null} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[520px] overscroll-y-contain overflow-y-auto border-slate-800 bg-[#0a1120] text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg text-white font-serif">Dente {selected}</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const td = get(selected);
            const labels = getFaceLabels(selected);
            return (
              <div className="flex flex-col gap-5 pt-1">
                {/* Dual view */}
                <div className="grid min-w-0 grid-cols-1 items-center justify-items-center gap-6 rounded-xl border border-slate-800 bg-[#0f172a] p-4 sm:grid-cols-[1fr_auto_1fr] sm:p-6">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[9px] uppercase text-slate-500 tracking-wider">Vista Frontal</span>
                    <FrontalTooth toothNumber={selected} data={td} large />
                  </div>
                  <div className="hidden h-40 w-px bg-slate-800 sm:block" />
                  <div className="flex flex-col items-center gap-2 relative">
                    <span className="text-[9px] uppercase text-slate-500 tracking-wider">Vista Oclusal</span>
                    <div className="relative">
                      {/* Face axis labels */}
                      <div className="absolute -top-5 w-full text-center text-[8px] text-slate-500 uppercase">{labels.top}</div>
                      <div className="absolute -bottom-5 w-full text-center text-[8px] text-slate-500 uppercase">{labels.bottom}</div>
                      <div className="absolute top-1/2 -left-8 -translate-y-1/2 -rotate-90 text-[8px] text-slate-500 uppercase">{labels.left}</div>
                      <div className="absolute top-1/2 -right-8 -translate-y-1/2 rotate-90 text-[8px] text-slate-500 uppercase">{labels.right}</div>
                      <OcclusalTooth
                        toothNumber={selected}
                        data={td}
                        large
                        onClick={face => setActiveFace(face === activeFace ? null : face)}
                      />
                    </div>
                  </div>
                </div>

                {/* Status selector */}
                {activeFace ? (
                  <div className="p-4 bg-blue-900/10 border border-blue-800/30 rounded-xl">
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-[10px] uppercase text-blue-400 font-bold tracking-wider">
                        Face: {labels[activeFace as keyof typeof labels]}
                      </Label>
                      <button onClick={() => setActiveFace(null)} className="text-[10px] text-slate-500 hover:text-white underline">
                        Dente inteiro
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map(s => (
                        <Badge
                          key={s}
                          variant="outline"
                          onClick={() => setFace(activeFace, s)}
                          className={`cursor-pointer px-3 py-1 transition-all hover:scale-105 ${
                            td.faces?.[activeFace]?.status === s
                              ? 'ring-2 ring-blue-500 bg-blue-900/30 text-white'
                              : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Condição Geral</Label>
                      <span className="text-[9px] text-slate-600">(ou clique em uma face acima)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map(s => (
                        <Badge
                          key={s}
                          variant="outline"
                          onClick={() => setStatus(s)}
                          className={`cursor-pointer px-3 py-1 transition-all hover:scale-105 ${
                            td.status === s
                              ? 'ring-2 ring-slate-400 bg-slate-700 text-white'
                              : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Observações Clínicas</Label>
                  <Input
                    value={td.notes || ''}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Descreva particularidades, prognóstico..."
                    disabled={readOnly}
                    className="bg-slate-900/60 border-slate-700 text-slate-200 placeholder:text-slate-600 focus-visible:ring-slate-600"
                  />
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Odontogram;
