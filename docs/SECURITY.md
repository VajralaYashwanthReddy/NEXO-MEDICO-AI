# Nexo Medico AI — Security Architecture & Data Governance Policy

## 1. Security Philosophy & Healthcare Compliance

Healthcare platforms handle highly sensitive **Protected Health Information (PHI)**. Nexo Medico AI is engineered adhering to key principles outlined in international healthcare information security standards (HIPAA Security Rule) and India's **Digital Information Security in Healthcare Act (DISHA)**:

1. **Principle of Least Privilege**: Users only have access to records and operations strictly required for their specific clinical role.
2. **Zero-Trust Emergency Triage**: Emergency QR tokens resolve strictly lifesaving medical parameters without granting access to confidential longitudinal charts or identity records.
3. **Cryptographic Defense-in-Depth**: Passwords, OTP challenges, session tokens, and communication channels utilize industry-standard cryptographic primitives.
4. **Absolute Data Segregation**: Institutional boundaries are enforced at the database query level to prevent multi-tenant cross-contamination.

---

## 2. Authentication & Identity Verification

### 2.1 Password Hashing & Salting
- **Algorithm**: `bcryptjs` with a work/cost factor of **10**.
- **Implementation**: Plaintext passwords are never logged, transmitted in cleartext, or persisted in PostgreSQL.

### 2.2 Two-Factor Authentication (2FA) OTP Engine
- **Generation**: Cryptographically secure 6-digit integers generated via Node.js `crypto.randomInt(100000, 999999)`.
- **Database Storage**: The raw OTP code is **never** stored in the database. Instead, the server computes a `SHA-256` hash of the OTP and stores the digest in `OtpChallenge`.
- **Expiration**: Strict 10-minute Time-To-Live (TTL). Expired challenges are automatically rejected.
- **Timing Attack Mitigation**: Verified using constant-time string comparison (`crypto.timingSafeEqual`) to prevent side-channel timing attacks.
- **Single-Use Invalidation**: Once verified, the challenge record is immediately marked `verified = true`, preventing replay attacks.

### 2.3 Session & Token Management
- **Token Type**: JSON Web Tokens (JWT) signed using HMAC-SHA256 with a high-entropy secret (`JWT_SECRET`).
- **Storage**: Transmitted exclusively via `HttpOnly`, `SameSite=Strict`, and `Secure` cookies.
- **Client Shielding**: JavaScript running in the browser cannot read or extract the session cookie, eliminating XSS token theft vectors.

---

## 3. Privacy-Preserving Emergency QR Architecture

Emergency medical identification requires balancing **instant bystander accessibility** with **patient privacy**:

```
+-----------------------------------------------------------------------------------+
|                           EMERGENCY QR SCAN (Smartphone)                          |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|               Public Endpoint: GET /api/emergency/qr/[token]                      |
|  - Token is 64-character unguessable hex (256-bit entropy)                        |
|  - No authentication cookie or credentials required                               |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                   STRICT DATABASE PROJECTION (Prisma Query)                       |
|                                                                                   |
|  [ALLOWED] Public Emergency Profile:       [EXCLUDED] Confidential Patient Data:  |
|  - Patient First Name / Universal ID       - Full Street Address & Home City      |
|  - Blood Group & Critical Allergies        - Login Credentials & Password Hash    |
|  - Chronic Conditions (e.g., Diabetes)     - Full Doctor Consultation Notes       |
|  - Emergency Contact Name & Phone          - Complete Longitudinal Lab History    |
|                                            - Financial / Insurance Records        |
+-----------------------------------------------------------------------------------+
```

- **Brute-Force Resistance**: 64-character hexadecimal tokens provide $16^{64} = 2^{256}$ possible combinations, making brute-force enumeration mathematically infeasible.
- **Audit Logging**: Every emergency resolution event logs the client IP address, timestamp, and user-agent into the `EmergencyAccessLog` table for patient visibility.

---

## 4. Multi-Tenant Relational Isolation

- **Organizational Partitioning**: Models representing hospital-specific infrastructure (`Ward`, `Bed`, `Admission`, `Doctor`, `Prescription`) enforce a foreign key relationship to `Hospital`.
- **Query Scoping**: Application route handlers explicitly include `where: { hospitalId: session.user.hospitalId }` in Prisma queries, ensuring that clinicians or admins in Hospital A cannot query or mutate records belonging to Hospital B.

---

## 5. Environment Variables & Secret Hygiene

- **Rule 1**: Real credentials, SMTP passwords, Google App Passwords, and database URLs must **never** be committed to version control.
- **Rule 2**: All sensitive environment files (`.env`, `.env.local`, `.env.production`) are excluded by `.gitignore`.
- **Rule 3**: `.env.example` contains exclusively generic placeholders with no actual secret values.
- **Rule 4**: In the event that a credential was previously exposed in version control, standard security procedure dictates that the credential must be **rotated immediately** at the provider (e.g., Google Account or Neon Database console).

---

## 6. Vulnerability Reporting

If you identify a security vulnerability in Nexo Medico AI, please report it privately to the project maintainers rather than opening a public issue. Maintainers will review and address security disclosures promptly.
