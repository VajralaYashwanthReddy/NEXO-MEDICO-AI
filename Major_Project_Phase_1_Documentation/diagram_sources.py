import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, ArrowStyle
import os

os.makedirs('Major_Project_Phase_1_Documentation/Nexo_Medico_AI_Diagrams', exist_ok=True)
diag_dir = 'Major_Project_Phase_1_Documentation/Nexo_Medico_AI_Diagrams'

# Helper for rounded boxes
def draw_box(ax, xy, width, height, title, subtitle="", color="#1E293B", text_color="white", border_color="#38BDF8", fontsize=10, lw=1.5):
    x, y = xy
    box = FancyBboxPatch((x, y), width, height, boxstyle="round,pad=0.03,rounding_size=0.04",
                         facecolor=color, edgecolor=border_color, linewidth=lw, zorder=3)
    ax.add_patch(box)
    if subtitle:
        ax.text(x + width/2, y + height*0.62, title, color=text_color, fontsize=fontsize, weight='bold', ha='center', va='center', zorder=4)
        ax.text(x + width/2, y + height*0.28, subtitle, color="#94A3B8", fontsize=fontsize-2, ha='center', va='center', zorder=4)
    else:
        ax.text(x + width/2, y + height/2, title, color=text_color, fontsize=fontsize, weight='bold', ha='center', va='center', zorder=4)

def draw_arrow(ax, start, end, label="", color="#38BDF8", style="->", linestyle="-", lw=1.5, rad=0.0):
    connectionstyle = f"arc3,rad={rad}" if rad != 0.0 else "arc3,rad=0"
    ax.annotate("", xy=end, xytext=start,
                arrowprops=dict(arrowstyle=style, color=color, lw=lw, linestyle=linestyle, connectionstyle=connectionstyle), zorder=2)
    if label:
        mx = (start[0] + end[0]) / 2
        my = (start[1] + end[1]) / 2 + 0.025
        ax.text(mx, my, label, color="#E2E8F0", fontsize=8, ha='center', va='center', backgroundcolor='#0F172A', zorder=5)

# ==========================================
# 1. OVERALL SYSTEM ARCHITECTURE
# ==========================================
def generate_system_architecture():
    fig, ax = plt.subplots(figsize=(14, 9), facecolor="#0B0F19")
    ax.set_facecolor("#0B0F19")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    plt.title("NEXO MEDICO AI: END-TO-END SYSTEM ARCHITECTURE", color="#38BDF8", fontsize=14, weight='bold', pad=15)

    # 1. Client Layer
    ax.text(0.08, 0.92, "1. USER INTERACTION & CLIENT PRESENTATION TIER", color="#94A3B8", fontsize=10, weight='bold')
    draw_box(ax, (0.04, 0.76), 0.16, 0.12, "Patient Portal", "Dashboard & Universal EHR\nReact 18 / Tailwind CSS", "#1E293B", "#38BDF8")
    draw_box(ax, (0.23, 0.76), 0.16, 0.12, "Clinical Portal", "Doctor EHR & Prescriptions\nSpecialist Scheduling", "#1E293B", "#38BDF8")
    draw_box(ax, (0.42, 0.76), 0.16, 0.12, "Hospital Admin", "Staff, Wards, Beds & Analytics\nMulti-tenancy Management", "#1E293B", "#38BDF8")
    draw_box(ax, (0.61, 0.76), 0.16, 0.12, "Diagnostics & Rx", "Pharmacy Dispense & Lab OCR\nPathology Reporting", "#1E293B", "#38BDF8")
    draw_box(ax, (0.80, 0.76), 0.16, 0.12, "Emergency Triage", "Public Smartphone Scanner\nGPS Maps / India 112 Dial", "#881337", "#FDA4AF", border_color="#F43F5E")

    # 2. Next.js Core & Security Gateway
    ax.text(0.08, 0.66, "2. CORE APPLICATION SERVER & SECURITY GATEWAY (PORT 3000)", color="#94A3B8", fontsize=10, weight='bold')
    draw_box(ax, (0.04, 0.48), 0.42, 0.14, "Next.js 14 App Router API Gateway", "Authentication Middleware | Bcrypt Password Hashing\nRole-Based Access Control (RBAC) | JWT Minting", "#0F172A", "#F8FAFC", border_color="#0284C7")
    draw_box(ax, (0.50, 0.48), 0.46, 0.14, "Core Business Services & Validation", "Indian Address Normalization | 2FA OTP Challenge Engine\nSupport Ticketing SLA Engine | Emergency QR Token Resolver", "#0F172A", "#F8FAFC", border_color="#0284C7")

    # Connect client to gateway
    for cx in [0.12, 0.31, 0.50, 0.69, 0.88]:
        draw_arrow(ax, (cx, 0.76), (cx, 0.62), color="#64748B")

    # 3. AI Intelligence Tier & Microservice
    ax.text(0.08, 0.39, "3. EXPLAINABLE CLINICAL DECISION SUPPORT & AI SERVICE (PORT 8000)", color="#94A3B8", fontsize=10, weight='bold')
    draw_box(ax, (0.04, 0.22), 0.28, 0.13, "FastAPI Microservice", "ML Pipeline (Port 8000)\nUvicorn Asynchronous Runtime", "#14532D", "#86EFAC", border_color="#22C55E")
    draw_box(ax, (0.35, 0.22), 0.30, 0.13, "Risk Predictor & SHAP", "Multi-condition Risk Engines\nRF, XGBoost & Attribution Weights", "#14532D", "#86EFAC", border_color="#22C55E")
    draw_box(ax, (0.68, 0.22), 0.28, 0.13, "RAG & Grad-CAM Vision", "ADA/AHA Clinical Protocol Index\nChest X-Ray / MRI Attention Heatmaps", "#14532D", "#86EFAC", border_color="#22C55E")

    # Connect Gateway to AI
    draw_arrow(ax, (0.25, 0.48), (0.18, 0.35), "REST / JSON", color="#22C55E")
    draw_arrow(ax, (0.18, 0.35), (0.25, 0.48), "Inference Payload", color="#22C55E", rad=0.1)

    # 4. Persistence Tier & External Services
    ax.text(0.08, 0.14, "4. ENTERPRISE PERSISTENCE & EXTERNAL INTEGRATIONS", color="#94A3B8", fontsize=10, weight='bold')
    draw_box(ax, (0.04, 0.02), 0.38, 0.10, "PostgreSQL 16 Database", "Local Relational Storage | Prisma ORM Schema Engine\n33 Relational Models | Audit Logs & Indexing", "#1E1B4B", "#C7D2FE", border_color="#6366F1")
    draw_box(ax, (0.45, 0.02), 0.25, 0.10, "Gmail SMTP Gateway", "Dedicated TLS Relay (Port 587)\nOTP Verification & Support Dispatch", "#451A03", "#FDE68A", border_color="#F59E0B")
    draw_box(ax, (0.73, 0.02), 0.23, 0.10, "Emergency Helplines", "National 112 Quick Dispatch\nGoogle Maps Location Navigation", "#4C0519", "#FECDD3", border_color="#E11D48")

    # Connect Gateway to DB and external
    draw_arrow(ax, (0.25, 0.48), (0.23, 0.12), "Prisma Client (TCP 5432)", color="#6366F1")
    draw_arrow(ax, (0.60, 0.48), (0.57, 0.12), "Nodemailer SMTP", color="#F59E0B")
    draw_arrow(ax, (0.80, 0.48), (0.84, 0.12), "Geo & Tel Protocol", color="#E11D48")

    plt.tight_layout()
    plt.savefig(os.path.join(diag_dir, "Fig_4_1_System_Architecture.png"), dpi=300)
    plt.close()

# ==========================================
# 2. MODULE ARCHITECTURE
# ==========================================
def generate_module_architecture():
    fig, ax = plt.subplots(figsize=(14, 9), facecolor="#0B0F19")
    ax.set_facecolor("#0B0F19")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    plt.title("NEXO MEDICO AI: FUNCTIONAL MODULE SUBSYSTEM ARCHITECTURE", color="#38BDF8", fontsize=14, weight='bold', pad=15)

    modules = [
        ("M1: Identity & Authentication", "Bcrypt Hashing | 2FA OTP Engine\nJWT Sessions | Role-Based Access Control", 0.05, 0.72, "#0369A1"),
        ("M2: Patient Demographics & EHR", "Universal Patient ID | Indian Address\nMedical Timeline | Chronic History", 0.37, 0.72, "#0D9488"),
        ("M3: Emergency QR & Triage", "Unguessable Tokens | Consent Filtering\nRevocation Engine | India 112 Dialer", 0.69, 0.72, "#BE123C"),
        
        ("M4: Hospital Multi-Tenancy", "Hospital Onboarding | Registration No\nDepartment & Ward Bed Allocation", 0.05, 0.42, "#4338CA"),
        ("M5: Clinical Encounters & Rx", "Doctor Availability | Vitals Capture\nClinical Diagnosis | Prescription Items", 0.37, 0.42, "#15803D"),
        ("M6: Pharmacy & Drug Safety", "Inventory Tracking | Batch & Expiry\nDrug-Drug Interaction Warnings", 0.69, 0.42, "#B45309"),
        
        ("M7: Laboratory Diagnostics", "Test Orders | Specimen Tracking\nOCR Report Extraction | Verification", 0.05, 0.12, "#047857"),
        ("M8: AI Decision Support & RAG", "Multi-model Prediction | SHAP Attribution\nMedical Vision Grad-CAM | RAG Index", 0.37, 0.12, "#7E22CE"),
        ("M9: Support & Audit System", "SLA Tickets | Automatic Notifications\nFull Audit Trail | Platform Analytics", 0.69, 0.12, "#374151")
    ]

    for title, subtitle, x, y, border in modules:
        draw_box(ax, (x, y), 0.26, 0.20, title, subtitle, "#1E293B", "white", border_color=border, fontsize=9.5)

    # Draw inter-module connection buses
    draw_arrow(ax, (0.18, 0.72), (0.18, 0.62), color="#64748B")
    draw_arrow(ax, (0.50, 0.72), (0.50, 0.62), color="#64748B")
    draw_arrow(ax, (0.82, 0.72), (0.82, 0.62), color="#64748B")
    draw_arrow(ax, (0.18, 0.42), (0.18, 0.32), color="#64748B")
    draw_arrow(ax, (0.50, 0.42), (0.50, 0.32), color="#64748B")
    draw_arrow(ax, (0.82, 0.42), (0.82, 0.32), color="#64748B")

    plt.tight_layout()
    plt.savefig(os.path.join(diag_dir, "Fig_4_2_Module_Architecture.png"), dpi=300)
    plt.close()

# ==========================================
# 3. DATABASE ER DIAGRAM
# ==========================================
def generate_database_erd():
    fig, ax = plt.subplots(figsize=(15, 10), facecolor="#0B0F19")
    ax.set_facecolor("#0B0F19")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    plt.title("NEXO MEDICO AI: RELATIONAL ENTITY-RELATIONSHIP SCHEMA (POSTGRESQL / PRISMA)", color="#38BDF8", fontsize=14, weight='bold', pad=15)

    entities = [
        ("Hospital", "id (PK)\nname, registrationNo\nemail, phone, address\nstatus, bedCount", 0.03, 0.70, "#1E1B4B", "#818CF8"),
        ("User", "id (PK)\nemail (UQ), passwordHash\nname, role, status\nhospitalId (FK)", 0.23, 0.70, "#1E293B", "#38BDF8"),
        ("DoctorProfile", "id (PK)\nuserId (FK), hospitalId\nspecialization, slotConfig\nexperienceYears", 0.43, 0.70, "#1E293B", "#38BDF8"),
        ("Appointment", "id (PK)\nappointmentCode (UQ)\npatientId (FK), doctorId (FK)\ndate, timeSlot, status", 0.63, 0.70, "#1E293B", "#38BDF8"),
        ("Consultation", "id (PK)\nappointmentId (FK)\npatientId (FK), doctorId (FK)\nsymptoms, diagnosis, notes", 0.83, 0.70, "#1E293B", "#38BDF8"),

        ("Patient", "id (PK)\npatientCode (UQ), fullName\ndob, gender, bloodGroup\nallergies, conditions\nhouseFlat, villageWard\nmandalTaluk, pinCode", 0.23, 0.36, "#064E3B", "#34D399"),
        ("PatientEmergencyProfile", "id (PK)\npatientId (FK, UQ)\npublicToken (UQ), shortId (UQ)\nshareAddress, sharePhone\nshareDob, shareBloodGroup\nstatus, viewCount", 0.45, 0.36, "#881337", "#FB7185"),
        ("EmergencyProfileAudit", "id (PK)\nprofileId (FK), action\ndetails, ipAddress, userAgent\ntimestamp", 0.67, 0.36, "#881337", "#FB7185"),

        ("Prescription", "id (PK)\nprescriptionCode (UQ)\nconsultationId, patientId\ndoctorId, status", 0.83, 0.36, "#14532D", "#4ADE80"),
        ("PrescriptionItem", "id (PK)\nprescriptionId (FK)\nmedicineName, dosage\nfrequency, durationDays", 0.83, 0.05, "#14532D", "#4ADE80"),

        ("OtpChallenge", "id (PK)\nemail, purpose\notpHash, challengeToken (UQ)\nattempts, expiresAt, consumedAt", 0.03, 0.36, "#78350F", "#FBBF24"),
        ("SupportIssue", "id (PK)\nticketCode (UQ), email\nuserId, subject, priority\nstatus, emailStatus", 0.03, 0.05, "#374151", "#9CA3AF"),
        ("AIPredictionLog", "id (PK)\npatientId (FK), modelType\nriskScore, predictedCondition\nfeatureImportanceJson", 0.25, 0.05, "#581C87", "#C084FC"),
        ("LabOrder / Report", "id (PK)\norderCode (UQ), patientId\ntestName, ocrExtractedText\naiInterpretation, status", 0.52, 0.05, "#0F766E", "#2DD4BF")
    ]

    for title, fields, x, y, bg, border in entities:
        h = 0.22 if "Patient" in title or "Appointment" in title or "Hospital" in title else 0.18
        draw_box(ax, (x, y), 0.17, h, title, fields, bg, "white", border_color=border, fontsize=8)

    # Relationships
    draw_arrow(ax, (0.20, 0.79), (0.23, 0.79), "1 : N", color="#64748B")
    draw_arrow(ax, (0.40, 0.79), (0.43, 0.79), "1 : 1", color="#64748B")
    draw_arrow(ax, (0.60, 0.79), (0.63, 0.79), "1 : N", color="#64748B")
    draw_arrow(ax, (0.80, 0.79), (0.83, 0.79), "1 : 1", color="#64748B")
    draw_arrow(ax, (0.31, 0.70), (0.31, 0.58), "1 : 1 (Role=PATIENT)", color="#34D399")
    draw_arrow(ax, (0.40, 0.45), (0.45, 0.45), "1 : 1", color="#FB7185")
    draw_arrow(ax, (0.62, 0.45), (0.67, 0.45), "1 : N", color="#FB7185")
    draw_arrow(ax, (0.91, 0.70), (0.91, 0.54), "1 : N", color="#4ADE80")
    draw_arrow(ax, (0.91, 0.36), (0.91, 0.23), "1 : N", color="#4ADE80")

    plt.tight_layout()
    plt.savefig(os.path.join(diag_dir, "Fig_4_3_Database_ERD.png"), dpi=300)
    plt.close()

# ==========================================
# 4. USE CASE DIAGRAM
# ==========================================
def generate_usecase_diagram():
    fig, ax = plt.subplots(figsize=(14, 9), facecolor="#0B0F19")
    ax.set_facecolor("#0B0F19")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    plt.title("NEXO MEDICO AI: ROLE-BASED ACTOR USE-CASE DIAGRAM", color="#38BDF8", fontsize=14, weight='bold', pad=15)

    # Boundary Box
    system_box = FancyBboxPatch((0.24, 0.04), 0.52, 0.90, boxstyle="round,pad=0.02,rounding_size=0.03",
                                facecolor="#0F172A", edgecolor="#38BDF8", linewidth=2, linestyle='--')
    ax.add_patch(system_box)
    ax.text(0.50, 0.91, "NEXO MEDICO AI PLATFORM BOUNDARY", color="#38BDF8", fontsize=11, weight='bold', ha='center')

    # Actors Left
    actors_left = [
        ("Patient Actor", 0.03, 0.75, "#0D9488"),
        ("Doctor Actor", 0.03, 0.48, "#16A34A"),
        ("Paramedic / First Responder", 0.03, 0.20, "#E11D48")
    ]
    for name, x, y, c in actors_left:
        draw_box(ax, (x, y), 0.16, 0.12, name, "External User", "#1E293B", c, border_color=c)

    # Actors Right
    actors_right = [
        ("Hospital Admin", 0.81, 0.75, "#4F46E5"),
        ("Pharmacist / Lab Tech", 0.81, 0.48, "#D97706"),
        ("Super Admin", 0.81, 0.20, "#7C3AED")
    ]
    for name, x, y, c in actors_right:
        draw_box(ax, (x, y), 0.16, 0.12, name, "Administrative Actor", "#1E293B", c, border_color=c)

    # Use Cases inside system boundary
    usecases = [
        ("UC-1: Self-Register with Indian Address & 2FA OTP", 0.28, 0.80),
        ("UC-2: View Universal EHR & Medical History Timeline", 0.28, 0.70),
        ("UC-3: Manage Emergency QR & Granular Privacy Flags", 0.28, 0.60),
        ("UC-4: Clinical Encounter, Vitals & Prescriptions", 0.28, 0.50),
        ("UC-5: Run Explainable AI Disease Risk Predictor", 0.28, 0.40),
        ("UC-6: Scan Public Emergency QR & Access Triage Data", 0.28, 0.30),
        ("UC-7: Dispense Medicines & Check Drug Interactions", 0.28, 0.20),
        ("UC-8: Manage Hospitals, SLA Tickets & Platform Audit", 0.28, 0.10)
    ]

    for title, x, y in usecases:
        box = FancyBboxPatch((x, y), 0.44, 0.07, boxstyle="round,pad=0.02,rounding_size=0.03",
                             facecolor="#1E293B", edgecolor="#64748B", linewidth=1.2)
        ax.add_patch(box)
        ax.text(x + 0.22, y + 0.035, title, color="white", fontsize=8.5, weight='bold', ha='center', va='center')

    # Draw associations
    draw_arrow(ax, (0.19, 0.81), (0.28, 0.83), color="#0D9488")
    draw_arrow(ax, (0.19, 0.81), (0.28, 0.73), color="#0D9488")
    draw_arrow(ax, (0.19, 0.81), (0.28, 0.63), color="#0D9488")
    draw_arrow(ax, (0.19, 0.54), (0.28, 0.53), color="#16A34A")
    draw_arrow(ax, (0.19, 0.54), (0.28, 0.43), color="#16A34A")
    draw_arrow(ax, (0.19, 0.26), (0.28, 0.33), color="#E11D48")

    draw_arrow(ax, (0.81, 0.81), (0.72, 0.53), color="#4F46E5")
    draw_arrow(ax, (0.81, 0.54), (0.72, 0.23), color="#D97706")
    draw_arrow(ax, (0.81, 0.26), (0.72, 0.13), color="#7C3AED")

    plt.tight_layout()
    plt.savefig(os.path.join(diag_dir, "Fig_4_4_Usecase_Diagram.png"), dpi=300)
    plt.close()

# ==========================================
# 5. DATA FLOW DIAGRAM LEVEL 1
# ==========================================
def generate_dfd_level_1():
    fig, ax = plt.subplots(figsize=(14, 9), facecolor="#0B0F19")
    ax.set_facecolor("#0B0F19")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    plt.title("NEXO MEDICO AI: LEVEL-1 DATA FLOW DIAGRAM (DFD)", color="#38BDF8", fontsize=14, weight='bold', pad=15)

    # Entities
    draw_box(ax, (0.04, 0.70), 0.16, 0.15, "Patient", "[External Entity]", "#1E293B", "#38BDF8")
    draw_box(ax, (0.04, 0.20), 0.16, 0.15, "Doctor", "[External Entity]", "#1E293B", "#34D399")
    draw_box(ax, (0.80, 0.70), 0.16, 0.15, "Paramedic / Lens", "[External Entity]", "#1E293B", "#FB7185")
    draw_box(ax, (0.80, 0.20), 0.16, 0.15, "Super Admin", "[External Entity]", "#1E293B", "#C084FC")

    # Processes
    draw_box(ax, (0.30, 0.72), 0.18, 0.12, "P1.0: Registration & 2FA", "OTP Bcrypt Verification", "#0F172A", "white", border_color="#38BDF8")
    draw_box(ax, (0.30, 0.45), 0.18, 0.12, "P2.0: Clinical Encounter", "EHR, Vitals & Diagnostics", "#0F172A", "white", border_color="#34D399")
    draw_box(ax, (0.54, 0.72), 0.18, 0.12, "P3.0: Emergency Resolver", "Token Allowlist & Filtering", "#0F172A", "white", border_color="#FB7185")
    draw_box(ax, (0.54, 0.45), 0.18, 0.12, "P4.0: AI Clinical Decision", "RF / XGBoost / SHAP / Vision", "#0F172A", "white", border_color="#C084FC")

    # Data Stores
    draw_box(ax, (0.42, 0.18), 0.18, 0.10, "D1: PostgreSQL Database", "Patient, Consult, Rx, QR, Tickets", "#1E1B4B", "#C7D2FE", border_color="#6366F1")
    draw_box(ax, (0.42, 0.03), 0.18, 0.08, "D2: Audit & Telemetry", "EmergencyProfileAudit, Logs", "#1E1B4B", "#C7D2FE", border_color="#6366F1")

    # Data Flows
    draw_arrow(ax, (0.20, 0.78), (0.30, 0.78), "Demographics, Phone, PIN")
    draw_arrow(ax, (0.39, 0.72), (0.45, 0.28), "Store User & Patient")
    draw_arrow(ax, (0.20, 0.28), (0.30, 0.48), "Symptoms, Vitals")
    draw_arrow(ax, (0.39, 0.45), (0.47, 0.28), "Save Consultation")
    draw_arrow(ax, (0.48, 0.48), (0.54, 0.48), "Predict Request")
    draw_arrow(ax, (0.54, 0.54), (0.48, 0.54), "Risk & SHAP Explainability", rad=-0.1)
    draw_arrow(ax, (0.80, 0.78), (0.72, 0.78), "Scan QR Token (emg_...)")
    draw_arrow(ax, (0.54, 0.76), (0.49, 0.28), "Query Active Token")
    draw_arrow(ax, (0.72, 0.74), (0.80, 0.74), "Triage Vitals & 112 Call")
    draw_arrow(ax, (0.63, 0.72), (0.52, 0.11), "Log View Audit")

    plt.tight_layout()
    plt.savefig(os.path.join(diag_dir, "Fig_4_5_Data_Flow_Diagram_Level_1.png"), dpi=300)
    plt.close()

# ==========================================
# 6. SEQUENCE: REGISTRATION AND 2FA
# ==========================================
def generate_sequence_registration():
    fig, ax = plt.subplots(figsize=(14, 9), facecolor="#0B0F19")
    ax.set_facecolor("#0B0F19")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    plt.title("NEXO MEDICO AI: PATIENT REGISTRATION & 2FA OTP SEQUENCE DIAGRAM", color="#38BDF8", fontsize=14, weight='bold', pad=15)

    lifelines = [
        ("Patient Browser", 0.10),
        ("Register API (/api/auth/...)", 0.35),
        ("OtpService & Nodemailer", 0.60),
        ("PostgreSQL Database", 0.88)
    ]

    for name, x in lifelines:
        draw_box(ax, (x - 0.08, 0.85), 0.16, 0.07, name, "", "#1E293B", "#38BDF8", border_color="#38BDF8", fontsize=9)
        ax.plot([x, x], [0.85, 0.05], color="#334155", linestyle="--", lw=1.5, zorder=1)

    steps = [
        (0.80, 0.10, 0.35, "1: Submit Registration Form (Demographics, Indian Address, Password)", "->"),
        (0.74, 0.35, 0.60, "2: createOtpChallenge(email, 'REGISTRATION')", "->"),
        (0.68, 0.60, 0.88, "3: Store Bcrypt Hash & challengeToken in OtpChallenge table", "->"),
        (0.62, 0.60, 0.10, "4: Dispatch 6-digit OTP code to registered Gmail via SMTP", "->"),
        (0.56, 0.35, 0.10, "5: Return HTTP 200 with challengeToken & open OTP Modal", "-->"),
        (0.48, 0.10, 0.35, "6: Submit 6-digit OTP verification code + challengeToken", "->"),
        (0.42, 0.35, 0.88, "7: verifyOtpChallenge(): verify bcrypt hash & mark consumed", "->"),
        (0.34, 0.35, 0.88, "8: Atomic Transaction: Create User, Patient, and EmergencyProfile", "->"),
        (0.26, 0.88, 0.35, "9: Return Generated Universal ID (NEXO-PAT-...) & Secret Token (emg_...)", "-->"),
        (0.18, 0.35, 0.10, "10: Sign JWT Session, set httpOnly cookie & redirect to Dashboard", "-->")
    ]

    for y, x1, x2, msg, style in steps:
        draw_arrow(ax, (x1, y), (x2, y), "", color="#38BDF8" if style=="->" else "#34D399", style="->", linestyle="--" if style=="-->" else "-", lw=1.3)
        mx = (x1 + x2) / 2
        ax.text(mx, y + 0.02, msg, color="#F8FAFC", fontsize=8, ha='center', va='bottom', backgroundcolor="#0F172A", zorder=4)

    plt.tight_layout()
    plt.savefig(os.path.join(diag_dir, "Fig_4_6_Sequence_Registration_and_2FA.png"), dpi=300)
    plt.close()

# ==========================================
# 7. SEQUENCE: EMERGENCY QR WORKFLOW
# ==========================================
def generate_sequence_emergency_qr():
    fig, ax = plt.subplots(figsize=(14, 9), facecolor="#0B0F19")
    ax.set_facecolor("#0B0F19")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    plt.title("NEXO MEDICO AI: EMERGENCY QR SCAN & PUBLIC TRIAGE SEQUENCE DIAGRAM", color="#38BDF8", fontsize=14, weight='bold', pad=15)

    lifelines = [
        ("Paramedic Smartphone", 0.10),
        ("Public Route (/emergency/[token])", 0.35),
        ("emergencyQrService", 0.60),
        ("PostgreSQL Database", 0.88)
    ]

    for name, x in lifelines:
        draw_box(ax, (x - 0.08, 0.85), 0.16, 0.07, name, "", "#1E293B", "#FB7185", border_color="#FB7185", fontsize=9)
        ax.plot([x, x], [0.85, 0.05], color="#334155", linestyle="--", lw=1.5, zorder=1)

    steps = [
        (0.80, 0.10, 0.35, "1: Scan Physical QR Sticker / Helmet Tag (HTTPS Destination)", "->"),
        (0.72, 0.35, 0.60, "2: resolvePublicEmergencyProfile(token, { ip, userAgent })", "->"),
        (0.64, 0.60, 0.88, "3: SELECT Patient, EmergencyProfile WHERE publicToken = token", "->"),
        (0.56, 0.88, 0.60, "4: Return Record; verify status != 'REVOKED'", "-->"),
        (0.48, 0.60, 0.88, "5: Asynchronously log audit: action='VIEWED' & increment viewCount", "->"),
        (0.40, 0.60, 0.35, "6: Filter PII based on patient consent flags (shareAddress, sharePhone, etc.)", "-->"),
        (0.30, 0.35, 0.10, "7: Render Mobile Triage Profile: Blood Group, Drug Allergies, India 112 Banner", "-->"),
        (0.20, 0.10, 0.10, "8: First responder dials Kin or taps 'Call 112 Emergency Dispatch'", "->")
    ]

    for y, x1, x2, msg, style in steps:
        if x1 == x2: # self call
            draw_box(ax, (x1 - 0.06, y - 0.03), 0.20, 0.05, msg, "", "#881337", "#FECDD3", border_color="#F43F5E", fontsize=7.5)
        else:
            draw_arrow(ax, (x1, y), (x2, y), "", color="#FB7185" if style=="->" else "#34D399", style="->", linestyle="--" if style=="-->" else "-", lw=1.3)
            mx = (x1 + x2) / 2
            ax.text(mx, y + 0.02, msg, color="#F8FAFC", fontsize=8, ha='center', va='bottom', backgroundcolor="#0F172A", zorder=4)

    plt.tight_layout()
    plt.savefig(os.path.join(diag_dir, "Fig_4_7_Sequence_Emergency_QR_Workflow.png"), dpi=300)
    plt.close()

# ==========================================
# 8. SEQUENCE: CLINICAL DECISION SUPPORT
# ==========================================
def generate_sequence_clinical_decision():
    fig, ax = plt.subplots(figsize=(14, 9), facecolor="#0B0F19")
    ax.set_facecolor("#0B0F19")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    plt.title("NEXO MEDICO AI: EXPLAINABLE CLINICAL DECISION SUPPORT SEQUENCE DIAGRAM", color="#38BDF8", fontsize=14, weight='bold', pad=15)

    lifelines = [
        ("Doctor Portal", 0.10),
        ("Next.js App Server", 0.35),
        ("FastAPI Microservice (8000)", 0.62),
        ("PostgreSQL Database", 0.88)
    ]

    for name, x in lifelines:
        draw_box(ax, (x - 0.08, 0.85), 0.16, 0.07, name, "", "#1E293B", "#C084FC", border_color="#C084FC", fontsize=9)
        ax.plot([x, x], [0.85, 0.05], color="#334155", linestyle="--", lw=1.5, zorder=1)

    steps = [
        (0.80, 0.10, 0.35, "1: Doctor records patient symptoms, BP, Glucose, BMI in Encounter", "->"),
        (0.72, 0.35, 0.62, "2: POST /api/predict/disease (conditionType, patientAge, vitals)", "->"),
        (0.64, 0.62, 0.62, "3: Calculate Clinical Risk & Compute SHAP Feature Importance Attribution", "->"),
        (0.56, 0.62, 0.35, "4: Return Risk%, Feature Impact Array & Explainability Narrative", "-->"),
        (0.48, 0.35, 0.62, "5: POST /api/rag/query (Guideline protocol verification)", "->"),
        (0.40, 0.62, 0.35, "6: Return ADA/AHA Evidence Citations & Recommended Pharmacotherapy", "-->"),
        (0.32, 0.35, 0.88, "7: Check Drug-Drug Interactions & Store AIPredictionLog", "->"),
        (0.22, 0.35, 0.10, "8: Render Explainable Insights, SHAP Chart, and Drug Warnings to Physician", "-->"),
        (0.12, 0.10, 0.88, "9: Doctor approves clinical decision & signs digital Prescription", "->")
    ]

    for y, x1, x2, msg, style in steps:
        if x1 == x2:
            draw_box(ax, (x1 - 0.08, y - 0.03), 0.28, 0.05, msg, "", "#581C87", "#E9D5FF", border_color="#C084FC", fontsize=7.5)
        else:
            draw_arrow(ax, (x1, y), (x2, y), "", color="#C084FC" if style=="->" else "#34D399", style="->", linestyle="--" if style=="-->" else "-", lw=1.3)
            mx = (x1 + x2) / 2
            ax.text(mx, y + 0.02, msg, color="#F8FAFC", fontsize=8, ha='center', va='bottom', backgroundcolor="#0F172A", zorder=4)

    plt.tight_layout()
    plt.savefig(os.path.join(diag_dir, "Fig_4_8_Sequence_Clinical_Decision_Support.png"), dpi=300)
    plt.close()

# ==========================================
# 9. ACTIVITY: EMERGENCY TRIAGE WORKFLOW
# ==========================================
def generate_activity_emergency_triage():
    fig, ax = plt.subplots(figsize=(13, 9), facecolor="#0B0F19")
    ax.set_facecolor("#0B0F19")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    plt.title("NEXO MEDICO AI: EMERGENCY TRIAGE & QR SCANNING ACTIVITY WORKFLOW", color="#38BDF8", fontsize=14, weight='bold', pad=15)

    # Activity Nodes
    draw_box(ax, (0.40, 0.88), 0.20, 0.06, "[Start] First Responder Scans QR", "", "#0284C7", "white", border_color="#38BDF8", fontsize=9)
    draw_box(ax, (0.35, 0.77), 0.30, 0.06, "Browser opens HTTPS Emergency URL", "/emergency/[token]", "#1E293B", "#F8FAFC")
    draw_box(ax, (0.35, 0.66), 0.30, 0.06, "Backend Resolves Token in Database", "Check Token Existence & Status", "#1E293B", "#F8FAFC")

    # Decision Diamond 1: Status
    draw_box(ax, (0.38, 0.53), 0.24, 0.07, "Is Token Valid & Active?", "[Decision Check]", "#4338CA", "#A5B4FC", border_color="#818CF8")

    # Left Branch: Revoked or Invalid
    draw_box(ax, (0.05, 0.40), 0.26, 0.08, "Render Unavailable / Revoked Notice", "PII Redacted | Display 112 Helpline", "#881337", "#FECDD3", border_color="#F43F5E")
    
    # Right Branch: Active
    draw_box(ax, (0.69, 0.40), 0.26, 0.08, "Enforce Server-side Privacy Flags", "Filter Name, Phone, Address, DOB", "#065F46", "#A7F3D0", border_color="#34D399")

    # Merge into display
    draw_box(ax, (0.35, 0.26), 0.30, 0.08, "Render Mobile Emergency Passport", "Blood Group | Drug Allergies Alert\nNext of Kin Contact | Residential Address", "#1E293B", "#38BDF8")

    # Actions available to bystander
    draw_box(ax, (0.15, 0.12), 0.30, 0.07, "One-Touch Kin Phone Call", "Opens tel: URI on smartphone", "#0F766E", "#99F6E4", border_color="#2DD4BF")
    draw_box(ax, (0.55, 0.12), 0.30, 0.07, "National 112 Dispatch Call", "Direct paramedic escalation", "#9F1239", "#FECDD3", border_color="#F43F5E")
    draw_box(ax, (0.40, 0.01), 0.20, 0.05, "[End] Triage Protocol Completed", "", "#334155", "#CBD5E1", border_color="#64748B", fontsize=8.5)

    # Connections
    draw_arrow(ax, (0.50, 0.88), (0.50, 0.83))
    draw_arrow(ax, (0.50, 0.77), (0.50, 0.72))
    draw_arrow(ax, (0.50, 0.66), (0.50, 0.60))

    draw_arrow(ax, (0.38, 0.56), (0.18, 0.48), "No / Revoked", color="#F43F5E")
    draw_arrow(ax, (0.62, 0.56), (0.82, 0.48), "Yes [Active]", color="#34D399")

    draw_arrow(ax, (0.82, 0.40), (0.65, 0.30), "Allowlisted Data", color="#34D399")
    draw_arrow(ax, (0.18, 0.40), (0.35, 0.30), "Revocation Notice", color="#F43F5E")

    draw_arrow(ax, (0.45, 0.26), (0.30, 0.19))
    draw_arrow(ax, (0.55, 0.26), (0.70, 0.19))
    draw_arrow(ax, (0.30, 0.12), (0.45, 0.06))
    draw_arrow(ax, (0.70, 0.12), (0.55, 0.06))

    plt.tight_layout()
    plt.savefig(os.path.join(diag_dir, "Fig_4_9_Activity_Emergency_Triage.png"), dpi=300)
    plt.close()

# ==========================================
# 10. DEPLOYMENT DIAGRAM
# ==========================================
def generate_deployment_diagram():
    fig, ax = plt.subplots(figsize=(14, 9), facecolor="#0B0F19")
    ax.set_facecolor("#0B0F19")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    plt.title("NEXO MEDICO AI: RUNTIME SYSTEM DEPLOYMENT TOPOLOGY", color="#38BDF8", fontsize=14, weight='bold', pad=15)

    # Node 1: Client Devices
    draw_box(ax, (0.04, 0.50), 0.25, 0.40, "<<Device>> Client Tier", "Desktop & Smartphone Browsers\nGoogle Chrome / Apple Safari\nReact 18 SPA Presentation\nCamera Lens QR Scanner", "#1E293B", "#38BDF8", border_color="#38BDF8")

    # Node 2: Web / Application Server
    draw_box(ax, (0.37, 0.50), 0.30, 0.40, "<<Server>> Node.js Host", "Next.js 14 App Router (Port 3000)\nEdge API Middleware & Gateway\nNodemailer SMTP Dispatch Engine\nPrisma ORM Query Engine (DLL)\nJWT Session & Security Filter", "#0F172A", "#F8FAFC", border_color="#0284C7")

    # Node 3: AI Inference Server
    draw_box(ax, (0.73, 0.50), 0.24, 0.40, "<<Server>> AI Compute Node", "Python 3.10+ FastAPI (Port 8000)\nUvicorn Asynchronous Server\nScikit-Learn, PyTorch, Pillow\nSHAP Feature Attribution\nGrad-CAM Attention Heatmaps", "#14532D", "#86EFAC", border_color="#22C55E")

    # Node 4: Database Server
    draw_box(ax, (0.37, 0.05), 0.30, 0.35, "<<Database>> Data Node", "PostgreSQL 16 (Port 5432)\nLocal Host / Cloud Managed\n33 Relational Tables\nBcrypt Hashes, Tokens, Audit Logs\nACID Transaction Manager", "#1E1B4B", "#C7D2FE", border_color="#6366F1")

    # Node 5: External Mail Server
    draw_box(ax, (0.73, 0.05), 0.24, 0.35, "<<External Service>> Mail Agent", "Google Workspace / Gmail SMTP\nsmtp.gmail.com (Port 587)\nSTARTTLS Encryption\nApp Password Authentication\nOTP Verification & Alerts", "#451A03", "#FDE68A", border_color="#F59E0B")

    # Connection lines
    draw_arrow(ax, (0.29, 0.70), (0.37, 0.70), "HTTPS / WSS (Port 443 / 3000)", color="#38BDF8")
    draw_arrow(ax, (0.67, 0.70), (0.73, 0.70), "Internal HTTP (Port 8000)", color="#22C55E")
    draw_arrow(ax, (0.52, 0.50), (0.52, 0.40), "Prisma TCP (Port 5432)", color="#6366F1")
    draw_arrow(ax, (0.67, 0.55), (0.73, 0.25), "SMTP Protocol (Port 587)", color="#F59E0B")

    plt.tight_layout()
    plt.savefig(os.path.join(diag_dir, "Fig_4_10_Deployment_Diagram.png"), dpi=300)
    plt.close()

if __name__ == "__main__":
    generate_system_architecture()
    generate_module_architecture()
    generate_database_erd()
    generate_usecase_diagram()
    generate_dfd_level_1()
    generate_sequence_registration()
    generate_sequence_emergency_qr()
    generate_sequence_clinical_decision()
    generate_activity_emergency_triage()
    generate_deployment_diagram()
    print("All 10 professional system diagrams successfully generated in high resolution!")
