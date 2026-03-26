import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_api():
    print("--- Starting API Smoke Test ---")
    
    try:
        # 1. Get Patients
        print("1. Testing GET /patients/...")
        res = requests.get(f"{BASE_URL}/patients/")
        print(f"Status: {res.status_code}")
        patients = res.json()
        if not res.ok: raise Exception("Failed to get patients")
        
        if len(patients) == 0:
            print("No patients found. Creating a test patient...")
            res = requests.post(f"{BASE_URL}/patients/", json={"name": "Test Pet", "species": "Cão", "breed": "SRD"})
            print(f"Status: {res.status_code}")
            patient_id = res.json()['id']
        else:
            patient_id = patients[0]['id']
            
        print(f"Target patient ID: {patient_id}")
            
        # 2. Get Patient Details
        print(f"2. Testing GET /patients/{patient_id} (Aggregated)...")
        res = requests.get(f"{BASE_URL}/patients/{patient_id}")
        print(f"Status: {res.status_code}")
        if not res.ok: raise Exception("Failed to get patient details")
        
        # 3. Get Fisiatria Sessions (The new endpoint)
        print(f"3. Testing GET /patients/{patient_id}/fisiatria/...")
        res = requests.get(f"{BASE_URL}/patients/{patient_id}/fisiatria/")
        print(f"Status: {res.status_code}")
        if not res.ok: raise Exception("Failed to get fisiatria sessions")
        print(f"Sessions count: {len(res.json())}")
        
        # 4. Create dummy Fisiatria Session
        print(f"4. Testing POST /patients/{patient_id}/fisiatria/...")
        payload = {
            "date": "04/03/2026",
            "pain_level": 2,
            "notes": "Test session from smoke script"
        }
        res = requests.post(f"{BASE_URL}/patients/{patient_id}/fisiatria/", json=payload)
        print(f"Status: {res.status_code}")
        if not res.ok: raise Exception("Failed to create fisiatria session")
            
        print("\n--- Smoke Test PASSED ---")
        
    except Exception as e:
        print(f"\n--- Smoke Test FAILED: {e} ---")

if __name__ == "__main__":
    test_api()
