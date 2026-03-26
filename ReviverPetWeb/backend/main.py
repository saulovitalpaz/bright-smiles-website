from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, database, schemas
from database import engine, get_db
import os
import shutil

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ReviverPet API", description="Sistema de Prontuário Veterinário")

# Enable CORS (useful if frontend ever detaches from backend serving)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup directories (Dynamic paths for portability)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.getenv("DATA_DIR", BASE_DIR)
DOCUMENTS_BASE = os.path.join(DATA_DIR, "exames")
frontend_dir = os.path.join(BASE_DIR, "frontend", "dist")

os.makedirs(DOCUMENTS_BASE, exist_ok=True)

# ... PATIENTS, CONSULTATIONS, FISIATRIA, TREATMENTS (omitted for brevity) ...


# --- PATIENTS ENDPOINTS ---

@app.get("/api/patients/", response_model=list[schemas.Patient])
def read_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    patients = db.query(models.Patient).offset(skip).limit(limit).all()
    return patients

@app.get("/api/patients/{patient_id}", response_model=schemas.PatientWithDetails)
def read_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.post("/api/patients/", response_model=schemas.Patient)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    db_patient = models.Patient(**patient.dict())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.put("/api/patients/{patient_id}", response_model=schemas.Patient)
def update_patient(patient_id: int, patient_update: schemas.PatientCreate, db: Session = Depends(get_db)):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_patient, key, value)
        
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.delete("/api/patients/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(db_patient)
    db.commit()
    return {"ok": True}

# --- PATIENT PHOTO ENDPOINTS ---

@app.post("/api/patients/{patient_id}/photo/")
async def upload_patient_photo(patient_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_dir = os.path.join(DOCUMENTS_BASE, str(patient_id))
    os.makedirs(patient_dir, exist_ok=True)
    
    file_location = os.path.join(patient_dir, f"foto_perfil_{file.filename}")
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    db_patient.photo_path = file_location
    db.commit()
    db.refresh(db_patient)
    return {"message": "Photo uploaded successfully", "photo_path": file_location}

@app.get("/api/patients/{patient_id}/photo")
def get_patient_photo(patient_id: int, db: Session = Depends(get_db)):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not db_patient or not db_patient.photo_path or not os.path.exists(db_patient.photo_path):
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(db_patient.photo_path)

# --- CONSULTATIONS ENDPOINTS ---

@app.post("/api/patients/{patient_id}/consultations/", response_model=schemas.Consultation)
def create_consultation(patient_id: int, consultation: schemas.ConsultationCreate, db: Session = Depends(get_db)):
    db_consultation = models.Consultation(**consultation.dict(), patient_id=patient_id)
    db.add(db_consultation)
    db.commit()
    db.refresh(db_consultation)
    return db_consultation

@app.get("/api/patients/{patient_id}/consultations/", response_model=list[schemas.Consultation])
def read_consultations(patient_id: int, db: Session = Depends(get_db)):
    consultations = db.query(models.Consultation).filter(models.Consultation.patient_id == patient_id).all()
    return consultations

@app.post("/api/consultations/{consultation_id}/attachments/", response_model=schemas.ConsultationAttachment)
async def upload_consultation_attachment(consultation_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_consultation = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
    if not db_consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    # Save inside patient's folder -> consultations subfolder
    patient_id = db_consultation.patient_id
    consultation_dir = os.path.join(DOCUMENTS_BASE, str(patient_id), "consultas", str(consultation_id))
    os.makedirs(consultation_dir, exist_ok=True)
    
    file_location = os.path.join(consultation_dir, file.filename)
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    att_data = schemas.ConsultationAttachmentCreate(
        file_name=file.filename,
        file_path=file_location,
        file_type=file.content_type
    )
    db_attachment = models.ConsultationAttachment(**att_data.dict(), consultation_id=consultation_id)
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment

@app.get("/api/consultations/attachments/{attachment_id}/view")
def view_consultation_attachment(attachment_id: int, db: Session = Depends(get_db)):
    db_att = db.query(models.ConsultationAttachment).filter(models.ConsultationAttachment.id == attachment_id).first()
    if not db_att:
        raise HTTPException(status_code=404, detail="Attachment not found in database")
    if not os.path.exists(db_att.file_path):
        raise HTTPException(status_code=404, detail="Attachment file not found on disk")
    return FileResponse(db_att.file_path, media_type=db_att.file_type)

@app.delete("/api/consultations/{consultation_id}")
def delete_consultation(consultation_id: int, db: Session = Depends(get_db)):
    db_consultation = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
    if not db_consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    # Optional: Delete physical files associated with consultation here
    consultation_dir = os.path.join(DOCUMENTS_BASE, str(db_consultation.patient_id), "consultas", str(consultation_id))
    if os.path.exists(consultation_dir):
        shutil.rmtree(consultation_dir)

    db.delete(db_consultation)
    db.commit()
    return {"ok": True}

# --- FISIATRIA ENDPOINTS ---

@app.post("/api/patients/{patient_id}/fisiatria/", response_model=schemas.FisiatriaSession)
def create_fisiatria_session(patient_id: int, session: schemas.FisiatriaSessionCreate, db: Session = Depends(get_db)):
    db_session = models.FisiatriaSession(**session.dict(), patient_id=patient_id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@app.get("/api/patients/{patient_id}/fisiatria/", response_model=list[schemas.FisiatriaSession])
def read_fisiatria_sessions(patient_id: int, db: Session = Depends(get_db)):
    sessions = db.query(models.FisiatriaSession).filter(models.FisiatriaSession.patient_id == patient_id).all()
    return sessions

# --- TREATMENTS ENDPOINTS ---

@app.post("/api/patients/{patient_id}/treatments/", response_model=schemas.Treatment)
def create_treatment(patient_id: int, treatment: schemas.TreatmentCreate, db: Session = Depends(get_db)):
    db_treatment = models.Treatment(**treatment.dict(), patient_id=patient_id)
    db.add(db_treatment)
    db.commit()
    db.refresh(db_treatment)
    return db_treatment

@app.get("/api/patients/{patient_id}/treatments/", response_model=list[schemas.Treatment])
def read_treatments(patient_id: int, db: Session = Depends(get_db)):
    treatments = db.query(models.Treatment).filter(models.Treatment.patient_id == patient_id).all()
    return treatments

@app.put("/api/treatments/{treatment_id}/toggle", response_model=schemas.Treatment)
def toggle_treatment_status(treatment_id: int, db: Session = Depends(get_db)):
    db_treatment = db.query(models.Treatment).filter(models.Treatment.id == treatment_id).first()
    if not db_treatment:
        raise HTTPException(status_code=404, detail="Tratamento não encontrado")
    
    db_treatment.completed = not db_treatment.completed
    db.commit()
    db.refresh(db_treatment)
    return db_treatment

@app.delete("/api/treatments/{treatment_id}")
def delete_treatment(treatment_id: int, db: Session = Depends(get_db)):
    db_treatment = db.query(models.Treatment).filter(models.Treatment.id == treatment_id).first()
    if not db_treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    db.delete(db_treatment)
    db.commit()
    return {"ok": True}


# --- DOCUMENTS ENDPOINTS ---

@app.post("/api/patients/{patient_id}/documents/", response_model=schemas.Document)
async def upload_document(patient_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Create patient-specific folder in Windows Documents
    patient_dir = os.path.join(DOCUMENTS_BASE, str(patient_id))
    os.makedirs(patient_dir, exist_ok=True)
    
    # Save file to disk
    file_location = os.path.join(patient_dir, file.filename)
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    # Save record in DB
    doc_data = schemas.DocumentCreate(
        name=file.filename,
        file_type=file.content_type,
        file_path=file_location # Saving absolute path to Documentos/exames/ID/file
    )
    db_doc = models.Document(**doc_data.dict(), patient_id=patient_id)
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    return db_doc

@app.get("/api/patients/{patient_id}/documents/", response_model=list[schemas.Document])
def read_documents(patient_id: int, db: Session = Depends(get_db)):
    documents = db.query(models.Document).filter(models.Document.patient_id == patient_id).all()
    return documents

@app.get("/api/documents/{document_id}/view")
def view_document(document_id: int, db: Session = Depends(get_db)):
    db_doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found in database")
    
    if not os.path.exists(db_doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found on disk")
        
    return FileResponse(db_doc.file_path, media_type=db_doc.file_type)

@app.delete("/api/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    db_doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from disk
    if os.path.exists(db_doc.file_path):
        os.remove(db_doc.file_path)
        
    db.delete(db_doc)
    db.commit()
    return {"ok": True}

# --- EXAM METRICS ENDPOINTS ---

@app.post("/api/patients/{patient_id}/metrics/", response_model=schemas.ExamMetric)
def create_exam_metric(patient_id: int, metric: schemas.ExamMetricCreate, db: Session = Depends(get_db)):
    db_metric = models.ExamMetric(**metric.dict(), patient_id=patient_id)
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    return db_metric

@app.get("/api/patients/{patient_id}/metrics/", response_model=list[schemas.ExamMetric])
def read_exam_metrics(patient_id: int, db: Session = Depends(get_db)):
    metrics = db.query(models.ExamMetric).filter(models.ExamMetric.patient_id == patient_id).all()
    return metrics

@app.delete("/api/metrics/{metric_id}")
def delete_exam_metric(metric_id: int, db: Session = Depends(get_db)):
    db_metric = db.query(models.ExamMetric).filter(models.ExamMetric.id == metric_id).first()
    if not db_metric:
        raise HTTPException(status_code=404, detail="Metric not found")
    db.delete(db_metric)
    db.commit()
    return {"ok": True}


# --- SPA CATCH-ALL ROUTE ---
# This must be the last route defined!
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if not os.path.exists(frontend_dir):
        return {"message": f"Frontend build not found at {frontend_dir}. Please run 'npm run build'."}
    
    file_path = os.path.join(frontend_dir, full_path)
    if os.path.isfile(file_path):
        # Serve static assets (JS, CSS, images) directly
        return FileResponse(file_path)
    
    # Fallback to index.html for React Router SPA
    return FileResponse(os.path.join(frontend_dir, "index.html"))

