# Contour Legal Scaffold & Zambian Regulatory Compliance Schedule

This document serves as the canonical legal schedule and drafting specification for **Contour Real Estate Operations System** and its client document upload portal. It establishes explicit statutory compliance under the laws of the **Republic of Zambia**.

---

## 1. Executive Statutory Mapping

Contour transitions all legal covenants from South African POPIA to the Zambian statutory framework:

| Domain | South African Reference (Deprecated) | Zambian Statutory Authority (Active) | Regulatory Body |
|---|---|---|---|
| **Data Protection & Privacy** | POPIA No. 4 of 2013 | **Data Protection Act No. 3 of 2021 (DPA)** | Office of the Data Protection Commissioner (ODPC) |
| **Electronic Deeds & Signatures** | ECTA No. 25 of 2002 | **Electronic Communications & Transactions (ECT) Act No. 4 of 2021** | ZICTA & Ministry of Technology and Science |
| **Land Titles & Folios** | Deeds Registries Act No. 47 of 1937 | **Lands and Deeds Registry Act (Chapter 185, Laws of Zambia)** | Ministry of Lands and Natural Resources |
| **Anti-Money Laundering & KYC** | FICA No. 38 of 2001 | **Financial Intelligence Centre (FIC) Act No. 46 of 2010** (as amended) | Financial Intelligence Centre (FIC Zambia) |

---

## 2. Schedule A: Terms of Use Breakdown & Compliance Goals

```
SCHEDULE A: CONTOUR PLATFORM & CLIENT UPLOAD PORTAL TERMS OF USE
Governing Law: Republic of Zambia | Jurisdiction: High Court of Zambia (Commercial Division)
```

### Required Clauses & Statutory Checklist

#### Clause 1: Legal Identity & Roles
- **Statutory Reference**: Section 15 of Zambia DPA 2021.
- **Content**: Distinguishes the **Technology Provider / Data Processor** (Contour / Banya Labs) from the **Data Controller** (the individual real estate brokerage or agency).
- **Checklist Item**:
  - [ ] State agency's registered PACRA (Patents and Companies Registration Agency) company name.
  - [ ] State agency's physical domicile address in Zambia.

#### Clause 2: Digital Assent & Electronic Execution
- **Statutory Reference**: Section 30 of ECT Act No. 4 of 2021.
- **Content**: Expressly recognizes that clicking "Upload Documents", entering an access PIN, or checking the consent box constitutes a valid electronic transaction with legal evidentiary weight in Zambian courts.
- **Checklist Item**:
  - [ ] Affirms digital assent satisfies Section 30 of the ECT Act.

#### Clause 3: Permitted Use & Document Custody
- **Statutory Reference**: Lands and Deeds Registry Act (Cap 185).
- **Content**: Platform usage is strictly limited to real estate marketing, tenancy administration, valuation, conveyancing diligence, and FIC KYC requirements.
- **Checklist Item**:
  - [ ] Explicit disclaimer: Storing a Certificate of Title digital scan in Contour does not supersede or replace the physical Certificate of Title held by the Registrar of Lands and Deeds.

#### Clause 4: Client Upload Portal Warranties
- **Statutory Reference**: Section 21 of Zambia DPA 2021.
- **Content**: When a client (buyer, tenant, or landlord) submits a document:
  - The client warrants that the document (NRC, Passport, ZESCO bill, Title Deed) is genuine and unmanipulated.
  - The client warrants they possess legal capacity to provide the documentation.
- **Checklist Item**:
  - [ ] Warning that falsifying National Registration Cards or Title Deeds is an offense under the Penal Code Act (Cap 87).

#### Clause 5: Data Sovereignty & Anti-Poaching Guarantee
- **Content**: The agency and its clients retain 100% proprietary ownership of their documents. Neither Contour nor any subprocessor acquires commercial rights or AI training rights over tenant deeds or NRC scans.
- **Checklist Item**:
  - [ ] Strict multi-tenant isolation clause guaranteeing data is never aggregated across competitor agencies.

#### Clause 6: Limitation of Liability & Zambian Infrastructure Fallbacks
- **Content**: Accounts for regional operating conditions (e.g. ZESCO national grid load-shedding, intermittent telecom fiber cuts).
- **Checklist Item**:
  - [ ] Parties agree that offline SQLite replication (PowerSync) and cloud synchronization operate on best-effort commercial standards during public utility downtime.

#### Clause 7: Dispute Resolution & Arbitration
- **Statutory Reference**: Arbitration Act No. 19 of 2000 of Zambia.
- **Content**: Any commercial dispute arising between the agency and the platform shall first be resolved through good-faith negotiation (14 days), failing which it shall be referred to final arbitration in Lusaka, Zambia under the Zambian Arbitration Act.
- **Checklist Item**:
  - [ ] Forum: Lusaka, Zambia; Language: English; Arbiter: Chartered Institute of Arbitrators (Zambia Branch).

---

## 3. Schedule B: Privacy Policy Breakdown (Zambia DPA 2021)

```
SCHEDULE B: PRIVACY POLICY & DATA SUBJECT RIGHTS DECLARATION
Supervisory Authority: Office of the Data Protection Commissioner (ODPC), Lusaka, Zambia
```

### Article-by-Article Statutory Alignment

#### Section 1: Controller & Data Protection Officer (DPO) Details
- **DPA Requirement**: Section 15(a), (b) & Section 41.
- **Content**: Agency contact details and designated DPO contact email.

#### Section 2: Categories of Personal Data & Sensitive Data
- **DPA Requirement**: Section 15(d) & Section 22.
- **Breakdown**:
  - *Standard Personal Data*: Full names, telephone numbers, residential physical addresses, email addresses.
  - *Sensitive Personal Data*: National Registration Card (NRC) numbers, passport scans with biometric photos, marital status on title deeds, bank account remittance numbers.
- **Checklist Item**:
  - [ ] Sensitive data must be marked `CONFIDENTIAL_PII` and stored with AES-256 encryption.

#### Section 3: Legal Basis for Processing
- **DPA Requirement**: Section 21.
- **Processing Grounds**:
  1. **Performance of a Contract**: Necessary to prepare tenancy leases, sale agreements, and property inspection reports.
  2. **Statutory Obligation**: Compliance with the Financial Intelligence Centre (FIC) Act for anti-money laundering and property transaction reporting.
  3. **Explicit Consent**: Captured digitally on the Client Upload Portal before files stream to storage.

#### Section 4: Cross-Border Transfers & Storage Sovereignty
- **DPA Requirement**: Sections 34–36.
- **Content**: Discloses that encrypted files are hosted in self-hosted Dokploy / MinIO clusters with strict end-to-end TLS 1.3 encryption and automated offsite backups.
- **Checklist Item**:
  - [ ] Explicitly state physical server regions and adequacy safeguards.

#### Section 5: Mandatory Statutory Retention Period
- **DPA Requirement**: Section 26.
- **Policy**: Real estate transactions and conveyancing documents must be retained for **seven (7) years** following the closing of a transaction or lease termination, to satisfy Zambian Revenue Authority (ZRA) and Lands audit periods.
- **Checklist Item**:
  - [ ] Archived property vaults remain locked in custodial read-only mode for 7 years before scheduled certified erasure.

#### Section 6: Data Subject Rights
- **DPA Requirement**: Sections 28–33.
- **Client Rights**:
  - **Right of Access (DSAR)**: Clients can request a copy of all documents and metadata held about them via `/api/vault/dsar`.
  - **Right to Rectification**: Right to update outdated contact or property information.
  - **Right to Erasure**: Subject to the 7-year statutory conveyancing retention rule.
  - **Right to Object / Withdraw Consent**: Right to cancel pending upload requests.

#### Section 7: Regulatory Complaints Channel
- **DPA Requirement**: Section 38.
- **Content**: Informs data subjects of their right to lodge complaints with the **Office of the Data Protection Commissioner**:
  > Office of the Data Protection Commissioner (ODPC)  
  > Ministry of Technology and Science  
  > Lusaka, Zambia  
  > Website: `https://www.dataprotection.gov.zm`

---

## 4. Operational Checklist for Agency Launch in Zambia

Before an agency opens the public Client Upload Portal to real Zambian clients, complete this statutory sequence:

- [x] **Code Complete**: Dynamic `<Files>` animated tree with property folders and archived states.
- [x] **Code Complete**: 3-tier user access control (`FULL_VAULT`, `ASSIGNED_ONLY`, `SPECIFIC_FOLDERS`).
- [x] **Code Complete**: PIN-protected Client Upload Portal (`/upload/[token]`) with Article 21 consent capture.
- [x] **Code Complete**: 15-minute presigned download URLs with immutable `AuditLog` tracking.
- [ ] **Regulatory Step**: Register the brokerage with the **Office of the Data Protection Commissioner (ODPC)** as a Data Controller.
- [ ] **Regulatory Step**: Appoint or designate an internal Data Protection Officer (DPO) and input their contact in tenant settings.
- [ ] **Contractual Step**: Embed the Schedule A Terms of Use into the agency's client engagement mandates.
