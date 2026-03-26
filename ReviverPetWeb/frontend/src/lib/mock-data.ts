export interface Patient {
  id: number;
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  tutorName: string;
  phone: string;
  conditions: string;
  photo?: string;
}

export interface ConsultationAttachment {
  id: number;
  consultation_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

export interface Consultation {
  id: number;
  patientId: number;
  date: string;
  painLevel?: number;
  complaint?: string;
  anamnesis?: string;
  inspection?: string;
  procedures?: string[];
  exam?: string;
  diagnosis?: string;
  conduct?: string;
  attachments?: ConsultationAttachment[];
}

export interface Treatment {
  id: number;
  patientId: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  completed?: boolean;
}

export interface Document {
  id: number;
  patientId: number;
  name: string;
  type: string;
  uploadedAt: string;
}

export interface ExamMetric {
  id: number;
  patient_id: number;
  metric_name: string;
  value: number;
  unit?: string;
  date: string;
  created_at: string;
}

export const mockPatients: Patient[] = [
  {
    id: 1,
    name: "Rex",
    species: "Cão",
    breed: "Golden Retriever",
    birthDate: "15/03/2019",
    tutorName: "Maria Silva",
    phone: "(33) 99999-0001",
    conditions: "Displasia coxofemoral bilateral",
  },
  {
    id: 2,
    name: "Mimi",
    species: "Gato",
    breed: "Persa",
    birthDate: "22/07/2020",
    tutorName: "João Santos",
    phone: "(33) 99999-0002",
    conditions: "Alergia alimentar a frango",
  },
  {
    id: 3,
    name: "Thor",
    species: "Cão",
    breed: "Pastor Alemão",
    birthDate: "10/01/2018",
    tutorName: "Ana Costa",
    phone: "(33) 99999-0003",
    conditions: "Artrose cervical",
  },
  {
    id: 4,
    name: "Luna",
    species: "Gato",
    breed: "Siamês",
    birthDate: "05/11/2021",
    tutorName: "Carlos Mendes",
    phone: "(33) 99999-0004",
    conditions: "",
  },
];

export const mockConsultations: Consultation[] = [
  {
    id: 1,
    patientId: 1,
    date: "01/02/2026",
    painLevel: 4,
    complaint: "Dificuldade para levantar",
    anamnesis: "Paciente apresenta dificuldade ao deitar e levantar. Claudicação após exercícios intensos.",
    inspection: "Hipotrofia muscular em membros pálvicos. Dor à palpação da articulação coxofemoral.",
    procedures: ["Laserterapia", "Magnetoterapia", "Acupuntura"],
    exam: "Rx quadril",
    diagnosis: "Displasia grau III",
    conduct: "Fisioterapia 2x/semana + Meloxicam 0.1mg/kg",
  },
  {
    id: 2,
    patientId: 1,
    date: "08/02/2026",
    painLevel: 3,
    complaint: "Dificuldade para levantar",
    anamnesis: "Leve melhora ao caminhar, ainda com dor nas transições.",
    inspection: "Tônus muscular mantido.",
    procedures: ["Laserterapia", "Cinesioterapia"],
    diagnosis: "Evolução positiva",
    conduct: "Manter tratamento de Fisiatria",
  },
  {
    id: 3,
    patientId: 1,
    date: "15/02/2026",
    painLevel: 3,
    complaint: "Revisão mensal",
    exam: "Exame clínico geral",
    diagnosis: "Estável",
    conduct: "Manter protocolo atual",
    procedures: ["Acupuntura"],
  },
  {
    id: 4,
    patientId: 1,
    date: "28/02/2026",
    painLevel: 1,
    complaint: "Evolução do tratamento de Fisiatria",
    anamnesis: "Animal já corre e pula sem apresentar queixa aparente de dor aguda.",
    procedures: ["Cinesioterapia", "Laserterapia", "Goniometria"],
    diagnosis: "Controle da dor bem-sucedido",
    conduct: "Alta temporária, avaliação mensal",
  },
  { id: 5, patientId: 2, date: "20/02/2026", complaint: "Prurido intenso", exam: "Raspado cutâneo", diagnosis: "Dermatite alérgica", conduct: "Prednisolona 1mg/kg por 5 dias" },
  { id: 6, patientId: 3, date: "05/02/2026", painLevel: 5, complaint: "Claudicação MPE aguda", procedures: ["Eletroterapia", "Acupuntura"] },
  { id: 7, patientId: 3, date: "19/02/2026", painLevel: 3, complaint: "Retorno da acupuntura", procedures: ["Acupuntura", "Laserterapia"] },
  { id: 8, patientId: 3, date: "01/03/2026", painLevel: 2, complaint: "Claudicação MPE", exam: "Rx coluna cervical", diagnosis: "Espondilose C5-C6", conduct: "Acupuntura + Laserterapia", procedures: ["Acupuntura"] },
];

export const mockTreatments: Treatment[] = [
  { id: 1, patientId: 1, medication: "Meloxicam", dosage: "0.1mg/kg", frequency: "1x ao dia", duration: "15 dias" },
  { id: 2, patientId: 1, medication: "Condroitina", dosage: "500mg", frequency: "1x ao dia", duration: "90 dias" },
  { id: 3, patientId: 2, medication: "Prednisolona", dosage: "1mg/kg", frequency: "1x ao dia", duration: "5 dias" },
  { id: 4, patientId: 3, medication: "Tramadol", dosage: "3mg/kg", frequency: "2x ao dia", duration: "7 dias" },
];

export const mockDocuments: Document[] = [
  { id: 1, patientId: 1, name: "Raio-X Quadril - Fev 2026.pdf", type: "pdf", uploadedAt: "28/02/2026" },
  { id: 2, patientId: 1, name: "Hemograma Completo.pdf", type: "pdf", uploadedAt: "15/02/2026" },
  { id: 3, patientId: 2, name: "Resultado Raspado Cutâneo.pdf", type: "pdf", uploadedAt: "20/02/2026" },
  { id: 4, patientId: 3, name: "Rx Coluna Cervical.pdf", type: "pdf", uploadedAt: "01/03/2026" },
];
