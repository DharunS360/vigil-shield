# VigilShield SIEM

### Production-Grade Security Information and Event Management Platform

A full-stack SIEM platform with real-time alert ingestion, IOC enrichment, custom detection rules, alert correlation, and comprehensive SOC casebook documentation.

---

## Features

### Real-Time Alert Management
- WebSocket-powered live dashboard
- Multi-source alert ingestion
- Severity classification (Critical/High/Medium/Low)
- Real-time statistics and charts

### IOC Enrichment
- VirusTotal API integration
- AbuseIPDB API integration
- Auto-enrichment on alert ingestion
- Risk scoring (0-100)
- 1-hour cache for API efficiency

### Detection Rules Engine
- 8 Sigma-based detection rules
- MITRE ATT&CK mapping
- Custom rule support
- Rule testing API

### Alert Correlation
- 4 correlation rules:
  - COR-001: Brute Force (3+ failed logins)
  - COR-002: Multi-Stage Attack (2+ techniques)
  - COR-003: Credential Access + Lateral Movement
  - COR-004: Data Exfiltration
- Automatic incident creation
- Alert-to-incident linking

### Case Management
- Incident tracking (TP/FP decisions)
- Assignee + Priority management
- Timeline with analyst notes
- Evidence upload (screenshots, PDFs, logs)
- MTTR tracking
- Status workflow (Open -> Investigating -> Resolved)

### MITRE ATT&CK Integration
- Technique mapping for all alerts
- Interactive coverage matrix
- Tactic classification

### Reporting
- PDF incident reports (ReportLab)
- Email delivery support
- Auto-download

---

## Architecture
Frontend (React + TypeScript)
http://localhost:3000

Dashboard, Alerts, Incidents, Reports

Real-time WebSocket updates
|
| HTTP + WebSocket
v
Backend (FastAPI + Python)
http://localhost:8000

Alerts API (CRUD)

Incidents API (Case Management)

Enrichment API (VirusTotal, AbuseIPDB)

Detection API (Sigma rules)

Correlation Engine

Reports API (PDF generation)
|
| SQLAlchemy ORM
v
Database (SQLite)

alerts table

incidents table

Timeline + Evidence (JSON)

text

---

## Tech Stack

### Backend
- Framework: FastAPI 0.139
- Database: SQLite + SQLAlchemy 2.0
- Server: Uvicorn
- Auth: JWT (python-jose)
- PDF: ReportLab
- HTTP: httpx
- APIs: VirusTotal, AbuseIPDB

### Frontend
- Framework: React + TypeScript
- Build: Create React App
- Charts: Recharts
- HTTP: Axios
- Routing: React Router
- Real-time: WebSocket

---

## Quick Start

### Prerequisites
Python 3.11+
Node.js 18+

text

### Backend Setup

```bash
# 1. Clone repo
git clone https://github.com/DharunS360/vigilshield-siem.git
cd vigilshield-siem

# 2. Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install dependencies
cd docs/backend
pip install -r requirements.txt

# 4. Setup .env file with your API keys
# VIRUSTOTAL_API_KEY=your_key
# ABUSEIPDB_API_KEY=your_key

# 5. Start backend
python -m uvicorn app.main:app --reload --port 8000
Frontend Setup
bash
cd frontend
npm install
npm start
Access
Frontend: http://localhost:3000

Backend API: http://localhost:8000

Swagger Docs: http://localhost:8000/docs

Project Structure
text
vigilshield-siem/
├── docs/backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/v1/            # API endpoints
│   │   ├── core/              # Config, DB
│   │   ├── models/            # SQLAlchemy models
│   │   ├── services/          # Business logic
│   │   │   ├── correlation.py
│   │   │   ├── detection_engine.py
│   │   │   ├── ioc_enrichment.py
│   │   │   └── report_generator.py
│   │   └── main.py
│   ├── detection_rules/       # Sigma rules
│   │   ├── sigma/
│   │   └── custom/
│   └── requirements.txt
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── api/               # API clients
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   └── hooks/             # Custom hooks
│   └── package.json
├── casebook/                   # 50+ SOC cases
│   ├── 001-ssh-brute-force/
│   ├── 002-rdp-brute-force/
│   ├── ...
│   ├── 050-apt-chain/
│   ├── playbooks/             # IR playbooks
│   └── README.md
└── README.md