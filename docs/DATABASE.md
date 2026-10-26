# Nexo Medico AI — Relational Database Architecture

## 1. Overview & Data Layer Strategy

The persistence tier of **Nexo Medico AI** is built on **PostgreSQL 15** and managed using **Prisma ORM 5.22**. The database schema is engineered around two core principles:

1. **Strict Multi-Tenant Isolation**: Hospital-bound clinical operations (wards, beds, admissions, consultations, prescriptions) are scoped by `hospitalId` to guarantee that one hospital cannot view or modify another hospital's operational data.
2. **Universal Patient Health Identity (UPHID)**: To prevent healthcare fragmentation across India, patient records are anchored to a globally unique `uphid`. Upon patient consent, authorized doctors across different hospitals can review historical consultations, vitals, and allergy histories.

![Entity-Relationship Diagram](diagrams/Fig_4_3_Database_ERD.png)

---

## 2. Complete Model Catalog (33 Production Models)

The relational schema defined in `prisma/schema.prisma` comprises 33 distinct models categorized into seven functional domains:

### Domain 1: Multi-Tenant Core & User Accounts
| Model Name | Description & Primary Responsibilities | Key Relationships |
| :--- | :--- | :--- |
| `Hospital` | Defines independent institutional tenants (hospitals/clinics) with unique code, location, and metadata. | `users`, `wards`, `doctors`, `departments` |
| `Department` | Clinical departments within a hospital (e.g., Cardiology, Neurology, Emergency). | `hospital`, `doctors` |
| `User` | Base authentication entity. Supports roles: `PATIENT`, `DOCTOR`, `NURSE`, `PHARMACIST`, `LAB_TECH`, `ADMIN`, `SUPER_ADMIN`. | `hospital`, `patient`, `doctor`, `sessions` |
| `Doctor` | Doctor credentials, specialization, medical license number, consultation fees, and schedule. | `user`, `hospital`, `department`, `consultations` |
| `Patient` | Anchors clinical identity, demographics, blood group, and unique Universal Patient ID (`uphid`). | `user`, `emergencyProfile`, `consultations`, `admissions` |

### Domain 2: Emergency QR Identification & Response
| Model Name | Description & Primary Responsibilities | Key Relationships |
| :--- | :--- | :--- |
| `PatientEmergencyProfile` | Stores 64-character unguessable cryptographic tokens, blood group, critical allergies, chronic conditions, and emergency contacts. | `patient` (1-to-1) |
| `EmergencyAccessLog` | Immutable audit log capturing IP address, user-agent, timestamp, and location every time an Emergency QR ID is resolved. | `patientEmergencyProfile` |

### Domain 3: Clinical Encounters & E-Prescribing
| Model Name | Description & Primary Responsibilities | Key Relationships |
| :--- | :--- | :--- |
| `Appointment` | Outpatient and follow-up appointment bookings with status tracking (`SCHEDULED`, `COMPLETED`, `CANCELLED`). | `patient`, `doctor`, `hospital` |
| `Consultation` | Doctor clinical encounter records: chief complaint, physical examination, clinical summary, and diagnosis. | `patient`, `doctor`, `appointment`, `vitals` |
| `VitalSign` | Longitudinal physiological parameters: systolic/diastolic blood pressure, heart rate, temperature, SpO2, respiratory rate. | `consultation`, `patient` |
| `Diagnosis` | Clinical diagnostic classifications with ICD-10 codes and certainty levels. | `consultation`, `patient` |
| `ClinicalNote` | Progress notes, nursing observations, and specialist review notes. | `consultation`, `author` |
| `CarePlan` | Structured therapeutic and dietary care plans with review milestones. | `patient`, `doctor` |

### Domain 4: Pharmacy & Inventory Subsystem
| Model Name | Description & Primary Responsibilities | Key Relationships |
| :--- | :--- | :--- |
| `Prescription` | E-prescriptions authored by doctors with status (`PENDING`, `DISPENSED`, `CANCELLED`). | `consultation`, `patient`, `doctor`, `medications` |
| `MedicationItem` | Individual line items on a prescription: drug name, dosage, frequency, duration, route, instructions. | `prescription`, `medication` |
| `Medication` | Master drug formulary: generic name, brand name, drug class, standard dosage forms, contraindications. | `items`, `stocks` |
| `PharmacyStock` | Real-time pharmacy inventory: batch numbers, expiration dates, available quantity, unit cost. | `medication`, `hospital` |
| `DispenseLog` | Closed-loop audit trail recording exact quantities dispensed, pharmacist ID, batch decrements, and timestamps. | `prescription`, `pharmacist`, `stock` |

### Domain 5: Laboratory Diagnostics & OCR Ingestion
| Model Name | Description & Primary Responsibilities | Key Relationships |
| :--- | :--- | :--- |
| `LabOrder` | Diagnostic test requisitions ordered during clinical encounters. | `consultation`, `patient`, `doctor`, `tests` |
| `LabTest` | Individual test definitions: test name, category (Hematology, Biochemistry, Radiology), reference ranges. | `order`, `report` |
| `LabReport` | Pathology results, numerical biomarker values, technician interpretations, and verified status. | `test`, `technician` |
| `MedicalImage` | Metadata for radiology scans, X-rays, CTs, MRIs, and dermatology clinical photographs. | `consultation`, `patient` |
| `OcrIngestionQueue` | Asynchronous processing queue for scanned paper reports undergoing automated OCR text extraction. | `labReport` |

### Domain 6: Inpatient Ward & Bed Management
| Model Name | Description & Primary Responsibilities | Key Relationships |
| :--- | :--- | :--- |
| `Ward` | Hospital inpatient wards categorized by care level: `GENERAL`, `SEMI_PRIVATE`, `PRIVATE`, `ICU`, `EMERGENCY`. | `hospital`, `beds` |
| `Bed` | Individual physical beds within a ward: bed number, status (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `CLEANING`). | `ward`, `admissions` |
| `Admission` | Inpatient admission records tracking admission date, admitting doctor, primary diagnosis, and allocated bed. | `patient`, `hospital`, `bed`, `doctor` |
| `Discharge` | Inpatient discharge summaries: discharge date, condition at discharge, follow-up instructions, discharge medications. | `admission` |
| `TransferRecord` | Historical log tracking bed-to-bed and ward-to-ward transfers during patient hospitalization. | `admission`, `fromBed`, `toBed` |

### Domain 7: Security, Auditing & Communication
| Model Name | Description & Primary Responsibilities | Key Relationships |
| :--- | :--- | :--- |
| `OtpChallenge` | Cryptographic 6-digit OTP challenges, storing SHA-256 hashed codes, expiry timestamps, and verification status. | Independent security model |
| `Session` | Active user sessions with secure cookie tokens, expiry, and IP auditing. | `user` |
| `AuditLog` | Granular security audit trail capturing user actions, target entities, IP addresses, and previous/new state diffs. | `user` |
| `SupportIssue` | Customer and patient support tickets with priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and status. | `user`, `messages` |
| `TicketMessage` | Threaded communication messages between patients/users and administrative support personnel. | `supportIssue`, `author` |
| `Notification` | Transactional in-app notifications for appointment reminders, lab results, and prescription approvals. | `user` |

---

## 3. Database Indexes & Query Optimization

To guarantee sub-50ms query response times under high concurrency, high-frequency lookup columns have dedicated B-Tree indexes:

```prisma
// Example unique indexing for fast token resolution
model PatientEmergencyProfile {
  id             String   @id @default(cuid())
  emergencyToken String   @unique // 64-char hex index for O(1) emergency lookups
  patientId      String   @unique
  // ...
}

// Example composite indexes for tenant queries
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  hospitalId String?
  // ...
  @@index([hospitalId, role])
}
```

---

## 4. Database Migrations & Administration

- **Prisma Schema Location**: `prisma/schema.prisma`
- **Generate Client**: `npm run postinstall` (or `npx prisma generate`)
- **Validate Schema**: `npx prisma validate`
- **Push Schema Updates (Non-Destructive)**: `npm run db:push`
- **Database GUI Inspector**: `npm run db:studio`
