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
  // Crown: trapezoidal with 2 buccal cusps visible from frontal view
  MOLAR: {
    crown: [
      // Base at gumline
      'M 9,68',
      // Left cheek going up to disto-buccal cusp
      'C 9,58 11,54 13,52',
      'C 14,50 16,48 18,47',
      // Left cusp tip
      'C 19,45 21,43 23,43',
      'C 24,43 25,44 24,46',
      // Saddle between cusps
      'C 24,49 30,50 36,49',
      'C 35,44 36,43 37,43',
      // Right cusp tip
      'C 39,43 41,45 42,47',
      // Right cheek
      'C 44,48 46,50 47,52',
      'C 49,54 51,58 51,68 Z',
    ].join(' '),
    // 3 roots for upper molar (2 buccal + 1 palatal behind)
    roots: [
      // Mesio-buccal root (left)
      'M 18,68 C 17,60 14,45 12,25 C 11,16 14,10 17,10 C 20,10 22,16 22,24 C 22,44 21,60 22,68 Z',
      // Palatal root (middle, slightly taller)
      'M 27,68 C 27,58 26,40 26,18 C 27,10 31,8 34,9 C 37,10 38,14 37,20 C 36,42 35,58 35,68 Z',
      // Disto-buccal root (right)
      'M 40,68 C 40,60 42,44 44,25 C 45,16 48,11 51,12 C 54,13 55,18 54,26 C 51,45 47,60 46,68 Z',
    ],
  },

  // ── PREMOLAR ───────────────────────────────────────────────────────────
  // Crown: narrower than molar, 2 cusps (buccal + palatal/lingual)
  PREMOLAR: {
    crown: [
      'M 14,68',
      'C 14,60 15,55 17,52',
      'C 18,49 20,47 22,46',
      // Buccal cusp tip
      'C 23,44 25,42 27,42',
      'C 29,42 31,44 32,46',
      // Slight dip then lingual cusp
      'C 34,47 36,49 37,52',
      'C 39,55 40,60 40,68 Z',
    ].join(' '),
    // 2 roots for upper premolar (or 1 bifurcated — show 2)
    roots: [
      'M 19,68 C 18,58 16,42 15,24 C 15,15 18,11 21,11 C 24,11 25,15 25,23 C 25,41 24,58 24,68 Z',
      'M 33,68 C 33,58 35,42 36,24 C 37,15 40,11 43,12 C 46,13 46,17 45,24 C 44,42 41,58 40,68 Z',
    ],
  },

  // ── CANINE ──────────────────────────────────────────────────────────────
  // Crown: diamond/cusp shape — single pointed cusp
  CANINE: {
    crown: [
      'M 16,68',
      'C 16,60 18,54 20,50',
      'C 21,47 23,44 25,42',
      // Single cusp tip
      'C 27,40 29,39 30,39',
      'C 31,39 33,40 35,42',
      'C 37,44 39,47 40,50',
      'C 42,54 44,60 44,68 Z',
    ].join(' '),
    roots: [
      // Single long tapered root — longest root in the mouth
      'M 22,68 C 21,56 20,40 21,22 C 22,13 26,8 30,8 C 34,8 38,13 39,22 C 40,40 39,56 38,68 Z',
    ],
  },

  // ── INCISOR ─────────────────────────────────────────────────────────────
  // Crown: shovel/spatula shape — flat incisal edge
  INCISOR: {
    crown: [
      'M 15,68',
      'C 15,60 17,55 19,52',
      'C 20,50 22,48 25,47',
      // Slight gentle incisal edge (nearly flat)
      'C 27,46 28,45 30,45',
      'C 32,45 33,46 35,47',
      'C 38,48 40,50 41,52',
      'C 43,55 45,60 45,68 Z',
    ].join(' '),
    roots: [
      // Single root, rounder and shorter than canine
      'M 21,68 C 20,58 19,42 20,26 C 21,16 25,12 30,12 C 35,12 39,16 40,26 C 41,42 40,58 39,68 Z',
    ],
  },

  // ── LOWER MOLAR variant (2 roots: mesial + distal) ───────────────────
  MOLAR_LOWER: {
    crown: [
      'M 8,68',
      'C 8,58 10,54 12,52',
      'C 13,50 15,48 17,47',
      'C 19,45 21,43 23,43',
      'C 24,43 25,44 24,46',
      'C 24,49 30,50 36,49',
      'C 35,44 36,43 37,43',
      'C 39,43 41,45 43,47',
      'C 45,48 47,50 48,52',
      'C 50,54 52,58 52,68 Z',
    ].join(' '),
    // 2 roots: mesial (left, wider) + distal (right)
    roots: [
      'M 16,68 C 14,56 12,40 11,22 C 10,14 14,9 18,10 C 22,11 24,16 23,24 C 22,42 20,56 22,68 Z',
      'M 38,68 C 38,56 40,40 41,22 C 42,14 46,10 50,11 C 54,12 56,17 54,24 C 53,42 49,56 48,68 Z',
    ],
  },
};

// Implant screw path — rendered when status === Implante
const IMPLANT_PATH = 'M 20,68 L 20,20 C 20,15 40,15 40,20 L 40,68 Z M 18,55 L 42,55 M 18,48 L 42,48 M 18,41 L 42,41 M 18,34 L 42,34 M 18,27 L 42,27';

// ─── OCCLUSAL PATHS ────────────────────────────────────────────────────────
// ViewBox: 0 0 100 100. 5 faces: top/bottom/left/right/center
const OCCLUSAL: Record<string, Record<string, string>> = {
  MOLAR: {
    outer:  'M 15,15 C 30,5 70,5 85,15 C 95,30 95,70 85,85 C 70,95 30,95 15,85 C 5,70 5,30 15,15 Z',
    top:    'M 15,15 C 30,5 70,5 85,15 L 72,30 C 60,22 40,22 28,30 Z',
    bottom: 'M 28,70 C 40,78 60,78 72,70 L 85,85 C 70,95 30,95 15,85 Z',
    left:   'M 15,15 C 5,30 5,70 15,85 L 28,70 C 22,60 22,40 28,30 Z',
    right:  'M 85,15 C 95,30 95,70 85,85 L 72,70 C 78,60 78,40 72,30 Z',
    center: 'M 28,30 C 40,22 60,22 72,30 C 78,40 78,60 72,70 C 60,78 40,78 28,70 C 22,60 22,40 28,30 Z',
  },
  PREMOLAR: {
    outer:  'M 22,15 C 38,6 62,6 78,15 C 90,28 90,72 78,85 C 62,94 38,94 22,85 C 10,72 10,28 22,15 Z',
    top:    'M 22,15 C 38,6 62,6 78,15 L 66,32 C 55,24 45,24 34,32 Z',
    bottom: 'M 34,68 C 45,76 55,76 66,68 L 78,85 C 62,94 38,94 22,85 Z',
    left:   'M 22,15 C 10,28 10,72 22,85 L 34,68 C 26,60 26,40 34,32 Z',
    right:  'M 78,15 C 90,28 90,72 78,85 L 66,68 C 74,60 74,40 66,32 Z',
    center: 'M 34,32 C 45,24 55,24 66,32 C 74,40 74,60 66,68 C 55,76 45,76 34,68 C 26,60 26,40 34,32 Z',
  },
  CANINE: {
    outer:  'M 30,15 C 44,8 56,8 70,15 C 82,26 84,60 76,82 C 65,94 35,94 24,82 C 16,60 18,26 30,15 Z',
    top:    'M 30,15 C 44,8 56,8 70,15 L 62,35 C 54,26 46,26 38,35 Z',
    bottom: 'M 38,65 C 46,74 54,74 62,65 L 76,82 C 65,94 35,94 24,82 Z',
    left:   'M 30,15 C 18,26 16,60 24,82 L 38,65 C 30,55 30,42 38,35 Z',
    right:  'M 70,15 C 82,26 84,60 76,82 L 62,65 C 70,42 70,55 62,35 Z',
    center: 'M 38,35 C 46,26 54,26 62,35 C 70,42 70,55 62,65 C 54,74 46,74 38,65 C 30,55 30,42 38,35 Z',
  },
  INCISOR: {
    outer:  'M 20,22 C 38,10 62,10 80,22 C 88,35 88,65 80,78 C 62,90 38,90 20,78 C 12,65 12,35 20,22 Z',
    top:    'M 20,22 C 38,10 62,10 80,22 L 72,40 C 58,30 42,30 28,40 Z',
    bottom: 'M 28,60 C 42,70 58,70 72,60 L 80,78 C 62,90 38,90 20,78 Z',
    left:   'M 20,22 C 12,35 12,65 20,78 L 28,60 C 22,52 22,48 28,40 Z',
    right:  'M 80,22 C 88,35 88,65 80,78 L 72,60 C 78,48 78,52 72,40 Z',
    center: 'M 28,40 C 42,30 58,30 72,40 C 78,48 78,52 72,60 C 58,70 42,70 28,60 C 22,52 22,48 28,40 Z',
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
  const size = large ? 'w-36 h-56' : 'w-8 h-14';

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
        <path d={paths.crown} fill={crownFill} stroke="#334155" strokeWidth="0.8" filter="url(#tooth-shadow)" />
      </svg>
    );
  }

  if (status === 'Ausente') {
    return (
      <svg viewBox="0 0 60 130" className={`${size} overflow-visible opacity-20`} onClick={onClick}>
        <path d={paths.crown} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3,2" />
        {paths.roots.map((r, i) => <path key={i} d={r} fill="none" stroke="#64748b" strokeWidth="0.8" strokeDasharray="3,2" />)}
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
      <g transform={flipTransform}>
        {/* Roots */}
        {paths.roots.map((r, i) => (
          <path
            key={i}
            d={r}
            fill="url(#grad-root)"
            stroke="#78624a"
            strokeWidth="0.6"
            filter="url(#tooth-shadow)"
          />
        ))}
        {/* Neck / gumline separator — semi-transparent pink band */}
        <rect x="5" y="64" width="50" height="7" rx="3" fill="#d06070" fillOpacity="0.25" />
        {/* Crown */}
        <path
          d={paths.crown}
          fill={crownFill}
          stroke="#8899aa"
          strokeWidth="0.7"
          filter="url(#tooth-shadow)"
        />
        {/* Enamel highlight */}
        <path
          d={paths.crown}
          fill="none"
          stroke="white"
          strokeWidth="1.2"
          strokeOpacity="0.25"
          strokeDasharray="0"
          style={{ clipPath: 'inset(0 0 70% 0)' }}
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
  const size = large ? 'w-36 h-36' : 'w-9 h-9';

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
      <svg viewBox="0 0 100 100" className={`${size} opacity-10`}>
        <path d={paths.outer} fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,3" />
      </svg>
    );
  }

  const faceOrder = ['left', 'right', 'top', 'bottom', 'center'] as const;

  return (
    <svg viewBox="0 0 100 100" className={`${size} drop-shadow-md`}>
      <SvgDefs />
      {faceOrder.map(face => (
        <path
          key={face}
          d={paths[face]}
          fill={getFill(face)}
          stroke="#0f172a"
          strokeWidth={large ? "0.8" : "1.5"}
          className="transition-all hover:brightness-125 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onClick?.(face); }}
        />
      ))}
      {/* Fissure lines on molars & premolars for realism */}
      {(type === 'MOLAR' || type === 'PREMOLAR') && (
        <g stroke="#1e293b" strokeWidth="0.8" fill="none" opacity="0.4" className="pointer-events-none">
          <line x1="50" y1="28" x2="50" y2="72" />
          <line x1="28" y1="50" x2="72" y2="50" />
        </g>
      )}
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
    <div className="flex justify-center gap-0.5 md:gap-1 flex-nowrap">
      {teeth.map(n => {
        const td = get(n);
        return (
          <div key={n} className="flex flex-col items-center gap-0.5 group">
            <span className="text-[9px] md:text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors font-mono">{n}</span>
            <button
              className="relative flex items-center justify-center"
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
    <div className="flex justify-center gap-0.5 md:gap-1 flex-nowrap">
      {teeth.map(n => (
        <OcclusalTooth
          key={n}
          toothNumber={n}
          data={get(n)}
          onClick={() => !readOnly && (setSelected(n), setActiveFace(null))}
        />
      ))}
    </div>
  );

  return (
    <Card className="border-slate-800 bg-[#0a1120] text-slate-200 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-800/70 pb-4 bg-gradient-to-r from-[#0f172a] to-[#0a1120]">
        <CardTitle className="text-xl font-serif tracking-wide text-white">Odontograma</CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          Vista frontal (raízes) e oclusal (faces) interativas por dente.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 md:p-6 overflow-x-auto">
        <div className="min-w-[680px] flex flex-col gap-3">

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
        <div className="mt-8 flex flex-wrap gap-3 items-center justify-center p-4 rounded-xl border border-slate-800 bg-[#0f172a]">
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
        <DialogContent className="sm:max-w-[520px] bg-[#0a1120] border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg text-white font-serif">Dente {selected}</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const td = get(selected);
            const labels = getFaceLabels(selected);
            return (
              <div className="flex flex-col gap-5 pt-1">
                {/* Dual view */}
                <div className="flex items-center justify-around bg-[#0f172a] rounded-xl border border-slate-800 p-6">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[9px] uppercase text-slate-500 tracking-wider">Vista Frontal</span>
                    <FrontalTooth toothNumber={selected} data={td} large />
                  </div>
                  <div className="w-px h-40 bg-slate-800" />
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
