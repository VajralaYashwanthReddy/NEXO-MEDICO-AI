# Nexo Medico AI — API Reference & Integration Guide

## 1. Overview & Protocol Standards

The **Nexo Medico AI** platform provides two categories of RESTful endpoints:
1. **Next.js Core Application API**: Handles patient onboarding, authentication, role-based workflows, emergency lookups, support tickets, and database persistence.
2. **FastAPI Clinical AI Microservice**: Handles machine learning inference, disease probability stratification, explainable SHAP/LIME attributions, and OCR diagnostic extraction.

All requests accept and return JSON payloads (`Content-Type: application/json`).

---

## 2. Authentication & Session Management

| Endpoint | Method | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public | Authenticates credentials and issues an HTTP-only session cookie. |
| `/api/auth/me` | `GET` | Authenticated | Retrieves current user role, profile details, and hospital affiliation. |
| `/api/auth/otp` | `POST` | Public | Generates and dispatches a 6-digit OTP challenge via Gmail SMTP TLS. |
| `/api/auth/verify-otp` | `POST` | Public | Verifies the OTP challenge against its SHA-256 hash. |
| `/api/auth/forgot-password` | `POST` | Public | Initiates password recovery workflow with email OTP challenge. |
| `/api/auth/reset-password` | `POST` | Public (Verified OTP) | Resets account password upon successful OTP confirmation. |

---

## 3. Patient Onboarding & Emergency QR Endpoints

### 3.1 Patient Self-Registration (India-Specific)
- **Route**: `POST /api/patient/register`
- **Access**: Public
- **Description**: Validates Indian geographic boundaries (36 States/UTs, official districts, 6-digit PIN) and mandatory emergency contacts before dispatching 2FA OTP.
- **Request Body**:
```json
{
  "name": "Arjun Sharma",
  "email": "arjun.sharma@example.com",
  "password": "SecurePassword123!",
  "phone": "+919876543210",
  "dob": "1994-05-15",
  "gender": "MALE",
  "bloodGroup": "O_POSITIVE",
  "country": "IN",
  "state": "Telangana",
  "district": "Hyderabad",
  "city": "Hyderabad",
  "pinCode": "500100",
  "address": "Flat 402, Sai Residency, Maisammaguda",
  "emergencyName": "Pooja Sharma",
  "emergencyPhone": "+919876543211",
  "emergencyRelation": "Spouse"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Registration OTP dispatched successfully via Gmail SMTP",
  "challengeId": "clx...",
  "email": "arjun.sharma@example.com"
}
```

### 3.2 Emergency QR Public Profile Resolution
- **Route**: `GET /api/emergency/qr/[token]`
- **Access**: Public (Token Bearer)
- **Description**: Resolves life-saving medical data without requiring login. Excludes sensitive Protected Health Information.
- **Response (200 OK)**:
```json
{
  "success": true,
  "emergencyData": {
    "uphid": "UPHID-2026-9842",
    "patientName": "Arjun Sharma",
    "age": 32,
    "gender": "MALE",
    "bloodGroup": "O_POSITIVE",
    "allergies": ["Penicillin", "Sulfa drugs"],
    "chronicConditions": ["Type-2 Diabetes", "Mild Hypertension"],
    "emergencyContact": {
      "name": "Pooja Sharma",
      "phone": "+919876543211",
      "relation": "Spouse"
    },
    "verifiedAt": "2026-10-15T09:30:00.000Z"
  }
}
```

---

## 4. Clinical Encounters & Appointments

### 4.1 Book Appointment
- **Route**: `POST /api/appointments`
- **Access**: Authenticated (`PATIENT`, `DOCTOR`, `ADMIN`)
- **Request Body**:
```json
{
  "doctorId": "doc_clx123",
  "patientId": "pat_clx456",
  "hospitalId": "hosp_clx789",
  "dateTime": "2026-10-28T10:30:00.000Z",
  "reason": "Routine hypertension review"
}
```

### 4.2 Record Clinical Consultation & E-Prescription
- **Route**: `POST /api/consultations`
- **Access**: Authenticated (`DOCTOR`)
- **Request Body**:
```json
{
  "appointmentId": "apt_clx123",
  "chiefComplaint": "Occasional dizziness and headache",
  "physicalExamination": "BP 138/88 mmHg, HR 76 bpm, lungs clear",
  "diagnosis": "Essential hypertension (Stage 1)",
  "vitals": {
    "systolicBp": 138,
    "diastolicBp": 88,
    "heartRate": 76,
    "temperature": 98.4
  },
  "prescriptions": [
    {
      "medicationName": "Amlodipine",
      "dosage": "5 mg",
      "frequency": "Once daily (Morning)",
      "duration": "30 days"
    }
  ]
}
```

---

## 5. Explainable AI Microservice Endpoints (Port 8000)

### 5.1 Disease Risk Stratification & SHAP Feature Attributions
- **Route**: `POST http://localhost:8000/api/predict/disease`
- **Description**: Evaluates clinical biomarkers through ensemble ML pipelines and returns exact SHAP values for each biomarker.
- **Request Body**:
```json
{
  "patient_id": "pat_clx456",
  "age": 52,
  "systolic_bp": 142.0,
  "diastolic_bp": 92.0,
  "fasting_glucose": 135.0,
  "hba1c": 7.4,
  "cholesterol": 218.0,
  "bmi": 28.6,
  "symptoms": ["fatigue", "blurred_vision", "frequent_urination"]
}
```
- **Response (200 OK)**:
```json
{
  "status": "success",
  "risk_score": 0.814,
  "risk_category": "HIGH",
  "primary_factors": [
    {
      "feature": "HbA1c",
      "value": 7.4,
      "shap_attribution": 0.384,
      "direction": "RISK_INCREASING"
    },
    {
      "feature": "Fasting Glucose",
      "value": 135.0,
      "shap_attribution": 0.245,
      "direction": "RISK_INCREASING"
    },
    {
      "feature": "Systolic BP",
      "value": 142.0,
      "shap_attribution": 0.118,
      "direction": "RISK_INCREASING"
    }
  ]
}
```

---

## 6. Support Tickets & Issue Tracking

- **Route**: `POST /api/support/issues`
- **Access**: Authenticated
- **Description**: Submits technical or clinical support requests. Auto-populates verified user details (name, email, mobile phone) from PostgreSQL session.
- **Route**: `POST /api/support/issues/[id]/messages`
- **Description**: Threaded messaging between patients and hospital support personnel.
