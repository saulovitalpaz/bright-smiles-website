"use client";

import React, { useState } from 'react';
import {
  Activity,
  Baby,
  Calendar,
  ChevronRight,
  ClipboardList,
  Droplets,
  FileText,
  Heart,
  Info,
  Layers,
  Navigation,
  RefreshCcw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  User,
  FlaskConical,
  Target,
  CircleDot,
  SearchCheck,
  Printer,
  Microscope,
  Expand,
  Circle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- CLINICAL DATA ---

const calculations: any = {
  calculateKidneyLength: (w: any) => { const vn = Number(w); return vn ? parseFloat((2.5 + (0.03 * vn)).toFixed(2)) : null; },
  calculateProstateLength: (w: any, a: any) => { const vw = Number(w); const va = Number(a); return (vw && va) ? parseFloat((0.51 + (0.04 * vw) + (0.03 * va)).toFixed(2)) : null; },
  calculateGIDuodenum: (w: any) => { const vn = Number(w); return !vn ? null : vn < 15 ? 0.38 : (vn <= 30 ? 0.41 : 0.44); },
  calculateGIJejunum: (w: any) => { const vn = Number(w); return !vn ? null : vn < 15 ? 0.3 : (vn <= 30 ? 0.35 : 0.38); },
  calculateGIIleum: (w: any) => { const vn = Number(w); return !vn ? null : vn < 15 ? 0.3 : (vn <= 30 ? 0.35 : 0.38); },
  calculateAdrenalLeft: (w: any) => { const vn = Number(w); return !vn ? null : vn <= 5 ? [2.0, 5.1] : (vn <= 20 ? [2.8, 6.4] : [2.9, 7.3]); },
  calculateAdrenalRight: (w: any) => { const vn = Number(w); return !vn ? null : vn <= 5 ? [2.4, 5.3] : (vn <= 20 ? [3.1, 7.5] : [3.3, 8.7]); },
  calculateAdrenalAortaRatio: (w: any) => { const vn = Number(w); return !vn ? null : vn < 10 ? [0, 1.5] : (vn <= 20 ? [0, 1.06] : [0, 0.83]); },
  calculateTesticleLength: (w: any) => { const vn = Number(w); return !vn ? null : vn <= 10 ? [1.5, 3.3] : [3.4, 4]; },
  calculateTesticleWidth: (w: any) => { const vn = Number(w); return !vn ? null : vn <= 10 ? [1, 2.2] : [2, 3.8]; },
  calculateTesticleHeight: (w: any) => { const vn = Number(w); return !vn ? null : vn <= 10 ? [0.8, 1.8] : [2.2, 3.5]; },
  calculateVesicleToy: (val: any) => { const vn = Number(val); return vn ? `${(6 * vn + 20).toFixed(1)} dias` : null; },
  calculateVesicleSmall: (val: any) => { const vn = Number(val); return vn ? `${((vn - 68.68) / 1.53).toFixed(1)} dias` : null; },
  calculateVesicleMed: (val: any) => { const vn = Number(val); return vn ? `${((vn - 82.13) / 1.8).toFixed(1)} dias` : null; },
  calculateBPToy: (val: any) => { const vn = Number(val); return vn ? `${((15 * vn) + 20).toFixed(1)} dias` : null; },
  calculateBPSmall: (val: any) => { const vn = Number(val); return vn ? `${((vn - 25.11) / 0.61).toFixed(1)} dias` : null; },
  calculateBPMed: (val: any) => { const vn = Number(val); return vn ? `${((vn - 29.18) / 0.7).toFixed(1)} dias` : null; },
  calculateFelinePancreaticDuct: (_w: any, a: any) => { const va = Number(a); return va < 10 ? [0.5, 1.3] : [0.6, 2.4]; },
  calculateFelineAdrenalCaudal: (w: any) => { const vn = Number(w); return vn <= 4 ? [0, 3.9] : [0, 4.8]; },
};

const organData: any = {
  canine: {
    kidney: {
      name: 'Rins', icon: <Activity className="w-5 h-5" />,
      fields: [
        { id: 'kidney_length', label: 'Comprimento', unit: 'cm', reference: 'calculateKidneyLength' },
        { id: 'kidney_cortex', label: 'Espessura Cortical', unit: 'mm', reference: [3, 8] },
        { id: 'kidney_pelvis', label: 'Pelve Renal', unit: 'mm', reference: [0, 4] },
        { id: 'kidney_aorta_ratio', label: 'Relação Rim/Aorta', unit: '', reference: [5.5, 9.1] }
      ]
    },
    liver: {
      name: 'Fígado', icon: <Layers className="w-5 h-5" />,
      fields: [{ id: 'liver_score', label: 'Score Ecogenicidade (1-5)', unit: '', reference: [1, 2] }]
    },
    gallbladder: {
      name: 'Vesícula Biliar', icon: <Droplets className="w-5 h-5" />,
      fields: [
        { id: 'gb_wall', label: 'Espessura da Parede', unit: 'cm', reference: [0, 0.1] },
        { id: 'cbd_porta', label: 'Ducto Biliar (porta)', unit: 'cm', reference: [0, 0.3] }
      ]
    },
    pancreas: {
      name: 'Pâncreas', icon: <FlaskConical className="w-5 h-5" />,
      fields: [
        { id: 'pancreas_body', label: 'Corpo', unit: 'cm', reference: [0.47, 0.79] },
        { id: 'pancreas_left', label: 'Lobo Esquerdo', unit: 'cm', reference: [0.46, 0.8] },
        { id: 'pancreas_right', label: 'Lobo Direito', unit: 'cm', reference: [0.63, 1] },
        { id: 'pancreatic_duct', label: 'Ducto Pancreático', unit: 'cm', reference: [0.47, 0.79] }
      ]
    },
    gi_tract: {
      name: 'TGI', icon: <Circle className="w-5 h-5" />,
      fields: [
        { id: 'gi_stomach', label: 'Estômago', unit: 'cm', reference: [0.2, 0.5] },
        { id: 'gi_duodenum', label: 'Duodeno', unit: 'cm', reference: 'calculateGIDuodenum' },
        { id: 'gi_jejunum', label: 'Jejuno', unit: 'cm', reference: 'calculateGIJejunum' },
        { id: 'gi_ileum', label: 'Íleo', unit: 'cm', reference: 'calculateGIIleum' },
        { id: 'gi_cecum', label: 'Ceco/Cólon', unit: 'cm', reference: [0.15, 0.15] }
      ]
    },
    adrenals: {
      name: 'Adrenais', icon: <ShieldAlert className="w-5 h-5" />,
      fields: [
        { id: 'adrenal_left', label: 'Esq. Espessura', unit: 'mm', reference: 'calculateAdrenalLeft' },
        { id: 'adrenal_right', label: 'Dir. Espessura', unit: 'mm', reference: 'calculateAdrenalRight' },
        { id: 'adrenal_aorta_left', label: 'Rel. Esq/Aorta', unit: '', reference: 'calculateAdrenalAortaRatio' }
      ]
    },
    vascular: {
      name: 'Vascular (Doppler)', icon: <Thermometer className="w-5 h-5" />,
      subsections: [
        { name: 'Aorta Abdominal', fields: [{ id: 'aorta_diameter_proximal', label: 'Diâmetro Prox', unit: 'cm', reference: [0.7, 1.0] }, { id: 'aorta_vps', label: 'VPS', unit: 'cm/s', reference: [90, 115] }] },
        { name: 'Artéria Celíaca', fields: [{ id: 'celiac_diameter', label: 'Diâmetro', unit: 'cm', reference: [0.35, 0.45] }, { id: 'celiac_vps', label: 'VPS', unit: 'cm/s', reference: [80, 120] }] },
        { name: 'Artéria Renal', fields: [{ id: 'renal_vps_right', label: 'VPS Dir.', unit: 'cm/s', reference: [60, 100] }, { id: 'renal_vps_left', label: 'VPS Esq.', unit: 'cm/s', reference: [60, 100] }, { id: 'renal_ir_right', label: 'IR Dir.', unit: '', reference: [0.55, 0.70] }, { id: 'renal_ir_left', label: 'IR Esq.', unit: '', reference: [0.55, 0.70] }] },
        { name: 'Veia Porta', fields: [{ id: 'portal_diameter', label: 'Diâmetro', unit: 'cm', reference: [0.5, 0.8] }, { id: 'portal_velocity_mean', label: 'Velocidade Média', unit: 'cm/s', reference: [10, 25] }, { id: 'portal_aorta_ratio', label: 'Rel. VP/Aorta', unit: '', reference: [0.6, 1.2] }] },
        { name: 'Veia Cava Caudal', fields: [{ id: 'vcc_diameter', label: 'Diâmetro', unit: 'cm', reference: [0.5, 0.9] }] }
      ]
    },
    testicles: {
      name: 'Testículos', icon: <CircleDot className="w-5 h-5" />, gender: 'male',
      subsections: [
        { name: 'Biometria', fields: [{ id: 'testicle_length', label: 'Comprimento', unit: 'cm', reference: 'calculateTesticleLength' }, { id: 'testicle_width', label: 'Largura', unit: 'cm', reference: 'calculateTesticleWidth' }, { id: 'testicle_height', label: 'Altura', unit: 'cm', reference: 'calculateTesticleHeight' }] },
        { name: 'Doppler Testicular', fields: [{ id: 'testicular_ir_normal', label: 'IR Testicular', unit: '', reference: [0.48, 0.75] }, { id: 'testicular_vps_normal', label: 'VPS Testicular', unit: 'cm/s', reference: [8, 18] }] },
        { name: 'Epidídimo', fields: [{ id: 'epididymis_head', label: 'Cabeça', unit: 'cm', reference: [0.5, 1.2] }, { id: 'epididymis_tail', label: 'Cauda', unit: 'cm', reference: [0.4, 1.0] }] }
      ]
    },
    prostate: {
      name: 'Próstata', icon: <Target className="w-5 h-5" />, gender: 'male',
      subsections: [
        { name: 'Biometria', fields: [{ id: 'prostate_length', label: 'Comprimento', unit: 'cm', reference: 'calculateProstateLength' }, { id: 'prostate_width', label: 'Largura', unit: 'cm', reference: null }, { id: 'prostate_height', label: 'Altura', unit: 'cm', reference: null }] },
        { name: 'Doppler Prostático', fields: [{ id: 'prostate_ir_normal', label: 'IR Normal', unit: '', reference: [0.57, 0.82] }, { id: 'prostate_vps_normal', label: 'VPS Normal', unit: 'cm/s', reference: [10, 25] }] }
      ]
    },
    spleen: {
      name: 'Baço', icon: <Expand className="w-5 h-5" />,
      subsections: [
        { name: 'Biometria', fields: [{ id: 'spleen_thickness', label: 'Espessura', unit: 'cm', reference: [0.5, 1.5] }] },
        { name: 'Doppler Esplênico', fields: [{ id: 'splenic_ir_normal', label: 'IR Parênquima', unit: '', reference: [0.50, 0.70] }, { id: 'splenic_vps', label: 'VPS A. Esplênica', unit: 'cm/s', reference: [40, 80] }] }
      ]
    },
    bladder: {
      name: 'Bexiga', icon: <Droplets className="w-5 h-5" />,
      fields: [{ id: 'bladder_wall', label: 'Espessura Parede', unit: 'mm', reference: [1.4, 2.5] }]
    },
    lymphnodes: {
      name: 'Linfonodos', icon: <Microscope className="w-5 h-5" />,
      subsections: [
        { name: 'Medidas Normais', fields: [{ id: 'ln_iliaco', label: 'Ilíaco Medial', unit: 'cm', reference: [0.5, 6.0] }, { id: 'ln_hepatico', label: 'Hepático', unit: 'cm', reference: [1.0, 6.0] }, { id: 'ln_esplenico', label: 'Esplênico', unit: 'cm', reference: [0.5, 4.0] }, { id: 'ln_jejunal', label: 'Jejunal', unit: 'cm', reference: [0.5, 20.0] }] },
        { name: 'Características', fields: [{ id: 'ln_shape_normal', label: 'Formato (Rel. S/L)', unit: '', reference: [0, 0.5] }] }
      ]
    },
    pregnancy: {
      name: 'Gestação', icon: <Baby className="w-5 h-5" />, gender: 'female',
      subsections: [
        { name: 'Vesícula Gestacional (<35 dias)', fields: [{ id: 'gest_vesicle_toy', label: 'Raça Toy - Dias', unit: 'dias', reference: 'calculateVesicleToy' }, { id: 'gest_vesicle_small', label: 'Raça Peq. - Dias', unit: 'dias', reference: 'calculateVesicleSmall' }, { id: 'gest_vesicle_med', label: 'Raça Med. - Dias', unit: 'dias', reference: 'calculateVesicleMed' }] },
        { name: 'Diâmetro Biparietal (>35 dias)', fields: [{ id: 'gest_bp_toy', label: 'Raça Toy - Gest.', unit: 'dias', reference: 'calculateBPToy' }, { id: 'gest_bp_small', label: 'Raça Peq. - Gest.', unit: 'dias', reference: 'calculateBPSmall' }, { id: 'gest_bp_med', label: 'Raça Med. - Gest.', unit: 'dias', reference: 'calculateBPMed' }] },
        { name: 'Frequência Fetal', fields: [{ id: 'fhr_normal', label: 'FCF Normal', unit: 'bpm', reference: [220, 262] }, { id: 'fhr_stress_mod', label: 'Sof. Moderado', unit: 'bpm', reference: [180, 220] }] }
      ]
    },
    uterus_ovaries_doppler: {
      name: 'Útero e Ovários', icon: <Activity className="w-5 h-5" />, gender: 'female',
      subsections: [
        { name: 'Doppler Uterino', fields: [{ id: 'uterus_ir_anestrus', label: 'IR - Anestro', unit: '', reference: [0.75, 0.88] }, { id: 'uterus_ir_estrus', label: 'IR - Estro', unit: '', reference: [0.50, 0.65] }, { id: 'uterus_ir_diestrus', label: 'IR - Diestro', unit: '', reference: [0.65, 0.80] }] },
        { name: 'Doppler Ovariano', fields: [{ id: 'ovary_ir_anestrus', label: 'IR - Anestro', unit: '', reference: [0.70, 0.90] }, { id: 'corpus_luteum_ir', label: 'IR Corpo Lúteo', unit: '', reference: [0.45, 0.60] }] }
      ]
    }
  },
  feline: {
    kidney: {
      name: 'Rins', icon: <Activity className="w-5 h-5" />,
      fields: [{ id: 'kidney_length', label: 'Comprimento', unit: 'cm', reference: [3.8, 4.44] }, { id: 'kidney_cortex', label: 'Espessura Cortical', unit: 'mm', reference: [3, 6] }]
    },
    liver: {
      name: 'Fígado', icon: <Layers className="w-5 h-5" />,
      fields: [{ id: 'liver_score', label: 'Score Eco.', unit: '', reference: [1, 2] }]
    },
    spleen: {
      name: 'Baço', icon: <Expand className="w-5 h-5" />,
      fields: [{ id: 'spleen_thickness', label: 'Espessura', unit: 'mm', reference: [6.4, 9.6] }]
    },
    gi_tract: {
      name: 'TGI', icon: <Circle className="w-5 h-5" />,
      subsections: [
        { name: 'Estômago', fields: [{ id: 'stomach_interrugal', label: 'Parede Inter-rugal', unit: 'mm', reference: [1.5, 2.5] }, { id: 'stomach_rugal_fold', label: 'Dobra Rugal', unit: 'mm', reference: [3.0, 5.0] }] },
        { name: 'Intestino Delgado', fields: [{ id: 'duodenum_jejunum', label: 'Duodeno/Jejuno', unit: 'mm', reference: [2.0, 2.8] }, { id: 'ileum_fold', label: 'Íleo (c/ dobras)', unit: 'mm', reference: [2.5, 3.6] }] },
        { name: 'Linfonodos', fields: [{ id: 'ln_mesenteric_cat', label: 'Mesentérico', unit: 'cm', reference: [0.3, 1.5] }] }
      ]
    },
    bladder: {
      name: 'Bexiga', icon: <Droplets className="w-5 h-5" />,
      fields: [{ id: 'bladder_wall', label: 'Espessura Parede', unit: 'mm', reference: [1.3, 1.7] }]
    },
    pancreas: {
      name: 'Pâncreas', icon: <FlaskConical className="w-5 h-5" />,
      fields: [{ id: 'pancreas_body', label: 'Corpo', unit: 'cm', reference: [0.47, 0.8] }, { id: 'pancreatic_duct', label: 'Ducto Pancreático', unit: 'mm', reference: 'calculateFelinePancreaticDuct' }]
    },
    adrenals: {
      name: 'Adrenais', icon: <ShieldAlert className="w-5 h-5" />,
      fields: [{ id: 'adrenal_left_length', label: 'Esq. Compr.', unit: 'cm', reference: [0.86, 1.2] }, { id: 'adrenal_left_caudal', label: 'Esq. Margem Caudal', unit: 'cm', reference: [0.29, 0.43] }, { id: 'adrenal_right_length', label: 'Dir. Compr.', unit: 'cm', reference: [0.8, 1.27] }, { id: 'adrenal_right_caudal', label: 'Dir. Margem', unit: 'mm', reference: 'calculateFelineAdrenalCaudal' }]
    },
    uterus: {
      name: 'Útero', icon: <Activity className="w-5 h-5" />, gender: 'female',
      fields: [{ id: 'uterus_body', label: 'Corpo', unit: 'mm', reference: [1.5, 5.3] }, { id: 'uterus_horns', label: 'Cornos', unit: 'mm', reference: [1, 5.8] }]
    },
    vascular: {
      name: 'Vascular (Gato)', icon: <Thermometer className="w-5 h-5" />,
      subsections: [
        { name: 'Renal', fields: [{ id: 'renal_vps', label: 'VPS Renal', unit: 'cm/s', reference: [35, 50] }, { id: 'renal_ir', label: 'IR Renal', unit: '', reference: [0.48, 0.62] }] },
        { name: 'Veia Porta', fields: [{ id: 'portal_velocity_mean', label: 'VM Porta', unit: 'cm/s', reference: [10, 12] }] }
      ]
    }
  },
  rabbit: {
    kidney: {
      name: 'Rins', icon: <Activity className="w-5 h-5" />,
      fields: [{ id: 'kidney_length_left', label: 'Rim Esq. Compr.', unit: 'cm', reference: [2.53, 3.19] }, { id: 'kidney_length_right', label: 'Rim Dir. Compr.', unit: 'cm', reference: [2.53, 3.21] }]
    },
    adrenal: {
      name: 'Adrenais', icon: <ShieldAlert className="w-5 h-5" />,
      fields: [{ id: 'adrenal_left_length', label: 'Esq. Comprimento', unit: 'cm', reference: [0.57, 0.85] }, { id: 'adrenal_right_length', label: 'Dir. Comprimento', unit: 'cm', reference: [0.58, 0.88] }]
    },
    gi_tract: {
      name: 'TGI', icon: <Circle className="w-5 h-5" />,
      fields: [{ id: 'stomach_wall', label: 'Parede Gástrica', unit: 'mm', reference: [0.9, 1.1] }, { id: 'sacculus_wall', label: 'Sacculus Rotundus', unit: 'mm', reference: [1.6, 2.8] }, { id: 'appendix_wall', label: 'Apêndice', unit: 'mm', reference: [1.5, 2.3] }]
    },
    uterus: {
      name: 'Útero', icon: <Activity className="w-5 h-5" />, gender: 'female',
      fields: [{ id: 'uterus_body', label: 'Corpo Uterino', unit: 'mm', reference: [1.5, 5.3] }, { id: 'uterus_horns', label: 'Cornos Uterinos', unit: 'mm', reference: [1.0, 5.8] }]
    }
  }
};

function interpretResult(measured: number, reference: any, fieldId?: string) {
  if (reference === null || reference === undefined || isNaN(measured)) return { status: 'info', text: 'Sem referência', suspicion: '' };

  let status = 'normal';
  let text = 'Normal';
  let suspicion = '';
  let isLow = false;
  let isHigh = false;

  if (Array.isArray(reference)) {
    const [min, max] = reference;
    if (measured < min) { status = 'danger'; text = 'Abaixo da referência'; isLow = true; }
    else if (measured > max) { status = 'warning'; text = 'Acima da referência'; isHigh = true; }
  } else if (typeof reference === 'string') {
    return { status: 'info', text: 'Cálculo Específico', suspicion: '' };
  } else if (typeof reference === 'number' || !isNaN(parseFloat(reference))) {
    const refNum = parseFloat(reference);
    const tolerance = refNum * 0.15;
    if (measured < refNum - tolerance) { status = 'danger'; text = 'Abaixo do calculado'; isLow = true; }
    else if (measured > refNum + tolerance) { status = 'warning'; text = 'Acima do calculado'; isHigh = true; }
    else { status = 'normal'; text = 'Dentro do esperado'; }
  }

  // --- DOPPLER & CLINICAL SUSPICIONS ---
  if (isHigh || isLow) {
    const suspicions: Record<string, { high?: string, low?: string }> = {
      // Renal
      'kidney_length': { high: 'Nefromegalia (LRA, Infiltração, Neoplasia, Inflamação aguda)', low: 'Microplasia (Doença Renal Crônica, Hipoplasia)' },
      'kidney_cortex': { high: 'Nefromegalia / Infiltração macroscópica', low: 'Doença Renal Crônica (perda corticomedular)' },
      'kidney_pelvis': { high: 'Pieloectasia / Hidronefrose / Pielonefrite' },
      'kidney_aorta_ratio': { high: 'Nefromegalia (LRA, PIF, Linfoma)', low: 'Microplasia Renal Crônica' },
      'renal_ir_right': { high: 'Sugere ^ Resistência Vascular (Nefrites, fibrose, LRA, obstrução)', low: 'Possível vasodilatação (inflamação aguda)' },
      'renal_ir_left': { high: 'Sugere ^ Resistência Vascular (Nefrites, fibrose, LRA, obstrução)', low: 'Possível vasodilatação (inflamação aguda)' },
      'renal_ir': { high: 'Sugere ^ Resistência (Nefrite, DRC, LRA)', low: 'Vasodilatação ou hiperemia' },
      // Hepatic / GB
      'liver_score': { high: 'Hiperecóico (Lipidose, hepatopatia vacuolar, fibrose/cirrose)', low: 'Hipoecóico (Congestão venosa aguda, hepatite, linfoma)' },
      'gb_wall': { high: 'Colecistite, edema de parede (anafilaxia, hipoalbuminemia), mucocele' },
      'cbd_porta': { high: 'Obstrução Biliar Extra-hepática / Colangiohepatite' },
      // Pancreas
      'pancreas_body': { high: 'Pancreatite aguda, edema, hiperplasia nodular, neoplasia', low: 'Atrofia pancreática (IPE)' },
      'pancreas_left': { high: 'Pancreatite aguda, Neoplasia', low: 'Atrofia pancreática' },
      'pancreas_right': { high: 'Pancreatite aguda, Neoplasia', low: 'Atrofia pancreática' },
      'pancreatic_duct': { high: 'Dilatação ductal (Obstrução, Pancreatite crônica)' },
      // Adrenals
      'adrenal_left': { high: 'Hiperadrenocorticismo (pituitário-dependente), tumor adrenal', low: 'Hipoadrenocorticismo, atrofia iatrogênica' },
      'adrenal_right': { high: 'Hiperadrenocorticismo (pituitário-dependente), tumor adrenal', low: 'Hipoadrenocorticismo, atrofia iatrogênica' },
      'adrenal_left_length': { high: 'Adrenomegalia / Neoplasia / HAC' },
      'adrenal_right_length': { high: 'Adrenomegalia / Neoplasia / HAC' },
      'adrenal_aorta_left': { high: 'Hiperadrenocorticismo crônico / Tumor Adrenal' },
      // Spleen
      'spleen_thickness': { high: 'Esplenomegalia (Congestão, Infeccioso, Neoplasia, Torção)', low: 'Contração esplênica (Secundária a estresse/choque)' },
      'splenic_ir_normal': { high: 'Esplenite, congestão severa, neoplasia, torção parcial', low: 'Hiperemia ativa / inflamação aguda' },
      // GI Tract
      'gi_stomach': { high: 'Espessamento (Gastrite, Ulceração, Linfoma)' },
      'gi_duodenum': { high: 'Espessamento (Enterite, IBD, Neoplasia)' },
      'gi_jejunum': { high: 'Espessamento (Enterite, IBD, Obstrução parcial)' },
      'gi_ileum': { high: 'Espessamento (Intussuscepção crônica, Linfoma, IBD)' },
      'gi_cecum': { high: 'Tiflite, Infiltração celular' },
      'stomach_interrugal': { high: 'Gastrite espessada, IBD felina, Linfoma' },
      'stomach_rugal_fold': { high: 'Pregas alteradas (Inflamação / Infiltração)' },
      'duodenum_jejunum': { high: 'IBD felino, Linfoma alimentar' },
      'ileum_fold': { high: 'Hiperplasia linfóide severa / IBD' },
      // Repro Male
      'prostate_length': { high: 'Hiperplasia Prostática Benigna (HBP), Prostatite, Cistos, Neoplasia' },
      'prostate_ir_normal': { high: 'Prostatite crônica, HBP severa, neoplasia', low: 'Prostatite aguda (hiperemia)' },
      'testicle_length': { high: 'Orquite, Neoplasia, Torção (inicial)', low: 'Hipoplasia ou atrofia' },
      'testicle_width': { high: 'Orquite, Neoplasia' },
      'testicular_ir_normal': { high: 'Orquite crônica, neoplasia, torção (fase inicial)', low: 'Inflamação aguda (hiperfluxo)' },
      'epididymis_head': { high: 'Epididimite, Granuloma espermático, Cistos' },
      'epididymis_tail': { high: 'Epididimite, Cistos' },
      // Repro Female && Bladder
      'bladder_wall': { high: 'Cistite crônica/aguda, Pólipos, Neoplasia (Carcinoma de Células de Transição)' },
      'uterus_body': { high: 'Piometra, Mucometra, Hemometra, Gestação' },
      'uterus_horns': { high: 'Conteúdo intra-luminal (Piometra/Gestação)' },
      'uterus_ir_diestrus': { high: 'Baixa perfusão (risco gestacional, piometra crônica)', low: 'Padrão inflamatório ativo (endometrite)' },
      'fhr_normal': { low: 'Sofrimento fetal avançado / Hipóxia severa', high: 'Estresse fetal pontual / Taquicardia' },
      'fhr_stress_mod': { low: 'Bradicardia fetal perigosa' },
      // Lymphnodes
      'ln_iliaco': { high: 'Linfadenomegalia reativa, Linfoma, Metástase pélvica/perineal' },
      'ln_hepatico': { high: 'Linfadenomegalia reativa, Linfoma, Hepatite ativa' },
      'ln_esplenico': { high: 'Linfadenomegalia, Linfoma' },
      'ln_jejunal': { high: 'Linfadenite, Enteropatia, Linfoma' },
      'ln_mesenteric_cat': { high: 'Linfoma Alimentar Felino, IBD avançado' },
      'ln_shape_normal': { high: 'Perda do formato oval (altamente sugestivo de Linfoma / Malignidade)' },
      // Vascular General
      'aorta_vps': { high: 'Estenose aórtica, sobrecarga de volume', low: 'Baixo débito cardíaco, tromboembolismo' },
      'portal_velocity_mean': { low: 'Hipertensão portal, insuf. direita, trombose parcial', high: 'Shunt portossistêmico, inflamação hepática ativa' },
      'portal_diameter': { high: 'Congestão venosa hepática profunda / ICC direita', low: 'Hipovolemia profunda / Desidratação / Shunt' },
      'vcc_diameter': { high: 'Congestão profunda / Cor Pulmonale / Endocardiose Tricúspide', low: 'Choque hipovolêmico' }
    };

    if (fieldId && suspicions[fieldId]) {
      suspicion = isHigh ? (suspicions[fieldId].high || '') : (suspicions[fieldId].low || '');
    }
  }

  return { status, text, suspicion };
}

// --- MAIN COMPONENT ---

export default function VPVetApp() {
  const [patient, setPatient] = useState({ species: '', weight: '', age: '', gender: '' });
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [results, setResults] = useState<any[]>([]);

  const handlePatientChange = (e: any) => {
    setPatient({ ...patient, [e.target.id]: e.target.value });
    setResults([]);
  };

  const currentOrgans = organData[patient.species] || {};

  const analyze = () => {
    if (!patient.species) return;
    const newResults: any[] = [];
    const organs = organData[patient.species];
    Object.entries(organs).forEach(([key, organ]: [string, any]) => {
      // Filter by gender in logic too
      if (organ.gender && patient.gender && organ.gender !== patient.gender) return;

      const organResults: any[] = [];
      const processFields = (f: any[]) => f.forEach(field => {
        if (measurements[field.id]) {
          const val = parseFloat(measurements[field.id]);
          let ref = calculations[field.reference] ? calculations[field.reference](patient.weight, patient.age) : field.reference;
          organResults.push({ ...field, value: val, reference: ref, interpretation: interpretResult(val, ref, field.id) });
        }
      });
      if (organ.fields) processFields(organ.fields);
      if (organ.subsections) organ.subsections.forEach((s: any) => processFields(s.fields));
      if (organResults.length > 0) newResults.push({ name: organ.name, icon: organ.icon, items: organResults });
    });
    setResults(newResults);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center p-2 sm:p-4 lg:p-10 font-sans text-slate-900 printable-area relative overflow-x-hidden">
      {/* TOP-LEVEL PRINT HEADER (Logo + Patient Data) */}
      <div className="print-header hidden print:block w-full max-w-[1400px] mb-8 print:mb-2 border-b-2 print:border-b border-slate-100 pb-10 print:pb-2 relative">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-52">
            <h1 className="text-3xl print:text-xl font-black text-slate-800 uppercase tracking-tighter mb-8 print:mb-3 flex items-center gap-4">
              <ClipboardList className="w-8 h-8 print:w-5 print:h-5 text-emerald-500" /> Relatório Ultrassonográfico
            </h1>
            <div className="grid grid-cols-2 print:grid-cols-3 gap-x-12 print:gap-x-4 gap-y-4 print:gap-y-1.5 text-left text-xs print:text-[9px]">
              <div className="p-3 print:p-0 bg-slate-50/50 print:bg-transparent rounded-2xl border border-slate-100 print:border-none">
                <span className="font-black uppercase tracking-widest text-slate-400 block mb-1 print:mb-0 text-[9px] print:text-[8px]">CÓDIGO DE CONTROLE</span>
                <span className="font-bold text-slate-700 font-mono text-base print:text-xs">US-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</span>
              </div>
              <div className="p-3 print:p-0 bg-slate-50/50 print:bg-transparent rounded-2xl border border-slate-100 print:border-none">
                <span className="font-black uppercase tracking-widest text-slate-400 block mb-1 print:mb-0 text-[9px] print:text-[8px]">DATA DE EMISSÃO</span>
                <span className="font-bold text-slate-700 text-base print:text-xs">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="p-3 print:p-0 bg-slate-50/50 print:bg-transparent rounded-2xl border border-slate-100 print:border-none">
                <span className="font-black uppercase tracking-widest text-slate-400 block mb-1 print:mb-0 text-[9px] print:text-[8px]">ESPÉCIE DO PACIENTE</span>
                <span className="font-bold text-slate-700 uppercase text-base print:text-xs">{patient.species === 'canine' ? 'Canino' : patient.species === 'feline' ? 'Felino' : 'Coelho'}</span>
              </div>
              <div className="p-3 print:p-0 bg-slate-50/50 print:bg-transparent rounded-2xl border border-slate-100 print:border-none">
                <span className="font-black uppercase tracking-widest text-slate-400 block mb-1 print:mb-0 text-[9px] print:text-[8px]">SEXO / GÊNERO</span>
                <span className="font-bold text-slate-700 uppercase text-base print:text-xs">{patient.gender === 'male' ? 'Macho' : 'Fêmea'}</span>
              </div>
              <div className="p-3 print:p-0 bg-slate-50/50 print:bg-transparent rounded-2xl border border-slate-100 print:border-none">
                <span className="font-black uppercase tracking-widest text-slate-400 block mb-1 print:mb-0 text-[9px] print:text-[8px]">PESO ATUAL</span>
                <span className="font-bold text-slate-700 text-base print:text-xs">{patient.weight} kg</span>
              </div>
              <div className="p-3 print:p-0 bg-slate-50/50 print:bg-transparent rounded-2xl border border-slate-100 print:border-none">
                <span className="font-black uppercase tracking-widest text-slate-400 block mb-1 print:mb-0 text-[9px] print:text-[8px]">IDADE ESTIMADA</span>
                <span className="font-bold text-slate-700 text-base print:text-xs">{patient.age} anos</span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-48 h-48 flex-shrink-0 absolute top-0 -right-4 print:-top-10 print:-right-10 z-10">
          <img src="/assets/logo.png" alt="VPVet Logo" className="w-full h-full object-contain object-right-top" onError={(e) => { (e.target as HTMLImageElement).src = "https://vitalpaz.vet/wp-content/uploads/2023/07/cropped-Favicon-32x32.png" }} />
        </div>
      </div>

      {/* Main UI Container */}
      <div className="w-full max-w-[1400px] space-y-4 sm:space-y-6 flex-1">
        {/* Header Bar */}
        <header className="flex flex-col lg:flex-row justify-between items-center bg-white p-4 sm:p-4 sm:px-8 rounded-[24px] sm:rounded-3xl shadow-soft gap-4 lg:gap-0 no-print">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 relative flex-shrink-0">
              {/* Visual Placeholder for Logo - Instruction for User to replace src */}
              <img src="/assets/logo.png" alt="VPVet Logo" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "https://vitalpaz.vet/wp-content/uploads/2023/07/cropped-Favicon-32x32.png" }} />
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tighter uppercase flex flex-col sm:flex-row items-center gap-2">
                VPVET <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full tracking-wide">REFERÊNCIA US</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 sm:mt-0">Ferramenta de Diagnóstico Avançado</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-4 bg-slate-50 lg:bg-transparent p-3 lg:p-0 rounded-2xl w-full lg:w-auto">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl flex-shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="text-left lg:text-right">
              <p className="text-[11px] sm:text-xs font-black text-slate-800 uppercase tracking-tighter leading-tight">Vital Paz Vet</p>
              <p className="text-[8px] sm:text-[10px] font-bold text-emerald-600 leading-tight">UNIDADE DIAGNÓSTICA</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Form Area */}
          <div className="xl:col-span-8 space-y-6 no-print">
            {/* Patient Data Card */}
            <section className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] shadow-soft space-y-4 sm:space-y-6 border-b-4 sm:border-b-6 border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                  <div className="w-1 h-4 sm:h-5 bg-emerald-500 rounded-full" /> Dados do Paciente
                </h3>
                <button onClick={() => { setPatient({ species: '', weight: '', age: '', gender: '' }); setResults([]); setMeasurements({}); setSelectedOrgan(null); }} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all group">
                  <RefreshCcw className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:rotate-180 transition-all duration-700" />
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {['species', 'weight', 'age', 'gender'].map(field => (
                  <div key={field} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{field === 'species' ? 'Espécie' : field === 'weight' ? 'Peso (kg)' : field === 'age' ? 'Idade' : 'Sexo'}</label>
                    {field === 'species' || field === 'gender' ? (
                      <select id={field} onChange={handlePatientChange} value={(patient as any)[field]} className="w-full p-3 rounded-xl bg-slate-50 border-2 border-slate-50 focus:border-emerald-500 outline-none font-bold text-xs ring-4 ring-transparent focus:ring-emerald-50 transition-all">
                        <option value="">Selecionar</option>
                        {field === 'species' ? (<><option value="canine">Canino</option><option value="feline">Felino</option><option value="rabbit">Coelho</option></>) : (<><option value="male">Macho</option><option value="female">Fêmea</option></>)}
                      </select>
                    ) : (
                      <input type="number" id={field} step="0.1" value={(patient as any)[field]} onChange={handlePatientChange} className="w-full p-3 rounded-xl bg-slate-50 border-2 border-slate-50 focus:border-emerald-500 outline-none font-bold text-xs ring-4 ring-transparent focus:ring-emerald-50 transition-all" placeholder="0.0" />
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Organ Grid */}
            <section className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] shadow-soft space-y-4 sm:space-y-6 border-b-4 sm:border-b-6 border-slate-100">
              <h3 className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                <div className="w-1 h-4 sm:h-5 bg-emerald-500 rounded-full" /> Órgãos & Sistemas
              </h3>
              {!patient.species ? (
                <div className="py-12 text-center border-4 border-dashed border-slate-50 rounded-[28px] font-bold text-slate-300 uppercase tracking-[0.3em] flex flex-col items-center gap-3">
                  <SearchCheck className="w-10 h-10 opacity-10" />
                  <span className="text-[10px]">Aguardando Dados do Paciente</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {Object.entries(currentOrgans).map(([key, org]: [string, any]) => {
                    // Filtering by gender
                    if (org.gender && patient.gender && org.gender !== patient.gender) return null;

                    return (
                      <button key={key} onClick={() => setSelectedOrgan(key)} className={cn(
                        "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group relative overflow-hidden",
                        selectedOrgan === key ? "bg-emerald-500 border-emerald-500 shadow-xl shadow-emerald-100 scale-105" : "bg-white border-slate-50 hover:border-emerald-200"
                      )}>
                        <div className={cn("p-3 rounded-xl transition-all", selectedOrgan === key ? "bg-white/20 text-white" : "bg-slate-50 text-slate-400 group-hover:text-emerald-500")}>
                          {org.icon}
                        </div>
                        <span className={cn("text-[9px] font-black uppercase tracking-tighter", selectedOrgan === key ? "text-white" : "text-slate-600")}>{org.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Organ Analysis Form Area */}
              {selectedOrgan && (
                <div className="mt-2 sm:mt-4 p-4 sm:p-6 bg-emerald-50/50 rounded-[20px] sm:rounded-[32px] border-2 border-emerald-100/30 space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-emerald-800 text-[10px] sm:text-xs uppercase flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" /> Medições: {currentOrgans[selectedOrgan].name}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 sm:gap-6">
                    {(currentOrgans[selectedOrgan].fields || []).map((f: any) => (
                      <div key={f.id} className="space-y-1.5 sm:space-y-2">
                        <label className="text-[8px] sm:text-[9px] font-black text-emerald-700/60 uppercase tracking-widest">{f.label}</label>
                        <div className="relative">
                          <input type="number" step="0.01" value={measurements[f.id] || ''} onChange={(e) => setMeasurements({ ...measurements, [f.id]: e.target.value })} className="w-full p-3 sm:p-4 rounded-[16px] sm:rounded-[20px] bg-white border-2 border-emerald-100/50 focus:border-emerald-500 outline-none font-bold text-sm sm:text-base shadow-sm transition-all focus:shadow-emerald-100" placeholder="0.00" />
                          {f.unit && <span className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 font-black text-emerald-300 text-[9px] sm:text-[10px] uppercase">{f.unit}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Subsections if exist */}
                  {(currentOrgans[selectedOrgan].subsections || []).map((sub: any) => (
                    <div key={sub.name} className="space-y-3 sm:space-y-4 pt-4 border-t border-emerald-100/50">
                      <h5 className="text-[9px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest">{sub.name}</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
                        {sub.fields.map((f: any) => (
                          <div key={f.id} className="space-y-1.5 sm:space-y-2">
                            <label className="text-[8px] sm:text-[9px] font-black text-emerald-700/40 uppercase tracking-widest">{f.label}</label>
                            <div className="relative">
                              <input type="number" step="0.01" value={measurements[f.id] || ''} onChange={(e) => setMeasurements({ ...measurements, [f.id]: e.target.value })} className="w-full p-3 sm:p-4 rounded-[16px] sm:rounded-[20px] bg-white border-2 border-emerald-100/50 focus:border-emerald-500 outline-none font-bold text-sm sm:text-base shadow-sm transition-all focus:shadow-emerald-100" placeholder="0.00" />
                              {f.unit && <span className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 font-black text-emerald-200 text-[9px] sm:text-[10px] uppercase">{f.unit}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button onClick={analyze} className="w-full bg-emerald-500 text-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 text-xs sm:text-sm">
                    <Activity className="w-5 h-5" /> Consolidar Laudo
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Results Sidebar / Summary */}
          <div className="xl:col-span-4 space-y-4 sm:space-y-6">
            <section className={cn(
              "bg-white p-4 sm:p-6 print:p-0 rounded-[24px] sm:rounded-[32px] print:rounded-none shadow-lg print:shadow-none h-full min-h-[300px] sm:min-h-[500px] print:min-h-0 print:h-auto flex flex-col transition-all relative overflow-hidden ring-4 ring-transparent print:ring-0 print:border-none",
              results.length > 0 ? "ring-emerald-50" : "opacity-90"
            )}>
              <div className="flex items-center gap-3 border-b-2 border-slate-50 pb-3 mb-4 no-print">
                <div className="bg-slate-900 p-2.5 rounded-xl text-white">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-slate-800 uppercase tracking-tighter">Relatório Ultrassonográfico</h3>
              </div>

              {results.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-100 gap-6 py-20 print:py-0">
                  <SearchCheck className="w-16 h-16 opacity-10 no-print" />
                  <p className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-300 print:text-slate-800 print:text-[8px] print:text-left w-full">Nenhum resultado consolidado</p>
                </div>
              ) : (
                <div className="space-y-4 print:space-y-3 flex-1">
                  <div className="space-y-4 print:space-y-2">
                    {results.map((org, i) => (
                      <div key={i} className="space-y-3 print:space-y-1.5 animate-in slide-in-from-right duration-500">
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-[9px] print:text-[8px] uppercase tracking-widest bg-emerald-50/50 print:bg-transparent p-2 px-3 print:p-0 print:pb-1 rounded-xl print:rounded-none w-fit print:border-b-2 print:border-emerald-100 print:w-full">
                          {org.icon} <span>{org.name}</span>
                        </div>
                        {org.items.map((item: any, j: number) => (
                          <div key={j} className={cn(
                            "p-4 print:py-1 print:px-2 rounded-[24px] print:rounded-md border print:border-none print:border-b print:border-slate-50 transition-all space-y-3 print:space-y-0.5",
                            item.interpretation.status === 'danger' ? "bg-rose-50/50 border-rose-100 print:bg-rose-50/20" : item.interpretation.status === 'warning' ? "bg-amber-50/50 border-amber-100 print:bg-amber-50/20" : "bg-emerald-50/30 border-emerald-50 print:bg-emerald-50/10"
                          )}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-0">
                              <h5 className="text-[9px] print:text-[8px] font-black text-slate-400 print:text-slate-500 uppercase tracking-wide truncate max-w-[200px] print:max-w-none">{item.label}</h5>
                              <div className={cn(
                                "px-2.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest print:text-[6px] w-fit",
                                item.interpretation.status === 'danger' ? "bg-rose-500 text-white" : item.interpretation.status === 'warning' ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                              )}>
                                {item.interpretation.text}
                              </div>
                            </div>
                            <div className="flex items-baseline gap-1.5 pt-0.5">
                              <span className={cn("text-lg sm:text-xl print:text-sm font-black", item.interpretation.status === 'danger' ? "text-rose-900" : item.interpretation.status === 'warning' ? "text-amber-900" : "text-emerald-900")}>{item.value}</span>
                              <span className="text-[8px] sm:text-[9px] print:text-[7px] font-black text-slate-400 print:text-slate-500 uppercase">{item.unit}</span>
                            </div>
                            <div className="p-2 sm:p-2.5 print:p-0 bg-white/80 print:bg-transparent rounded-lg sm:rounded-xl print:rounded-none text-[7px] sm:text-[8px] print:text-[7px] font-bold text-slate-400 print:text-slate-500 flex flex-col sm:flex-row sm:flex-wrap justify-between items-start sm:items-center gap-1 sm:gap-2 mb-1 print:mb-0 print:pb-0.5">
                              <span className="tracking-widest uppercase opacity-60">REF:</span>
                              <span className="font-black sm:truncate w-full sm:w-auto text-left sm:text-right print:max-w-none opacity-80 break-all">{Array.isArray(item.reference) ? `${item.reference[0]} - ${item.reference[1]}` : item.reference === null ? 'N/A' : item.reference} {item.reference !== null ? item.unit : ''}</span>
                            </div>
                            {item.interpretation.suspicion && (
                              <div className={cn(
                                "px-3 py-2 print:p-0 print:pt-1 rounded-xl text-[9px] print:text-[7px] font-bold mt-2 print:mt-1",
                                item.interpretation.status === 'danger' ? "bg-rose-100/50 text-rose-800 print:bg-transparent print:text-rose-600" : "bg-amber-100/50 text-amber-800 print:bg-transparent print:text-amber-600"
                              )}>
                                <div className="flex items-start gap-1.5">
                                  <Info className="w-3 h-3 print:w-2 print:h-2 mt-0.5 print:mt-0 flex-shrink-0" />
                                  <span className="leading-tight">{item.interpretation.suspicion}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 space-y-3 no-print">
                    <button onClick={handlePrint} className="w-full bg-slate-900 text-white p-4 rounded-[24px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 text-xs">
                      <Printer className="w-4 h-4 text-emerald-400" /> Imprimir / PDF
                    </button>
                    <p className="text-[8px] text-center text-slate-400 uppercase tracking-widest font-bold">Clique para gerar versão pronta para impressão</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 space-y-3 opacity-60 no-print">
          <div className="flex items-center justify-center gap-3 text-slate-500 font-black text-[9px] uppercase tracking-widest">
            <Heart className="w-3 h-3 text-emerald-500 fill-emerald-500" />
            <span>Vital Paz Vet &copy; 2024</span>
          </div>
        </footer>
      </div>

      {/* TOP-LEVEL PRINT FOOTER (Signature + Company Info) */}
      <div className="print-footer hidden print:grid grid-cols-2 w-full max-w-[1400px] border-t-2 border-slate-100 print:border-slate-300 pt-8 print:pt-4 mt-auto pb-4">
        <div className="space-y-2 print:space-y-1">
          <p className="font-black text-slate-700 uppercase tracking-tight text-sm print:text-xs text-left">Vital Paz Vet Cardiologia e Ultrassonografia</p>
          <div className="text-[10px] print:text-[8px] space-y-1 print:space-y-0.5 text-slate-400 print:text-slate-500 font-bold uppercase tracking-wider text-left">
            <p>Gov. Valadares – MG</p>
            <p>CNPJ: 54.794.703/0001-68 Ltda</p>
            <p className="text-emerald-600 print:text-slate-600">https://vitalpaz.vet</p>
          </div>
        </div>
        <div className="text-right flex flex-col justify-end gap-1">
          <p className="italic text-[10px] print:text-[8px] text-slate-400 print:text-slate-500 font-bold mb-2 print:mb-1">Assinado Eletronicamente por,</p>
          <div className="h-0.5 bg-slate-200 print:bg-slate-300 w-48 print:w-32 ml-auto" />
          <p className="text-[9px] print:text-[7px] font-black text-slate-300 print:text-slate-400 uppercase tracking-[0.2em] mt-1">Identificação do Profissional</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body, .printable-area { background: white !important; padding: 1cm !important; color-adjust: exact; -webkit-print-color-adjust: exact; width: 100% !important; min-height: 100vh !important; display: flex !important; flex-direction: column !important; }
          .printable-area > .w-full { max-width: 100% !important; margin: 0 !important; flex: 1 !important; }
          .shadow-soft, .shadow-lg, .shadow-xl { box-shadow: none !important; }
          .rounded-3xl, .rounded-[32px], .rounded-[48px], .rounded-[24px] { border-radius: 8px !important; border: 1px solid #eee !important; box-shadow: none !important; }
          .print-header.print\\:block { display: block !important; }
          .print-footer.print\\:grid { display: grid !important; }
          .print-header .grid, .print-footer.grid { display: grid !important; }
          .grid:not(.print-header .grid):not(.print-footer .grid) { display: block !important; }
          .xl\\:col-span-12, .xl\\:col-span-8, .xl\\:col-span-4 { width: 100% !important; margin: 0 !important; border: none !important; }
          .ring-4 { ring: 0 !important; }
        }
      `}</style>
    </div>
  );
}
