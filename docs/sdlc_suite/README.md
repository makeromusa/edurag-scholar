# 📚 EduRAG Scholar — Master SDLC Engineering Documentation Suite
## Complete Software Development Lifecycle (SDLC) Specification Portfolio
**Project:** EduRAG Scholar (Academic Masterclass & AI Copilot)  
**Lead Systems Analyst, Software Engineer & DevOps Architect:** Musa Makero  
**Client / Institution:** University of Nairobi (Faculty of Science & Technology)  
**Version:** 2.4.0 (Production Release)  

---

### 📑 SDLC Master Documentation Index

| # | Document Code | Document Title | Primary Role / Audience | Key Coverage & Methodologies |
| :-: | :--- | :--- | :--- | :--- |
| **01** | [BRD](01_BRD_Business_Requirements_Document.md) | **Business Requirements Document** | Systems Analyst / Client | Business goals, Problem Statement, Stakeholder Matrix, RACI Framework, ROI & Cost Analysis. |
| **02** | [URD](02_URD_User_Requirements_Document.md) | **User Requirements Document** | Product Designer / UX | User Personas, User Journey Mapping, Detailed User Stories with Gherkin Acceptance Criteria. |
| **03** | [SRS](03_SRS_Software_Requirements_Specification.md) | **Software Requirements Specification** | Software Engineer / QA | IEEE 830 / ISO 29148 standard, Functional Modules (FR-1..5), Non-Functional Requirements (NFR-1..6). |
| **04** | [SAD](04_SAD_Software_Architecture_Document.md) | **Software Architecture Document** | Cloud Architect | C4 Model (Context, Container, Component, Code), Dual-Engine LLM Fallback, Multi-Tenancy Boundary. |
| **05** | [HLD](05_HLD_High_Level_Design.md) | **High-Level Design Document** | Systems Architect | Ingestion Pipeline Flow, Masterclass Retrieval Pipeline, Subsystem Decomposition, Nightly Abstractor. |
| **06** | [LLD](06_LLD_Low_Level_Design.md) | **Low-Level Design Document** | Backend & Frontend Dev | Class Diagrams, Pydantic DTOs & API Contracts, UI State Machine (`ProfessorLectureStudio.tsx`). |
| **07** | [DBDD](07_DBDD_Database_Design_Data_Dictionary.md) | **Database Design & Data Dictionary** | Database Administrator | Supabase PostgreSQL ERD, `pgvector` HNSW vector indexes, RPC matching functions, MongoDB collections. |
| **08** | [SEMP](08_SEMP_Methodology_Agile_Plan.md) | **Software Engineering Management Plan** | Scrum Master / Team Lead | Agile Scrumban Methodology, Sprint Ceremonies, Definition of Ready/Done, GitOps Branching Rules. |
| **09** | [STP](09_STP_Software_Test_Plan_QA.md) | **Software Test Plan & QA Strategy** | Quality Assurance Engineer | Testing Pyramid, RAG Triad Evaluation (Ragas), Test Case Specifications (Pass/Fail), Defect SLAs. |
| **10** | [SecOps](10_SecOps_Security_Architecture_STRIDE.md) | **Security Architecture & STRIDE Threat Model** | SecOps / Infosec Auditor | Microsoft STRIDE Threat Modeling, PostgreSQL Row-Level Security (RLS) policies, OWASP Top 10 API defenses. |
| **11** | [DevOps](11_DevOps_CICD_Deployment_Runbook.md) | **DevOps, CI/CD & Deployment Runbook** | DevOps / SRE Engineer | Docker multi-stage builds, GitHub Actions workflows, Environment secrets vault, Rolling deployment strategy. |
| **12** | [SRE](12_SRE_Operations_Monitoring_DR_Runbook.md) | **SRE, Operations & Disaster Recovery** | Site Reliability Engineer | SLAs/SLOs/SLIs, Error Budget calculation, Sentry telemetry, Incident Playbooks (429 rate limit, pooling), DR plan. |
| **13** | [UAT](13_UAT_Handover_Maintenance_Plan.md) | **UAT, Handover & Maintenance Plan** | Project Delivery Lead / Client | User Acceptance Testing sign-off matrix, Asset inventory, User Operating Manual, 90-day warranty terms. |

---

```
docs/sdlc_suite/
├── 01_BRD_Business_Requirements_Document.md
├── 02_URD_User_Requirements_Document.md
├── 03_SRS_Software_Requirements_Specification.md
├── 04_SAD_Software_Architecture_Document.md
├── 05_HLD_High_Level_Design.md
├── 06_LLD_Low_Level_Design.md
├── 07_DBDD_Database_Design_Data_Dictionary.md
├── 08_SEMP_Methodology_Agile_Plan.md
├── 09_STP_Software_Test_Plan_QA.md
├── 10_SecOps_Security_Architecture_STRIDE.md
├── 11_DevOps_CICD_Deployment_Runbook.md
├── 12_SRE_Operations_Monitoring_DR_Runbook.md
├── 13_UAT_Handover_Maintenance_Plan.md
└── README.md
```
