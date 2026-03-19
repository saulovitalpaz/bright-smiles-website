"use client";

import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  ChevronRight,
  ClipboardList,
  Droplets,
  Heart,
  Info,
  Navigation,
  RefreshCcw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  TestTube,
  Thermometer,
  User,
  SearchCheck,
  Printer
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- CLINICAL DATA ---

const calculations: any = {
  calcLVDdCanine: (w: any) => { const vn = Number(w); return vn ? [parseFloat(((1.17 * Math.pow(vn, 0.322)) * 10).toFixed(2)), parseFloat(((1.63 * Math.pow(vn, 0.322)) * 10).toFixed(2))] : null; },
  calcLVDsCanine: (w: any) => { const vn = Number(w); return vn ? [parseFloat(((0.70 * Math.pow(vn, 0.346)) * 10).toFixed(2)), parseFloat(((1.09 * Math.pow(vn, 0.346)) * 10).toFixed(2))] : null; },
  calcIVSdCanine: (w: any) => { const vn = Number(w); return vn ? [parseFloat(((0.27 * Math.pow(vn, 0.289)) * 10).toFixed(2)), parseFloat(((0.49 * Math.pow(vn, 0.289)) * 10).toFixed(2))] : null; },
  calcLVWdCanine: (w: any) => { const vn = Number(w); return vn ? [parseFloat(((0.30 * Math.pow(vn, 0.261)) * 10).toFixed(2)), parseFloat(((0.53 * Math.pow(vn, 0.261)) * 10).toFixed(2))] : null; },
  calcRVDdCanine: (w: any) => { const vn = Number(w); if(!vn) return null; const val = (0.41 * Math.pow(vn, 0.33)) * 10; return [parseFloat((val * 0.8).toFixed(2)), parseFloat((val * 1.2).toFixed(2))]; },
  calcTAPSECanine: (w: any) => { const vn = Number(w); if(!vn) return null; if(vn < 10) return [6.0, 999]; if(vn < 30) return [8.0, 999]; return [10.0, 999]; },
  calcDogPDuration: (w: any) => { const vn = Number(w); return !vn ? null : vn > 40 ? [0, 50] : [0, 40]; },
};

const organData: any = {
  canine: {
    ecg: {
      name: 'Eletrocardiograma (ECG)', icon: <Activity className="w-5 h-5" />,
      subsections: [
        { name: 'Onda P e Intervalo PR', fields: [
          { id: 'p_duration', label: 'Onda P (Duração)', unit: 'ms', reference: 'calcDogPDuration' },
          { id: 'p_amplitude', label: 'Onda P (Amplitude)', unit: 'mV', reference: [0, 0.4] },
          { id: 'pr_interval', label: 'Intervalo PR', unit: 'ms', reference: [60, 130] }
        ]},
        { name: 'Complexos QRS e Repolarização', fields: [
          { id: 'qrs_duration', label: 'QRS (Duração)', unit: 'ms', reference: [0, 60] },
          { id: 'qt_interval', label: 'Intervalo QT', unit: 'ms', reference: [150, 250] },
          { id: 'qrs_axis', label: 'Eixo Elétrico (MEA)', unit: 'graus', reference: [40, 100] }
        ]}
      ]
    },
    bp: {
      name: 'Pressão Arterial (PAS)', icon: <Activity className="w-5 h-5" />,
      fields: [
        { id: 'systolic_bp', label: 'PAS (Sistólica)', unit: 'mmHg', reference: [0, 139] },
        { id: 'diastolic_bp', label: 'PAD (Diastólica)', unit: 'mmHg', reference: [0, 89] }
      ]
    },
    echo_left: {
      name: 'ECO: Câmaras Esquerdas', icon: <Heart className="w-5 h-5" />,
      fields: [
        { id: 'la_ao', label: 'Relação AE/Ao (LA/Ao)', unit: '', reference: [0, 1.59] },
        { id: 'fac_ae', label: 'FAC Atrial Esq. (AE)', unit: '%', reference: [30, 999] },
        { id: 'lvdd', label: 'VE Diâm. Diástole (LVDd)', unit: 'mm', reference: 'calcLVDdCanine' },
        { id: 'lvds', label: 'VE Diâm. Sístole (LVDs)', unit: 'mm', reference: 'calcLVDsCanine' },
        { id: 'ivsd', label: 'Septo Intervent. Diástole (IVSd)', unit: 'mm', reference: 'calcIVSdCanine' },
        { id: 'lvwd', label: 'Parede Livre VE Diástole (LVWd)', unit: 'mm', reference: 'calcLVWdCanine' }
      ]
    },
    echo_systolic: {
      name: 'ECO: Função Sistólica', icon: <Activity className="w-5 h-5" />,
      fields: [
        { id: 'fs', label: 'Fração Encurtamento (FS)', unit: '%', reference: [25, 45] },
        { id: 'ef_teich', label: 'Fraç. Ejeção Teichholz (EF)', unit: '%', reference: [50, 100] },
        { id: 'ef_simp', label: 'Fraç. Ejeção Simpson (EF)', unit: '%', reference: [55, 100] },
        { id: 'mapse', label: 'MAPSE', unit: 'cm', reference: [1.0, 9.9] },
        { id: 'epss', label: 'Dist. E-Septo (EPSS)', unit: 'mm', reference: [0, 6.4] }
      ]
    },
    echo_right: {
      name: 'ECO: Câmaras Direitas', icon: <Heart className="w-5 h-5" />,
      fields: [
        { id: 'rvdd', label: 'VD Diâm. Diástole (RVDd)', unit: 'mm', reference: 'calcRVDdCanine' },
        { id: 'rvfwd', label: 'Parede Livre VD Diástole', unit: 'mm', reference: [0, 4.9] },
        { id: 'rvfac', label: 'FAC do VD', unit: '%', reference: [35, 100] },
        { id: 'tapse', label: 'TAPSE', unit: 'mm', reference: 'calcTAPSECanine' },
        { id: 's_wave_tdi', label: 'Onda S\' (TDI Tricúspide)', unit: 'cm/s', reference: [9.5, 999] }
      ]
    },
    echo_doppler: {
      name: 'ECO: Doppler e Fluxos', icon: <Activity className="w-5 h-5" />,
      subsections: [
        { name: 'Grandes Vasos', fields: [
          { id: 'aortic_vmax', label: 'Aórtico Vmáx', unit: 'm/s', reference: [0, 1.69] },
          { id: 'pulmonic_vmax', label: 'Pulmonar Vmáx', unit: 'm/s', reference: [0, 1.39] }
        ]},
        { name: 'Hipertensão Pulmonar', fields: [
          { id: 'ap_ao', label: 'Relação AP/Ao', unit: '', reference: [0.8, 1.2] },
          { id: 'tr_vmax', label: 'Vel. Regurg. Tricúspide (TR)', unit: 'm/s', reference: [0, 2.8] },
          { id: 'pr_vmax', label: 'Vel. Regurg. Pulmonar (PR)', unit: 'm/s', reference: [0, 2.2] },
          { id: 'at_et_ratio', label: 'Relação AT/ET Pulmonar', unit: '', reference: [0.3, 1.0] }
        ]},
        { name: 'Fluxo Mitral / Diastologia', fields: [
          { id: 'mitral_e', label: 'Onda E', unit: 'm/s', reference: [0.6, 1.0] },
          { id: 'mitral_a', label: 'Onda A', unit: 'm/s', reference: [0.4, 0.7] },
          { id: 'mitral_e_a', label: 'Relação E/A', unit: '', reference: [1.0, 2.0] },
          { id: 'e_wave_tdi', label: 'Onda e\' (TDI Mitral)', unit: 'cm/s', reference: [8.0, 999] },
          { id: 'e_e_ratio', label: 'Relação E/e\'', unit: '', reference: [0, 8.0] },
          { id: 'td_e', label: 'Tempo Desaceleração (TD)', unit: 'ms', reference: [60, 100] },
          { id: 'triv', label: 'Tempo Relax. Isovol. (TRIV)', unit: 'ms', reference: [40, 75] },
          { id: 'sd_ratio_pv', label: 'Fluxo Venoso Pulm. S/D', unit: '', reference: [1.0, 9.0] }
        ]}
      ]
    }
  },
  feline: {
    ecg: {
      name: 'Eletrocardiograma (ECG)', icon: <Activity className="w-5 h-5" />,
      subsections: [
        { name: 'Onda P e Intervalo PR', fields: [
          { id: 'p_duration', label: 'Onda P (Duração)', unit: 'ms', reference: [0, 39] },
          { id: 'p_amplitude', label: 'Onda P (Amplitude)', unit: 'mV', reference: [0, 0.2] },
          { id: 'pr_interval', label: 'Intervalo PR', unit: 'ms', reference: [50, 90] }
        ]},
        { name: 'Complexos QRS e Repolarização', fields: [
          { id: 'qrs_duration', label: 'QRS (Duração)', unit: 'ms', reference: [0, 40] },
          { id: 'qt_interval', label: 'Intervalo QT', unit: 'ms', reference: [120, 180] },
          { id: 'qrs_axis', label: 'Eixo Elétrico (MEA)', unit: 'graus', reference: [0, 160] }
        ]}
      ]
    },
    bp: {
      name: 'Pressão Arterial (PAS)', icon: <Activity className="w-5 h-5" />,
      fields: [
        { id: 'systolic_bp', label: 'PAS (Sistólica)', unit: 'mmHg', reference: [0, 139] },
        { id: 'diastolic_bp', label: 'PAD (Diastólica)', unit: 'mmHg', reference: [0, 89] }
      ]
    },
    echo_left: {
      name: 'ECO: Câmaras Esquerdas', icon: <Heart className="w-5 h-5" />,
      fields: [
        { id: 'la_ao', label: 'Relação AE/Ao (LA/Ao)', unit: '', reference: [0, 1.49] },
        { id: 'fac_ae', label: 'FAC Atrial Esq. (AE)', unit: '%', reference: [30, 999] },
        { id: 'lvdd', label: 'VE Diâm. Diástole (LVDd)', unit: 'mm', reference: [13.0, 18.9] },
        { id: 'lvds', label: 'VE Diâm. Sístole (LVDs)', unit: 'mm', reference: [7.4, 11.4] },
        { id: 'ivsd', label: 'Septo Intervent. Diástole (IVSd)', unit: 'mm', reference: [2.7, 5.7] },
        { id: 'lvwd', label: 'Parede Livre VE Diástole (LVWd)', unit: 'mm', reference: [2.3, 5.7] }
      ]
    },
    echo_systolic: {
      name: 'ECO: Função Sistólica', icon: <Activity className="w-5 h-5" />,
      fields: [
        { id: 'fs', label: 'Fração Encurtamento (FS)', unit: '%', reference: [30, 55] },
        { id: 'ef_teich', label: 'Fraç. Ejeção Teichholz (EF)', unit: '%', reference: [60, 100] },
        { id: 'ef_simp', label: 'Fraç. Ejeção Simpson (EF)', unit: '%', reference: [60, 100] },
        { id: 'mapse', label: 'MAPSE', unit: 'cm', reference: [0.8, 9.9] },
        { id: 'epss', label: 'Dist. E-Septo (EPSS)', unit: 'mm', reference: [0, 3.9] }
      ]
    },
    echo_right: {
      name: 'ECO: Câmaras Direitas', icon: <Heart className="w-5 h-5" />,
      fields: [
        { id: 'rvdd', label: 'VD Diâm. Diástole (RVDd)', unit: 'mm', reference: [4.0, 9.0] },
        { id: 'rvfwd', label: 'Parede Livre VD Diástole', unit: 'mm', reference: [0, 3.9] },
        { id: 'rvfac', label: 'FAC do VD', unit: '%', reference: [35, 100] },
        { id: 'tapse', label: 'TAPSE', unit: 'mm', reference: [5.0, 999] },
        { id: 's_wave_tdi', label: 'Onda S\' (TDI Tricúspide)', unit: 'cm/s', reference: [10.0, 999] }
      ]
    },
    echo_doppler: {
      name: 'ECO: Doppler e Fluxos', icon: <Activity className="w-5 h-5" />,
      subsections: [
        { name: 'Grandes Vasos', fields: [
          { id: 'aortic_vmax', label: 'Aórtico Vmáx', unit: 'm/s', reference: [0, 1.69] },
          { id: 'pulmonic_vmax', label: 'Pulmonar Vmáx', unit: 'm/s', reference: [0, 1.59] }
        ]},
        { name: 'Hipertensão Pulmonar', fields: [
          { id: 'ap_ao', label: 'Relação AP/Ao', unit: '', reference: [0.9, 1.1] },
          { id: 'tr_vmax', label: 'Vel. Regurg. Tricúspide (TR)', unit: 'm/s', reference: [0, 2.8] },
          { id: 'pr_vmax', label: 'Vel. Regurg. Pulmonar (PR)', unit: 'm/s', reference: [0, 2.2] },
          { id: 'at_et_ratio', label: 'Relação AT/ET Pulmonar', unit: '', reference: [0.3, 1.0] }
        ]},
        { name: 'Fluxo Mitral / Diastologia', fields: [
          { id: 'mitral_e', label: 'Onda E', unit: 'm/s', reference: [0.5, 0.9] },
          { id: 'mitral_a', label: 'Onda A', unit: 'm/s', reference: [0.4, 0.7] },
          { id: 'mitral_e_a', label: 'Relação E/A', unit: '', reference: [1.0, 1.8] },
          { id: 'e_wave_tdi', label: 'Onda e\' (TDI Mitral)', unit: 'cm/s', reference: [9.0, 999] },
          { id: 'e_e_ratio', label: 'Relação E/e\'', unit: '', reference: [0, 9.0] },
          { id: 'td_e', label: 'Tempo Desaceleração (TD)', unit: 'ms', reference: [50, 90] },
          { id: 'triv', label: 'Tempo Relax. Isovol. (TRIV)', unit: 'ms', reference: [35, 60] },
          { id: 'sd_ratio_pv', label: 'Fluxo Venoso Pulm. S/D', unit: '', reference: [1.0, 9.0] }
        ]}
      ]
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
      // BP
      'systolic_bp': { high: 'Possível Lesão em Órgão Alvo (TOD). Se >=160 Monitorar, Se >=180 Tratar Imediatamente.', low: 'Hipotensão' },
      'diastolic_bp': { high: 'Hipertensão Diastólica', low: 'Choque / Vasodilatação severa' },
      
      // ECHO - Fibrillation / Enlargement / Volumes
      'la_ao': { high: 'Dilatação Atrial Esq. (Risco Edema/ICC, Doença de Válvula Mitral)' },
      'lvdd': { high: 'Sobrecarga de volume (IM, Shunt) / Cardiomiopatia Dilatada (CMD)', low: 'Hipovolemia / Cardiomiopatia Restritiva' },
      'lvds': { high: 'Disfunção Sistólica (CMD) / Baixa contratilidade', low: 'Hipercontratilidade / Sobrecarga compensada' },
      'ivsd': { high: 'Hipertrofia Septal (CMH, Estenose Aórtica, Hipertensão)' },
      'lvwd': { high: 'Hipertrofia Concêntrica (Avaliar CMH em gatos, Hipertensão)' },
      'rvdd': { high: 'Sobrecarga de volume VD (Insuf. Tricúspide, Cor Pulmonale, Shunt)' },
      'rvfwd': { high: 'Hipertrofia VD (Hipertensão Pulmonar, Estenose Pulmonar)' },
      
      // ECHO - Systolic Function
      'fs': { high: 'Hipercontratilidade Miocárdica compensatória', low: 'Disfunção Sistólica miocárdica' },
      'ef_teich': { high: 'Hipercontratilidade compensatória', low: 'Disfunção Sistólica' },
      'ef_simp': { low: 'Disfunção Sistólica (VE) - Padrão Ouro' },
      'mapse': { low: 'Disfunção Sistólica Longitudinal do VE' },
      'epss': { high: 'Dilatação do VE ou Baixa Contratilidade Severa' },
      'tapse': { low: 'Disfunção Sistólica do Ventrículo Direito' },
      'rvfac': { low: 'Disfunção Sistólica do VD' },
      's_wave_tdi': { low: 'Disfunção Radial Sistólica do VD' },
      'fac_ae': { low: 'Baixa contratilidade Atrial esquerda (Risco Fibrilação)' },
      
      // ECHO - Doppler
      'aortic_vmax': { high: 'Estenose Aórtica / Hipercontratilidade dinâmina', low: 'Baixo débito cardíaco' },
      'pulmonic_vmax': { high: 'Estenose Pulmonar', low: 'Baixo débito cardíaco' },
      'ap_ao': { high: 'Hipertensão Pulmonar / Shunt D-E' },
      'tr_vmax': { high: 'Sugere Hipertensão Pulmonar (Alta probabilidade se > 3.4 m/s)' },
      'pr_vmax': { high: 'Probabilidade de Hipertensão Pulmonar / Insuf. Pulmonar' },
      'at_et_ratio': { low: 'Perfil hemodinâmico indicativo de Hipertensão Pulmonar' },
      
      // ECHO - Diastology
      'mitral_e': { high: 'Padrão Restritivo / Pseudonormal (Pressão AE alta)', low: 'Alteração do Relaxamento (Disf. Diastólica)' },
      'mitral_a': { high: 'Alteração do Relaxamento (Contribuição atrial exacerbada)' },
      'mitral_e_a': { high: 'Padrão Restritivo (>2.0) - Pressão Ench. Elevada', low: 'Alteração de Relaxamento (<1.0)' },
      'e_wave_tdi': { low: 'Velocidade de relaxamento diastólico reduzida' },
      'e_e_ratio': { high: 'Pressão de Enchimento do VE Elevada (Disfunção Diastólica severa)' },
      'td_e': { high: 'Alteração do Relaxamento (Enchimento lento)', low: 'Padrão Restritivo (Pressão AE alta)' },
      'triv': { high: 'Alteração do Relaxamento (Demora a abrir valva)', low: 'Padrão Restritivo (Abre valva rápido pela Pressão AE)' },
      'sd_ratio_pv': { low: 'Pressão Atrial Esquerda Elevada / Padrão Restritivo' },
      
      // ECG
      'p_duration': { high: 'Aumento Atrial Esquerdo (P Mitrale)' },
      'p_amplitude': { high: 'Aumento Atrial Direito (P Pulmonale)' },
      'pr_interval': { high: 'Bloqueio AV de 1º Grau / Retardo da condução nodal' },
      'qrs_duration': { high: 'Distúrbio de condução intraventricular ou cardiomegalia global' },
      'qt_interval': { high: 'Risco de arritmias (Hipocalcemia / Hipocalemia)', low: 'Encurtamento (Hipercalcemia / Digital)' },
      'qrs_axis': { high: 'Desvio para Direita (Aumento VD / Bloqueio Fascicular Post. Esq.)', low: 'Desvio para Esquerda (Aumento VE / Bloq. Ramo Esq.)' }
    };

    if (fieldId && suspicions[fieldId]) {
      suspicion = isHigh ? (suspicions[fieldId].high || '') : (suspicions[fieldId].low || '');
    }
  }

  return { status, text, suspicion };
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch (error) {
      console.warn(error);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(error);
    }
  };

  return [isMounted ? storedValue : initialValue, setValue] as const;
}

// --- MAIN COMPONENT ---

export default function VPVetApp() {
  const [patient, setPatient] = useLocalStorage('vpvet_cardio_patient', { species: '', weight: '', age: '', gender: '' });
  const [selectedOrgan, setSelectedOrgan] = useLocalStorage<string | null>('vpvet_cardio_organ', null);
  const [measurements, setMeasurements] = useLocalStorage<Record<string, string>>('vpvet_cardio_measurements', {});
  const [results, setResults] = useState<any[]>([]);

  // Function to clear local storage and current view
  const handleClear = () => {
    setPatient({ species: '', weight: '', age: '', gender: '' });
    setSelectedOrgan(null);
    setMeasurements({});
    setResults([]);
  };

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
              <ClipboardList className="w-8 h-8 print:w-5 print:h-5 text-emerald-500" /> Relatório Cardiológico
            </h1>
            <div className="grid grid-cols-2 print:grid-cols-3 gap-x-12 print:gap-x-4 gap-y-4 print:gap-y-1.5 text-left text-xs print:text-[9px]">
              <div className="p-3 print:p-0 bg-slate-50/50 print:bg-transparent rounded-2xl border border-slate-100 print:border-none">
                <span className="font-black uppercase tracking-widest text-slate-400 block mb-1 print:mb-0 text-[9px] print:text-[8px]">CÓDIGO DE CONTROLE</span>
                <span className="font-bold text-slate-700 font-mono text-base print:text-xs">CARDIO-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</span>
              </div>
              <div className="p-3 print:p-0 bg-slate-50/50 print:bg-transparent rounded-2xl border border-slate-100 print:border-none">
                <span className="font-black uppercase tracking-widest text-slate-400 block mb-1 print:mb-0 text-[9px] print:text-[8px]">DATA DE EMISSÃO</span>
                <span className="font-bold text-slate-700 text-base print:text-xs">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="p-3 print:p-0 bg-slate-50/50 print:bg-transparent rounded-2xl border border-slate-100 print:border-none">
                <span className="font-black uppercase tracking-widest text-slate-400 block mb-1 print:mb-0 text-[9px] print:text-[8px]">ESPÉCIE DO PACIENTE</span>
                <span className="font-bold text-slate-700 uppercase text-base print:text-xs">{patient.species === 'canine' ? 'Canino' : patient.species === 'feline' ? 'Felino' : 'Indefinido'}</span>
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
                VPVET <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full tracking-wide">CARDIOLOGIA</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 sm:mt-0">Referência Avançada: ECG, ECO & Pressão</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-4 bg-slate-50 lg:bg-transparent p-3 lg:p-0 rounded-2xl w-full lg:w-auto">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl flex-shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="text-left lg:text-right">
              <p className="text-[11px] sm:text-xs font-black text-slate-800 uppercase tracking-tighter leading-tight">Vital Paz Vet</p>
              <p className="text-[8px] sm:text-[10px] font-bold text-emerald-600 leading-tight">UNIDADE CARDIOLÓGICA</p>
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
                <button onClick={handleClear} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all group" title="Limpar Laudo e Reiniciar">
                  <RefreshCcw className="w-4 h-4 text-slate-300 group-hover:text-rose-500 group-hover:rotate-180 transition-all duration-700" />
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {['species', 'weight', 'age', 'gender'].map(field => (
                  <div key={field} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{field === 'species' ? 'Espécie' : field === 'weight' ? 'Peso (kg)' : field === 'age' ? 'Idade' : 'Sexo'}</label>
                    {field === 'species' || field === 'gender' ? (
                      <select id={field} onChange={handlePatientChange} value={(patient as any)[field]} className="w-full p-3 rounded-xl bg-slate-50 border-2 border-slate-50 focus:border-emerald-500 outline-none font-bold text-xs ring-4 ring-transparent focus:ring-emerald-50 transition-all">
                        <option value="">Selecionar</option>
                        {field === 'species' ? (<><option value="canine">Canino</option><option value="feline">Felino</option></>) : (<><option value="male">Macho</option><option value="female">Fêmea</option></>)}
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
                <div className="w-1 h-4 sm:h-5 bg-emerald-500 rounded-full" /> Módulos de Avaliação
              </h3>
              {!patient.species ? (
                <div className="py-12 text-center border-4 border-dashed border-slate-50 rounded-[28px] font-bold text-slate-300 uppercase tracking-[0.3em] flex flex-col items-center gap-3">
                  <SearchCheck className="w-10 h-10 opacity-10" />
                  <span className="text-[10px]">Aguardando Dados do Paciente</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                        <span className={cn("text-[9px] font-black uppercase tracking-tight text-center", selectedOrgan === key ? "text-white" : "text-slate-600")}>{org.name}</span>
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
                      <Activity className="w-4 h-4 text-emerald-500" /> Parâmetros: {currentOrgans[selectedOrgan].name}
                    </h4>
                  </div>
                  
                  {(() => {
                    const renderField = (f: any) => {
                      const val = measurements[f.id] ? parseFloat(measurements[f.id]) : NaN;
                      const ref = calculations[f.reference] ? calculations[f.reference](patient.weight, patient.age) : f.reference;
                      const interp = interpretResult(val, ref, f.id);
                      const isFilled = !isNaN(val);

                      let bgClass = "bg-white border-emerald-100/50 focus:border-emerald-500 text-slate-800";
                      if (isFilled && interp.status === 'danger') bgClass = "bg-rose-50 border-rose-400 focus:border-rose-500 text-rose-900 shadow-rose-100";
                      else if (isFilled && interp.status === 'warning') bgClass = "bg-amber-50 border-amber-400 focus:border-amber-500 text-amber-900 shadow-amber-100";
                      else if (isFilled && interp.status === 'normal') bgClass = "bg-emerald-50 border-emerald-400 focus:border-emerald-500 text-emerald-900 shadow-emerald-100";

                      return (
                        <div key={f.id} className="space-y-1 sm:space-y-1.5 relative mb-4 sm:mb-5">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{f.label}</label>
                          <div className="relative">
                            <input type="number" step="0.01" value={measurements[f.id] || ''} onChange={(e) => setMeasurements({ ...measurements, [f.id]: e.target.value })} className={cn("w-full p-2.5 sm:p-3 rounded-xl border-2 outline-none font-bold text-sm sm:text-base shadow-sm transition-all", bgClass)} placeholder="0.00" />
                            {f.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-slate-300 pointer-events-none text-[9px] sm:text-[10px] uppercase bg-white/70 px-1 rounded">{f.unit}</span>}
                          </div>
                          {patient.weight && ref !== null && (
                            <div className="absolute -bottom-4 right-0 left-0 flex justify-between text-[8px] sm:text-[9px] font-bold mt-1 px-1">
                               <span className="text-slate-400 opacity-90">Ref: {Array.isArray(ref) ? `${ref[0]} - ${ref[1]}` : ref} {ref !== null ? f.unit : ''}</span>
                               {isFilled && interp.status !== 'normal' && (
                                 <span className={interp.status === 'danger' ? 'text-rose-600' : 'text-amber-600'}>{interp.text}</span>
                               )}
                            </div>
                          )}
                        </div>
                      );
                    };

                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-4 gap-y-2 sm:gap-x-6">
                          {(currentOrgans[selectedOrgan].fields || []).map(renderField)}
                        </div>

                        {/* Subsections if exist */}
                        {(currentOrgans[selectedOrgan].subsections || []).map((sub: any) => (
                          <div key={sub.name} className="space-y-3 sm:space-y-4 pt-4 border-t border-emerald-100/50">
                            <h5 className="text-[10px] sm:text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100/30 w-fit px-2 py-1 rounded-md">{sub.name}</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-4 gap-y-2 sm:gap-x-6">
                              {sub.fields.map(renderField)}
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  })()}

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
                <h3 className="font-black text-base text-slate-800 uppercase tracking-tighter">Resumo Clínico</h3>
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
