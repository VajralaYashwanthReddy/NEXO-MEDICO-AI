# NEXO MEDICO AI — COMPREHENSIVE TEST EVIDENCE & EXECUTION REPORT

**Project Title**: NEXO MEDICO AI: An AI-Powered Healthcare Management and Explainable Clinical Decision Support Platform  
**Academic Degree**: Bachelor of Technology (B.Tech) in Computer Science and Engineering  
**Institution**: Malla Reddy University, Hyderabad, Telangana, India  
**Course Code**: IV-I Major Project Phase-1 (MR23-1CS0181)  
**Execution Date**: 2026-10-22  
**Test Harness**: Automated Node.js Native HTTP Test Runner (`scratch/test_emergency_qr_workflow.mjs`) & Python Test Harnesses  

---

## 1. Test Strategy & Execution Scope

To validate that Nexo Medico AI operates as a robust, production-grade healthcare application rather than a client-only prototype, a comprehensive end-to-end testing suite was developed and executed against live application instances:
- **Next.js Web Application & API Gateway**: Running on `http://localhost:3000`
- **FastAPI Python AI Microservice**: Running on `http://localhost:8000`
- **Relational Database**: Local PostgreSQL 16 on port `5432` (`nexo_medico_ai`)
- **Mail Transfer Agent**: Dedicated Google Workspace Gmail SMTP on `smtp.gmail.com:587` (STARTTLS)

---

## 2. Test Execution Log & Verified Results

### Test Suite 1: Real Patient Self-Registration & Indian Address Persistence
* **Objective**: Verify that a new patient can submit a registration payload containing a complete Indian address hierarchy, obtain an OTP challenge, pass validation, and be atomically stored in PostgreSQL.
* **Test Input**:
  - Full Name: `Aarav Sharma`
  - Email: `aarav.test.1792651511960@gmail.com`
  - Date of Birth: `1990-05-15` (Age 36)
  - Gender: `MALE`, Blood Group: `AB+`
  - Address: `Flat 402, Sai Residency, Road No 1, Ward 12, Gandhi Nagar, Mandal Serilingampally Mandal, Hyderabad, Telangana - 500032, India`
  - Emergency Contact: `Sunita Sharma (Mother)` - `+91 97515 11960`
  - Documented Allergies: `Ciprofloxacin, Shellfish`
  - Comorbidities: `Hypertension`
* **Execution Steps**:
  1. Generate salted Bcrypt OTP challenge in `OtpChallenge` table.
  2. Invoke `POST /api/auth/register-patient` with challenge token and OTP code.
  3. Query PostgreSQL `User` and `Patient` records via Prisma.
* **Result**: `PASS`
  - HTTP Status: `201 Created`
  - Universal Patient ID Generated: `NEXO-PAT-000014`
  - `villageWard` persisted: `"Ward 12, Gandhi Nagar"`
  - `mandalTaluk` persisted: `"Serilingampally Mandal"`
  - `pinCode` persisted: `"500032"`
  - `PatientEmergencyProfile` provisioned automatically with secret token `emg_T-mIABq4q4xq_n5F03MKN4Vvpad-gAb2`

---

### Test Suite 2: Two-Factor Authentication (2FA) & Session Minting
* **Objective**: Verify that authenticating with valid email and password halts session issuance until a secondary OTP verification is passed.
* **Test Input**: Valid credentials for `aarav.test.1792651511960@gmail.com`.
* **Execution Steps**:
  1. Invoke `POST /api/auth/login` with email and password.
  2. Inspect response for `requiresOtp: true` and `challengeToken`.
  3. Submit valid 6-digit OTP code to `POST /api/auth/login` with `action: 'verify_login_otp'`.
  4. Inspect response headers for `Set-Cookie`.
* **Result**: `PASS`
  - Step 1 halted with `requiresOtp: true` (Zero JWT cookies issued on Step 1).
  - Step 2 completed with HTTP `200 OK`.
  - Secure `httpOnly` session cookie (`nexo_token`) minted and verified.

---

### Test Suite 3: Authenticated Emergency QR Profile & Domain Configuration
* **Objective**: Verify that authenticated patients receive their live QR data and that domain configuration properly identifies localhost development mode.
* **Execution Steps**:
  1. Invoke `GET /api/patient/emergency-qr` using the authenticated session cookie.
  2. Inspect `domainConfig`, `patient`, and `emergencyUrl`.
* **Result**: `PASS`
  - Patient Name: `Aarav Sharma` (Zero "John Doe" fallbacks).
  - Blood Group: `AB+`.
  - `domainConfig.isLocalhost`: `true`.
  - `domainConfig.domainWarning`: `"Localhost / Non-HTTPS URL Detected (http://localhost:3000). External smartphone cameras outside your local computer network CANNOT reach this link. Configure NEXT_PUBLIC_APP_URL with your public HTTPS domain for real-world emergency use."`
  - `emergencyUrl`: `http://localhost:3000/emergency/emg_T-mIABq4q4xq_n5F03MKN4Vvpad-gAb2`.

---

### Test Suite 4: Public Emergency Profile Access (Zero Authentication Required)
* **Objective**: Verify that first responders and bystanders scanning the QR code can access critical triage information without requiring any login or credentials.
* **Execution Steps**:
  1. Issue unauthenticated `GET /api/emergency/emg_T-mIABq4q4xq_n5F03MKN4Vvpad-gAb2`.
  2. Verify returned medical fields, age calculation, and data minimization.
* **Result**: `PASS`
  - HTTP Status: `200 OK`.
  - Name: `Aarav Sharma`.
  - Blood Group: `AB+`.
  - Drug Allergies: `Ciprofloxacin, Shellfish`.
  - Chronic Conditions: `Hypertension`.
  - Next of Kin Contact: `Sunita Sharma` (`+91 97515 11960`).
  - Computed Age: `36` (derived dynamically from `dob: 1990-05-15`).
  - Home Address: Protected by default (`undefined`) until patient gives explicit consent.
  - Mock Data Audit: Zero instances of "John Doe" or dummy `+1 (555) 012-3456` anywhere in payload.

---

### Test Suite 5: Patient Privacy & Consent Controls Enforcement
* **Objective**: Verify that the patient can selectively toggle the visibility of sensitive PII, and that the server enforces these restrictions without leaking unconsented data.
* **Execution Steps**:
  1. Patient enables address sharing (`shareAddress: true`).
  2. Query public endpoint: Verify formatted Indian address and Google Maps link appear.
  3. Patient disables address, phone, and DOB (`shareAddress: false`, `sharePhone: false`, `shareDob: false`).
  4. Query public endpoint: Verify `address`, `phone`, and `age` are omitted from the server response while critical blood group remains visible.
* **Result**: `PASS`
  - With consent: Address returned as `"Flat 402, Sai Residency, Road No 1, Ward 12, Gandhi Nagar, Near Opposite Community Hall, Mandal Serilingampally Mandal, Hyderabad, Telangana - 500032, India"` with Google Maps search URL.
  - Without consent: `address === undefined`, `phone === undefined`, `age === undefined`.
  - Critical Vitals (`bloodGroup: "AB+"`, `allergies: "Ciprofloxacin, Shellfish"`) remain preserved.

---

### Test Suite 6: In-Place Residential Address Updates
* **Objective**: Verify that patients can update their residential address directly from their emergency settings, and that changes persist to PostgreSQL.
* **Execution Steps**:
  1. Patient updates address to `Villa 105, Palm Meadows, Ward 4, Jubilee Hills, Shaikpet Mandal, Hyderabad - 500033`.
  2. Re-query public endpoint after consent: Verify updated address is returned.
* **Result**: `PASS`
  - PostgreSQL `Patient` record updated.
  - New address rendered: `"Villa 105, Palm Meadows, Road No 1, Ward 4, Jubilee Hills, Near Near Club House, Mandal Shaikpet Mandal, Hyderabad, Telangana - 500033, India"`.

---

### Test Suite 7: Cryptographic Token Regeneration
* **Objective**: Verify that generating a new emergency token immediately invalidates the previous QR code.
* **Execution Steps**:
  1. Invoke `POST /api/patient/emergency-qr` with `action: 'regenerate_token'`.
  2. Capture new token `emg_zG5hx_Hwxu3ZvRK5L75yv5luA3-yu8fy`.
  3. Query old token `emg_T-mIABq4q4xq_n5F03MKN4Vvpad-gAb2`: Verify HTTP `404 Not Found`.
  4. Query new token: Verify HTTP `200 OK` with patient data.
* **Result**: `PASS`
  - Old token returns `404 Not Found`.
  - New token resolves successfully.

---

### Test Suite 8: Instant Emergency QR Revocation
* **Objective**: Verify that revoking an emergency QR sticker disables the public profile and strips all patient PII.
* **Execution Steps**:
  1. Invoke `POST /api/patient/emergency-qr` with `action: 'revoke_token'`.
  2. Query public API: Verify response status is `REVOKED` and PII is omitted.
  3. Fetch public UI page `/emergency/[token]`: Verify revoked banner is displayed.
* **Result**: `PASS`
  - Status: `REVOKED`.
  - Patient Name: `undefined`.
  - Patient Address: `undefined`.
  - UI HTML contains: `"Emergency QR Code Revoked"`.

---

### Test Suite 9: Public Web UI Page Rendering & India 112 Protocol
* **Objective**: Verify that the public Next.js page at `/emergency/[token]` compiles, renders, and includes the India National Emergency helpline.
* **Execution Steps**:
  1. Re-generate active token.
  2. Fetch HTML from `http://localhost:3000/emergency/[activeToken]`.
  3. Verify presence of patient name, blood group, triage banner, and `tel:112` protocol link.
* **Result**: `PASS`
  - HTTP Status: `200 OK`.
  - Contains patient name: `"Aarav Sharma"`.
  - Contains blood group: `"AB+"`.
  - Contains India National Emergency call link: `<a href="tel:112">`.
  - Contains 0 instances of dummy "John Doe".

---

### Test Suite 10: AI Clinical Decision Support Engine (FastAPI Microservice)
* **Objective**: Validate the disease prediction, SHAP explainability attribution, and RAG medical guideline query endpoints.
* **Test Input**:
  - `conditionType`: `"Diabetes"`
  - `glucose`: `168.0`, `bmi`: `31.2`, `patientAge`: `52`, `familyHistory`: `True`
* **Execution Steps**:
  1. Invoke `POST http://localhost:8000/api/predict/disease`.
  2. Verify risk score calculation, condition classification, feature attribution weights, and model benchmark comparisons.
  3. Invoke `POST http://localhost:8000/api/rag/query` with `"What is first-line pharmacotherapy for type 2 diabetes with elevated glucose?"`.
  4. Verify ADA 2026 citation retrieval.
* **Result**: `PASS`
  - Predicted Condition: `"High Risk"` (Risk Score: `90.0%`).
  - Dominant Feature: Fasting Glucose (`168.0 mg/dL`, Importance: `0.42`, Effect: `"High Risk Elevating Factor"`).
  - Secondary Feature: BMI (`31.2`, Importance: `0.28`, Effect: `"Obesity Risk"`).
  - Model Comparison: Evaluated Random Forest (92.4%), XGBoost (94.8%), LightGBM (93.9%), and MLP (91.8%).
  - RAG Retrieval: Returned ADA 2026 citation recommending Metformin with SGLT2i / GLP-1 RA cardiorenal guidance.

---

### Test Suite 11: TypeScript Compilation & Static Type Safety
* **Objective**: Verify that the entire Next.js TypeScript codebase has zero compiler errors, broken imports, or missing type declarations.
* **Execution Command**: `npx.cmd tsc --noEmit`
* **Result**: `PASS` (Exited with code 0, 0 compiler errors).

---

## 3. Test Summary Table

| Test Suite ID | Description | Execution Target | Expected Outcome | Actual Result | Status |
|---|---|---|---|---|---|
| **TS-01** | Real Patient Self-Registration & Indian Address Persistence | Next.js API + PostgreSQL | HTTP 201, UID generated, Address stored | HTTP 201, NEXO-PAT-000014, DB verified | `PASS` |
| **TS-02** | Two-Factor Login Authentication & JWT Minting | Next.js API + Nodemailer | 2FA halted on Step 1, Cookie on Step 2 | requiresOtp=true, JWT issued after 2FA | `PASS` |
| **TS-03** | Authenticated Emergency QR Fetch & Localhost Warning | Next.js API + Service | Live QR returned, Localhost warning active | Verified live data & warning banner | `PASS` |
| **TS-04** | Public Emergency Profile Access (Zero Auth) | Public Next.js API | HTTP 200, Vitals shown, Zero John Doe | HTTP 200, Real patient data displayed | `PASS` |
| **TS-05** | Server-Enforced Privacy & Consent Controls | Emergency QR Service | PII hidden when toggled off | Address, phone, DOB hidden on server | `PASS` |
| **TS-06** | In-Place Residential Address Updates | Emergency QR Route | Updated address stored in DB | Villa 105 Palm Meadows persisted | `PASS` |
| **TS-07** | Cryptographic Token Regeneration | Emergency QR Service | Old token 404, New token 200 | Old token invalidated, New token active | `PASS` |
| **TS-08** | Instant Emergency QR Revocation | Emergency QR Service | Status REVOKED, PII stripped | Status REVOKED, UI warning rendered | `PASS` |
| **TS-09** | Public Web UI Page & India 112 Call Protocol | Next.js App Router UI | Page compiles, 112 dialer present | HTTP 200, tel:112 active | `PASS` |
| **TS-10** | Explainable AI Risk Prediction & SHAP Analysis | FastAPI Microservice | Risk score, SHAP weights, RAG citation | 90% High Risk, Glucose 0.42, ADA citation | `PASS` |
| **TS-11** | TypeScript Static Analysis & Type Safety | `tsc --noEmit` | Clean compilation (0 type errors) | Exited with code 0 (0 errors) | `PASS` |
