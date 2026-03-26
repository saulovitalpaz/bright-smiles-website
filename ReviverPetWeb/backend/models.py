from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    species = Column(String)
    breed = Column(String)
    birth_date = Column(String) # Storing as String for simplicity (DD/MM/YYYY)
    sex = Column(String)
    weight = Column(Float)
    tutor_name = Column(String)
    phone = Column(String)
    allergies = Column(Text)
    conditions = Column(Text)
    vaccines = Column(Text)
    photo_path = Column(String) # Path to saved image
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    consultations = relationship("Consultation", back_populates="patient", cascade="all, delete-orphan")
    fisiatria = relationship("FisiatriaSession", back_populates="patient", cascade="all, delete-orphan")
    treatments = relationship("Treatment", back_populates="patient", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="patient", cascade="all, delete-orphan")
    metrics = relationship("ExamMetric", back_populates="patient", cascade="all, delete-orphan")

class ExamMetric(Base):
    __tablename__ = "exam_metrics"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    metric_name = Column(String, index=True) # e.g. "Ureia", "Creatinina", "Peso"
    value = Column(Float)
    unit = Column(String) # e.g. "mg/dL", "kg"
    reference_range = Column(String, nullable=True) # e.g. "15 - 40"
    date = Column(String) # DD/MM/YYYY
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="metrics")

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    date = Column(String) # DD/MM/YYYY
    complaint = Column(Text)
    exam = Column(Text)
    diagnosis = Column(Text)
    conduct = Column(Text)
    prescription = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="consultations")
    attachments = relationship("ConsultationAttachment", back_populates="consultation", cascade="all, delete-orphan")

class ConsultationAttachment(Base):
    __tablename__ = "consultation_attachments"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"))
    file_name = Column(String)
    file_path = Column(String)
    file_type = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    consultation = relationship("Consultation", back_populates="attachments")

class FisiatriaSession(Base):
    __tablename__ = "fisiatria_sessions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    date = Column(String) # DD/MM/YYYY
    pain_level = Column(Integer) # 0-5
    gait_analysis = Column(JSON) # e.g. {"claudicacao1": true, "arrasta": false}
    goniometry_data = Column(JSON) # Full object with all joints flex/ext
    pain_map = Column(JSON) # Coordinates for anatomical markings
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="fisiatria")

class Treatment(Base):
    __tablename__ = "treatments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    medication = Column(String)
    dosage = Column(String)
    frequency = Column(String)
    duration = Column(String)
    route = Column(String)
    observations = Column(Text)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="treatments")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    name = Column(String)
    file_type = Column(String) # e.g. "application/pdf"
    file_path = Column(String) # Absolute or relative path to the saved file
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="documents")
