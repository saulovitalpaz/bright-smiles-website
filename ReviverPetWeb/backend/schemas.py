from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Patients ---
class PatientBase(BaseModel):
    name: str
    species: Optional[str] = None
    breed: Optional[str] = None
    birth_date: Optional[str] = None
    sex: Optional[str] = None
    weight: Optional[float] = None
    tutor_name: Optional[str] = None
    phone: Optional[str] = None
    allergies: Optional[str] = None
    conditions: Optional[str] = None
    vaccines: Optional[str] = None
    photo_path: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Consultations ---
class ConsultationAttachmentBase(BaseModel):
    file_name: str
    file_path: str
    file_type: str

class ConsultationAttachmentCreate(ConsultationAttachmentBase):
    pass

class ConsultationAttachment(ConsultationAttachmentBase):
    id: int
    consultation_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ConsultationBase(BaseModel):
    date: str
    complaint: Optional[str] = None
    exam: Optional[str] = None
    diagnosis: Optional[str] = None
    conduct: Optional[str] = None
    prescription: Optional[str] = None

class ConsultationCreate(ConsultationBase):
    pass

class Consultation(ConsultationBase):
    id: int
    patient_id: int
    created_at: datetime
    attachments: List[ConsultationAttachment] = []
    model_config = ConfigDict(from_attributes=True)

# --- Fisiatria Sessions ---
class FisiatriaSessionBase(BaseModel):
    date: str
    pain_level: Optional[int] = None
    gait_analysis: Optional[Dict[str, Any]] = None
    goniometry_data: Optional[Dict[str, Any]] = None
    pain_map: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None

class FisiatriaSessionCreate(FisiatriaSessionBase):
    pass

class FisiatriaSession(FisiatriaSessionBase):
    id: int
    patient_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Treatments ---
class TreatmentBase(BaseModel):
    medication: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    route: Optional[str] = None
    observations: Optional[str] = None
    completed: Optional[bool] = False

class TreatmentCreate(TreatmentBase):
    pass

class Treatment(TreatmentBase):
    id: int
    patient_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Documents ---
class DocumentBase(BaseModel):
    name: str
    file_type: str
    file_path: str

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    patient_id: int
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Exam Metrics ---
class ExamMetricBase(BaseModel):
    metric_name: str
    value: float
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    date: str

class ExamMetricCreate(ExamMetricBase):
    pass

class ExamMetric(ExamMetricBase):
    id: int
    patient_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Aggregated Patient Model ---
class PatientWithDetails(Patient):
    consultations: List[Consultation] = []
    fisiatria: List[FisiatriaSession] = []
    treatments: List[Treatment] = []
    documents: List[Document] = []
    metrics: List[ExamMetric] = []
    model_config = ConfigDict(from_attributes=True)
