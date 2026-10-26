# NEXO MEDICO AI
### An AI-Powered Healthcare Management and Explainable Clinical Decision Support Platform

[![Academic Submission](https://img.shields.io/badge/Academic%20Project-Major%20Project%20Phase--I-blue.svg)](docs/IMPLEMENTATION_STATUS.md)
[![Institution](https://img.shields.io/badge/Institution-Malla%20Reddy%20University-orange.svg)](https://mallareddyuniversity.ac.in)
[![Next.js](https://img.shields.io/badge/Next.js-14.1%20App%20Router-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-indigo.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.0-336791.svg)](https://www.postgresql.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![Explainable AI](https://img.shields.io/badge/XAI-SHAP%20%26%20LIME-green.svg)](https://github.com/slundberg/shap)

---

## 1. Project Overview & Abstract

**Nexo Medico AI** is an enterprise-grade, cloud-native healthcare operating system and explainable clinical decision support platform. Engineered to eliminate fragmentation in electronic health records (EHR) and overcome the clinical "black-box" dilemma of medical artificial intelligence, the platform unifies:
1. **Explainable Clinical Decision Support (X-CDSS)**: Real-time chronic disease risk stratification with transparent feature-attribution weights computed via SHAP (SHapley Additive exPlanations) and LIME.
2. **Zero-Trust Emergency QR Identification**: Privacy-preserving physical QR badges allowing paramedics and bystanders to scan and instantly resolve lifesaving medical parameters without exposing confidential Protected Health Information (PHI).
3. **India-Specific Demographic Onboarding**: Geographically locked patient registration verifying 36 States/UTs, standardized district databases, and 6-digit postal PIN codes.
4. **Production Two-Factor Authentication (2FA)**: Real-time cryptographic 6-digit OTP dispatch over Gmail SMTP STARTTLS (Port 587) with SHA-256 hashed challenge storage.
5. **Multi-Tenant Hospital Operations**: Isolated institutional management supporting ward bed allocation, closed-loop e-prescriptions, automated pharmacy inventory synchronization, and OCR laboratory report ingestion.

---

## 2. Academic Project Context

- **Degree**: Bachelor of Technology (B.Tech)
- **Department**: Department of Computer Science and Engineering, School of Engineering
- **Institution**: **Malla Reddy University**, Maisammaguda, Dulapally, Hyderabad, Telangana 500100
- **Academic Year**: 2026–2027 (Major Project Phase-I Submission)
- **Course Code**: `MR23-1CS0181`
- **Dean — CSE**: Dr. A.V.L.N. Sujith, Dean, School of Engineering
- **Internal Guide**: Dr. [Guide Name], Associate Professor, Department of CSE
- **Candidate Team**:
  - Yashwanth [Candidate 1] (Roll No: 2211CS010001) [Team Lead]
  - [Candidate Name 2] (Roll No: 2211CS010002)
  - [Candidate Name 3] (Roll No: 2211CS010003)
  - [Candidate Name 4] (Roll No: 2211CS010004)

---

## 3. Problem Statement

Contemporary healthcare systems in developing economies, including India, suffer from three critical structural bottlenecks:
1. **Data Fragmentation & Interoperability Silos**: Patient medical histories remain isolated within incompatible departmental proprietary systems, leading to redundant diagnostic testing, medical errors, and zero longitudinal care continuity.
2. **Clinical AI Opacity ("Black-Box" Dilemma)**: Existing machine learning diagnostic algorithms produce probability scores without explaining *why* a particular patient was flagged, creating clinician distrust and regulatory barriers.
3. **High Latency in Emergency Triage**: During acute trauma or cardiovascular collapse (the "Golden Hour"), emergency responders lack immediate access to vital patient parameters (blood type, severe drug allergies, chronic illnesses, emergency contacts), resulting in preventable clinical complications.

---

## 4. Key Subsystems & Features

```
+-----------------------------------------------------------------------------------------+
|                                NEXO MEDICO AI SUBSYSTEMS                                |
+-----------------------------------------------------------------------------------------+
| 1. Onboarding & 2FA    | India-locked registration (36 States/UTs, PINs), Gmail SMTP     |
| 2. Universal EHR       | Longitudinal timeline, vitals tracking, allergy management     |
| 3. Explainable CDSS    | Disease risk predictions + SHAP feature attributions            |
| 4. Emergency QR ID     | 64-char unguessable token, zero-login public profile            |
| 5. Clinical Encounter  | Doctor chambers, ICD-10 diagnoses, digital e-prescriptions       |
| 6. Multi-Tenant Core   | Multi-hospital isolation, Ward/Bed management, staff roles     |
| 7. Closed-Loop Pharmacy| Real-time inventory decrement, batch tracking, dispensing logs  |
| 8. Diagnostic Labs     | Test orders, pathology results, automated OCR ingestion         |
+-----------------------------------------------------------------------------------------+
```

---

## 5. User Roles & Permission Hierarchy

The system enforces strict Role-Based Access Control (RBAC) across seven distinct user roles:

| User Role | Dashboard Route | Permitted Operations & Capabilities |
| :--- | :--- | :--- |
| **PATIENT** | `/patient/dashboard` | View Universal Health Passport, download Emergency QR, book appointments, track active prescriptions. |
| **DOCTOR** | `/doctor/appointments` | Conduct clinical consultations, review longitudinal vitals, invoke CDSS AI disease risk models, author e-prescriptions. |
| **NURSE** | `/hospital/wards` | Inpatient intake, real-time vital sign recording, ward bed tracking, medication administration logs. |
| **HOSPITAL ADMIN** | `/admin/hospitals` | Institutional ward/bed allocation, staff credential onboarding, department management, inter-hospital referrals. |
| **PHARMACIST** | `/pharmacy/dispense` | Receive pending e-prescriptions, verify stock batches, execute automated stock decrements, log dispensing audits. |
| **LAB TECH** | `/lab/worklist` | Process diagnostic test orders, enter specimen values, upload paper reports for automated OCR extraction. |
| **SUPER ADMIN** | `/admin/support-issues` | Cross-tenant platform analytics, system audit logs, support ticket triage, user dispute resolution. |

---

## 6. System Architecture

Nexo Medico AI is architected across four decoupled tiers to ensure scalability, security, and low-latency response times:

![Four-Tier System Architecture](docs/diagrams/Fig_4_1_System_Architecture.png)

1. **Client Presentation Tier**: Next.js 14 App Router, React Server Components (RSC), Tailwind CSS, Recharts.
2. **Application Gateway Tier**: Node.js 20 LTS, Next.js Server Actions, REST route handlers, Zod schema validation, JWT auth cookies.
3. **AI & Decision Support Tier**: Asynchronous Python 3.11 FastAPI microservice on port 8000 computing Scikit-learn predictions and SHAP attributions.
4. **Persistence Tier**: PostgreSQL 15 database managed via Prisma ORM 5.22, enforcing multi-tenancy and audit compliance.

---

## 7. Technology Stack

- **Frontend & Full-Stack Core**: Next.js 14.1 (App Router), React 18, TypeScript 5.3, Tailwind CSS 3.4, Lucide React, Recharts.
- **Backend & APIs**: Next.js Route Handlers, Node.js 20 LTS, Server Actions.
- **Relational Database & ORM**: PostgreSQL 15, Prisma ORM 5.22.
- **AI & Analytics Microservice**: Python 3.11, FastAPI 0.110, Uvicorn, Scikit-learn 1.4, SHAP 0.45, PyTorch 2.2, Tesseract OCR.
- **Communication & Security**: Nodemailer 10.1, Gmail SMTP STARTTLS (Port 587), bcryptjs 2.4, jsonwebtoken 9.0, Node.js Crypto API.

---

## 8. Prerequisites & System Requirements

Before running the platform locally on Windows, ensure the following tools are installed:

- **Node.js**: v18.17+ LTS or v20.12+ LTS ([Download](https://nodejs.org/))
- **PostgreSQL**: PostgreSQL 14+ or 15+ running locally on port 5432 ([Download](https://www.postgresql.org/download/windows/))
- **Python**: Python 3.10+ or 3.11+ ([Download](https://www.python.org/downloads/))
- **Git**: Git for Windows ([Download](https://git-scm.com/))

---

## 9. Local Installation & Setup Guide (Windows)

### Step 1: Clone the Repository
```powershell
git clone https://github.com/VajralaYashwanthReddy/NEXO-MEDICO-AI.git
cd NEXO-MEDICO-AI
```

### Step 2: Install Node.js Dependencies
```powershell
npm install
```

### Step 3: Install Python AI Microservice Dependencies
```powershell
cd ai_service
pip install -r requirements.txt
cd ..
```

### Step 4: Configure Local PostgreSQL Database
Open PostgreSQL `psql` or pgAdmin and create the application database:
```sql
CREATE DATABASE nexo_medico_ai;
```

### Step 5: Configure Environment Variables
Duplicate `.env.example` to create your local `.env` file:
```powershell
copy .env.example .env
```
Open `.env` and fill in your local database password and Gmail SMTP App Password:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/nexo_medico_ai?schema=public"
JWT_SECRET="generate_a_random_32_character_secret_string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AI_SERVICE_URL="http://localhost:8000"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_APP_PASSWORD="your-16-char-google-app-password"
EMAIL_FROM="Nexo Medico AI <your-email@gmail.com>"
```

### Step 6: Push Database Schema & Seed Initial Data
```powershell
# Generate Prisma Client
npx prisma generate

# Synchronize database tables non-destructively
npm run db:push

# (Optional) Seed demo hospitals, doctors, and demo accounts
npm run db:seed
```

### Step 7: Launch Application Servers
Start both the Next.js web application and the Python AI microservice:

**Terminal 1 — Next.js Application Server (Port 3000):**
```powershell
npm run dev
```

**Terminal 2 — Python FastAPI Microservice (Port 8000):**
```powershell
python ai_service/main.py
```

The application is now accessible at: **`http://localhost:3000`**

---

## 10. Key Application Routes

| Route | Functionality |
| :--- | :--- |
| `http://localhost:3000` | Landing Page & Public Healthcare Portal |
| `http://localhost:3000/login` | Multi-Role Authentication Chamber |
| `http://localhost:3000/patient/register` | India-Specific Demographic Self-Registration & 2FA OTP |
| `http://localhost:3000/patient/dashboard` | Universal Patient Health Passport & Longitudinal EHR |
| `http://localhost:3000/patient/emergency-qr` | Emergency QR Badge Generator & Print Workstation |
| `http://localhost:3000/emergency/[token]` | Public Mobile Emergency Profile (Zero-Login) |
| `http://localhost:3000/doctor/appointments` | Doctor Outpatient Schedule & Encounter Room |
| `http://localhost:3000/doctor/patient/[id]` | Clinical Encounter Chamber with CDSS Explainable AI |
| `http://localhost:3000/doctor/prescriptions` | Digital E-Prescription Management |
| `http://localhost:3000/admin/hospitals` | Hospital Multi-Tenancy & Inpatient Ward/Bed Manager |
| `http://localhost:3000/support` | Authenticated Support Ticket Tracking |

---

## 11. Application Visual Gallery

| Figure | Description |
| :---: | :--- |
| ![Patient Registration](docs/screenshots/Fig_5_4_Patient_Self_Registration_Form.png) | **Patient Self-Registration**: India-locked demographic validation with standardized State and District cascading dropdowns. |
| ![OTP Modal](docs/screenshots/Fig_5_1_Patient_Registration_OTP_Modal.png) | **2FA Identity Verification**: Cryptographic 6-digit OTP modal with 10-minute active challenge countdown. |
| ![Doctor Consultation](docs/screenshots/Fig_5_5_Doctor_Clinical_Encounter_Dashboard.png) | **Doctor Encounter Chamber**: Longitudinal timeline, vitals logging, and structured diagnosis entry. |
| ![Explainable AI](docs/screenshots/Fig_5_7_AI_Clinical_Decision_Support_Engine.png) | **Explainable AI (CDSS)**: Real-time risk probability stratification with SHAP feature-importance attribution bars. |
| ![Hospital Multi-Tenancy](docs/screenshots/Fig_5_8_Hospital_Multi_Tenancy_Management.png) | **Multi-Tenant Administration**: Real-time ward occupancy and inpatient bed allocation dashboard. |

---

## 12. Project Directory Structure

```
NEXO-MEDICO-AI/
├── ai_service/                         # Python FastAPI machine learning microservice
│   ├── main.py                         # REST endpoints for disease prediction, SHAP, and OCR
│   ├── requirements.txt                # Python dependencies (scikit-learn, shap, torch, fastapi)
│   └── models/                         # Pre-trained clinical risk pipeline weights
├── docs/                               # Engineering documentation & architecture specifications
│   ├── ARCHITECTURE.md                 # Four-tier system architecture and sequence diagrams
│   ├── DATABASE.md                     # 33-model relational schema catalog and ERD
│   ├── API.md                          # REST API specification and request/response payloads
│   ├── IMPLEMENTATION_STATUS.md        # Comprehensive 38-feature audit & test evidence
│   ├── SECURITY.md                     # PHI segregation, 2FA, and regulatory compliance
│   ├── diagrams/                       # 10 High-resolution system diagrams (300 DPI)
│   └── screenshots/                    # 10 Verified application visual captures
├── prisma/                             # Prisma ORM persistence layer
│   ├── schema.prisma                   # 33 multi-tenant relational models
│   └── seed.mjs                        # Initial tenant, ward, and credential seed script
├── src/                                # Next.js App Router source directory
│   ├── app/                            # Pages, layouts, and API route handlers
│   │   ├── (auth)/                     # Login, registration, password recovery
│   │   ├── admin/                      # Hospital multi-tenancy and support admin
│   │   ├── api/                        # REST route handlers (auth, patients, appointments)
│   │   ├── doctor/                     # Clinical chambers, appointments, prescriptions
│   │   ├── emergency/[token]/          # Public Emergency QR resolution profile
│   │   ├── patient/                    # Universal EHR passport, emergency QR view
│   │   └── support/                    # Authenticated support ticketing
│   ├── components/                     # Reusable React UI components (Modals, Headers, Cards)
│   ├── context/                        # React client auth state provider
│   ├── hooks/                          # Custom hooks for real-time appointments
│   └── lib/                            # Server utilities (email-service, prisma, indiaGeoData)
├── scripts/                            # PowerShell automation utilities (backup, restore)
├── .env.example                        # Safe environment variable configuration template
├── .gitignore                          # Comprehensive exclusion for secrets, logs, and dumps
├── package.json                        # Node.js project manifest & npm scripts
├── tailwind.config.ts                  # Tailwind styling configurations
└── tsconfig.json                       # TypeScript compiler options
```

---

## 13. Implementation Status & Limitations

- **Verified Features**: 34 of 38 features (89.5%) are fully implemented, verified, and backed by PostgreSQL database persistence.
- **Partially Implemented**: 2 features (5.3%) — OCR handwriting generalization and RAG medical literature search prototype.
- **Phase-II Roadmap**: Real-time IoT bedside vitals streaming, ABDM/ABHA national health registry integration, and privacy-preserving federated clinical learning across hospital nodes.
- For complete audit details, consult [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).

---

## 14. License & Academic Disclaimer

This project is authored as a Bachelor of Technology Major Project Phase-I at **Malla Reddy University, Hyderabad**. It is distributed under the **MIT License**.

> **Medical AI Disclaimer**: Nexo Medico AI is an academic clinical decision support research tool designed to augment, not replace, professional clinical judgment. Diagnostic recommendations must always be verified by a licensed medical practitioner.
