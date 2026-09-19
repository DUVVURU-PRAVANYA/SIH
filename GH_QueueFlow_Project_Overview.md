# 🏥 GH-QueueFlow — Complete Project Documentation
### *Government Hospital Intelligent Patient Flow & Queue Management System*
**Smart India Hackathon (SIH) Project | Dept. of Health & Family Welfare, Government of Tamil Nadu**

---

## 📌 Problem Statement

Government hospitals like **Government Rajaji General Hospital (Madurai)** and **Government General Hospital (Chennai)** serve thousands of patients daily. The core problem is **fragmented, manual queueing**:

| Pain Point | Description |
|---|---|
| **Multiple physical queues** | Separate lines for Registration → Doctor OPD → Diagnostics → Pharmacy |
| **Zero visibility** | Patients don't know their turn, estimated wait, or where to go next |
| **No digital coordination** | Departments operate in silos — no automatic next-step routing |
| **Paper-based prescriptions** | Manual handoffs between doctor, lab, and pharmacy are error-prone |
| **Language barrier** | English-only signage excludes Tamil-speaking rural patients |
| **PHC referrals are manual** | Rural Primary Health Centre referrals are paper forms with no tracking |

---

## 💡 Solution — The Unified Journey Paradigm

GH-QueueFlow issues **ONE persistent Journey ID** (`JNY-YYYYMMDD-XXXXX`) that follows the patient through every stage:

```
[ Registration / Kiosk / SMS / IVR Call ]
            ↓  Token: CARDIO-043
[ Cardiology OPD — Dr. Priya Kumar ]
            ↓  Auto-generated: X-RAY-032
[ Digital X-Ray — Block C, Ground Floor ]
            ↓  Auto-generated: PHARM-016
[ Central Pharmacy — Counter 3 ]
            ↓
[ Journey COMPLETED ✅ — Digital Health Record Synced ]
```

**All portals (Patient, Doctor, Diagnostics, Pharmacy, Admin, PHC) sync live via WebSockets** — when Doctor presses "Complete Consultation", Patient's phone displays the next destination in real time.

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework (component-based, hook-driven) |
| **TypeScript** | Full type safety across all components and API contracts |
| **Tailwind CSS v4** | Utility-first styling |
| **Lucide React** | Icon library |
| **Canvas Confetti** | Patient journey completion celebration effect |
| **Web Speech API** | Browser-native Tamil/English voice synthesis (patient guidance) + voice recognition (doctor dictation) |
| **Vite 8** | Lightning-fast dev server & bundler |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express.js** | REST API server |
| **TypeScript + TSX** | Type-safe server code with direct TS execution |
| **ws (WebSockets)** | Real-time broadcasting to all connected portals |
| **dotenv** | Environment variable management |
| **cors** | Cross-origin support for Vite dev server |

### Database
| Technology | Purpose |
|---|---|
| **Custom JSON-based Relational DB** | ACID-compliant file-based database stored at `server/data/db.json` |
| **Auto-increment sequences** | Per-department token numbering (`CARDIO-001`, `X-RAY-042`, etc.) |
| **Foreign key relationships** | Hospital → Blocks → Floors → Rooms → Departments → Users → Patients → Journeys → Stages |

### Communication
| Technology | Purpose |
|---|---|
| **Twilio (optional)** | Real SMS delivery (configurable via `.env`) |
| **Demo SMS Mode** | Simulated SMS logs to console (default) |
| **IVR System** | Phone-based token booking (separate mini-app at `/phone`) |

---

## 🗂️ Project Directory Structure

```
SIH/
├── server/                        # ← Node.js/Express Backend
│   ├── index.ts                   # Server bootstrap (Express + WebSocket + Routes)
│   ├── realtime.ts                # WebSocket broadcast engine
│   ├── db/
│   │   ├── database.ts            # DatabaseEngine class (all CRUD operations)
│   │   ├── types.ts               # All TypeScript interfaces for DB entities
│   │   └── seed.ts                # Initial hospital setup (runs on first start)
│   ├── routes/
│   │   └── api.ts                 # ALL REST API endpoints (79KB — monolithic router)
│   ├── services/
│   │   └── notificationService.ts # In-app + SMS notification dispatch
│   ├── ivr/                       # IVR Phone System (separate sub-module)
│   │   ├── ivr.routes.ts          # IVR API routes (/api/ivr/*)
│   │   ├── ivr.controller.ts      # IVR request handler
│   │   ├── ivr.service.ts         # Full IVR session state machine (22KB)
│   │   ├── ivr.session.ts         # Session storage for IVR calls
│   │   ├── ivr.types.ts           # IVR type definitions
│   │   └── ivr.prompts.ts         # Bilingual prompts (English + Tamil)
│   └── data/
│       └── db.json                # Persistent database file (auto-created)
│
├── src/                           # ← React Frontend
│   ├── main.tsx                   # App entry point
│   ├── App.tsx                    # Root component (routes between portals)
│   ├── context/
│   │   └── QueueFlowContext.tsx   # Global React Context (2700+ lines — master state)
│   ├── services/
│   │   ├── api.ts                 # Frontend API client (all HTTP calls)
│   │   └── websocket.ts           # Frontend WebSocket client (auto-reconnect)
│   ├── components/
│   │   ├── patient/               # Patient-facing portal (8 components)
│   │   │   ├── PatientHome.tsx    # Main patient dashboard (83KB!)
│   │   │   ├── PatientKioskMode.tsx  # Touchscreen kiosk interface
│   │   │   ├── PatientEntryModal.tsx # Registration form
│   │   │   ├── PatientSmsSimulator.tsx  # Simulate SMS-based token entry
│   │   │   ├── PatientPublicDisplay.tsx # TV/Public display board
│   │   │   ├── PatientTokenModal.tsx    # Token display popup
│   │   │   ├── PatientWayfindingModal.tsx # "Where do I go?" directions
│   │   │   └── DoctorDepartmentSelection.tsx # Dept picker
│   │   ├── doctor/
│   │   │   └── DoctorPortal.tsx   # Full doctor OPD dashboard (111KB!)
│   │   ├── admin/
│   │   │   └── AdminCommandCenter.tsx  # Hospital operations dashboard
│   │   ├── phc/
│   │   │   └── PHCPortal.tsx      # Primary Health Centre referral portal
│   │   ├── diagnostic/            # Radiology/Lab staff portal
│   │   ├── pharmacy/              # Pharmacy dispensing portal
│   │   ├── reception/             # Registration desk portal
│   │   ├── lab/                   # Lab-specific view
│   │   ├── scan_lab/              # CT/X-Ray worklist
│   │   ├── auth/                  # Login screens
│   │   ├── landing/               # App landing page
│   │   └── common/                # Shared components (NavBar, modals, etc.)
│   ├── data/
│   │   └── initialData.ts         # Fallback/demo data for UI scaffolding
│   ├── types/                     # Frontend TypeScript type definitions
│   └── utils/
│       ├── voice.ts               # Web Speech API wrapper
│       └── translations.ts        # i18n strings (English + Tamil)
│
├── ivr-phone/                     # ← IVR Phone UI (separate Vite app)
│   └── src/                       # React app simulating a phone calling the IVR
│
├── scripts/
│   └── test_ivr_flow.ts           # IVR integration test script
├── .env.example                   # Environment variable template
├── render.yaml                    # Render.com cloud deployment config
├── vite.config.ts                 # Vite build config
└── package.json                   # NPM scripts & dependencies
```

---

## 🗄️ Database Architecture

### Engine
A custom **relational JSON database** (`DatabaseEngine` class in [`database.ts`](file:///c:/Users/HP/Documents/SIH/server/db/database.ts)):
- Stored as `server/data/db.json` (ACID: written to disk after every mutation)
- Auto-initialized on first run via `seed.ts`
- Supports CRUD for all entities with relational lookups

### Schema — All 17 Tables

```
hospitals          ← Hospital profile (name, beds, ICU, emergency status)
blocks             ← Physical building blocks (Block A, B, C)
floors             ← Floors within blocks
rooms              ← Individual rooms (X-Ray Suite, OPD, etc.)
departments        ← Clinical departments with queue config
users              ← All staff accounts (doctors, pharmacists, admins, PHC)
patients           ← Patient registry (ABHA ID, demographics, contact)
journeys           ← The master patient visit record (JNY-YYYYMMDD-XXXXX)
journeyStages      ← Each step within a journey (doctor, diagnostic, pharmacy)
queueEntries       ← Live queue positions per department
consultations      ← Doctor's clinical notes, diagnosis, medications, orders
diagnosticOrders   ← X-Ray/CT/Lab test orders linked to a consultation
pharmacyOrders     ← Prescription/dispense records linked to consultation
phcReferrals       ← PHC → Hospital referral records with urgency & tracking
notifications      ← In-app notifications for all roles (bilingual)
serviceCounters    ← Counter config per department
auditLogs          ← Action audit trail (who did what, when)
sequences          ← Auto-increment token counters per department
```

### Key Relationships

```
Hospital (1) → (N) Departments
Department (1) → (N) Users (doctors/staff)
Department (1) → (N) QueueEntries
Patient (1) → (N) Journeys
Journey (1) → (N) JourneyStages
Journey (1) → (1) Consultation
Consultation (1) → (0..1) DiagnosticOrder
Consultation (1) → (0..1) PharmacyOrder
```

### Token Generation
```typescript
getNextTokenNumber('CARDIO') → 'CARDIO-001', 'CARDIO-002', ...
getNextJourneyId()           → 'JNY-20260915-00001', ...
```

---

## 🌐 REST API Endpoints

All served under `/api` from the monolithic [`server/routes/api.ts`](file:///c:/Users/HP/Documents/SIH/server/routes/api.ts):

### Hospital & Config
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/hospital` | Get hospital profile |
| POST | `/api/hospital/config` | Update hospital settings |

### Departments & Doctors
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/departments` | All departments with queue stats |
| POST | `/api/departments/:id/counter` | Update active counter count |
| GET | `/api/doctors` | All active doctors |
| GET | `/api/doctors/:id/queue` | Doctor-specific queue |

### Patient & Registration
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/patients/register` | Register new patient |
| GET | `/api/patients/:id` | Get patient profile |
| GET | `/api/patients/:id/active-visit` | Get current journey + queue metrics |
| GET | `/api/patients/:id/history` | Full visit history |
| GET | `/api/patients/:id/reports` | Diagnostic reports |
| GET | `/api/patients/:id/prescriptions` | Past prescriptions |
| PUT | `/api/patients/:id/profile` | Update patient demographics |
| POST | `/api/patients/login` | Patient phone-based login |
| POST | `/api/patients/otp/request` | Request OTP |
| POST | `/api/patients/otp/verify` | Verify OTP |

### Visits & Queues
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/visits/create` | Create journey + token + queue entry |
| POST | `/api/visits/revisit` | Re-queue patient after doctor decision |
| GET | `/api/queues/:departmentId` | Department queue listing |
| POST | `/api/queues/call` | Doctor calls next patient |

### Consultations
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/consultations/start` | Start consultation (marks patient `in_service`) |
| POST | `/api/consultations/complete` | Complete consultation + auto-route to Diagnostics or Pharmacy |

### Diagnostics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/diagnostics` | All pending diagnostic orders |
| POST | `/api/diagnostics/start` | Mark diagnostic as in-progress |
| POST | `/api/diagnostics/complete` | Complete diagnostic + auto-route to Pharmacy |

### Pharmacy
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/pharmacy` | All pending pharmacy orders |
| POST | `/api/pharmacy/status` | Update pharmacy order status |
| POST | `/api/pharmacy/dispense` | Dispense medications + mark Journey COMPLETED |

### Referrals
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/referrals` | All PHC referrals |
| POST | `/api/referrals` | Create new referral |
| PATCH | `/api/referrals/:id/status` | Update referral status |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Live KPIs, flow counts, metrics |
| POST | `/api/admin/emergency` | Toggle emergency mode |
| POST | `/api/admin/reset` | Reset database to clean state |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get notifications by role/journey |
| POST | `/api/notifications/read` | Mark notification as read |

### Staff Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/staff/login` | Staff login (username + password) |

### IVR (Phone System)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ivr/session` | Start new IVR call session |
| POST | `/api/ivr/input` | Process DTMF key press |
| GET | `/api/ivr/status/:phone` | Get current token status for a phone number |

---

## ⚡ Real-Time WebSocket Events

Server at `ws://localhost:4000/ws` — all portals subscribe and react instantly:

| Event Name | Triggered When | Portals Affected |
|---|---|---|
| `TOKEN_CREATED` | Patient registers & gets token | All |
| `PATIENT_CALLED` | Doctor clicks "Call Next" | Patient (shows YOUR TURN), Doctor |
| `CONSULTATION_STARTED` | Doctor starts session | Doctor, Admin |
| `CONSULTATION_COMPLETED` | Doctor finishes + auto-routes | Patient (new destination), Diagnostics, Pharmacy |
| `DIAGNOSTIC_ORDER_CREATED` | X-Ray/Lab order created | Diagnostic staff |
| `DIAGNOSTIC_STARTED` | Technician starts scan | Patient, Admin |
| `DIAGNOSTIC_COMPLETED` | Scan done → routes to Pharmacy | Patient (new destination), Pharmacy |
| `PHARMACY_ORDER_CREATED` | Prescription sent to pharmacy | Pharmacy |
| `PHARMACY_STARTED` | Pharmacist starts dispensing | Patient |
| `PHARMACY_COMPLETED` | Medicines dispensed | Patient (JOURNEY COMPLETE + 🎉 confetti) |
| `QUEUE_UPDATED` | Queue state changes | All |
| `ETA_UPDATED` | Wait time recalculated | Patient |
| `REFERRAL_CREATED` | PHC creates referral | Admin, PHC |
| `REFERRAL_ACCEPTED` | Hospital accepts referral | PHC |
| `REFERRAL_UPDATED` | Referral status changes | PHC, Admin |
| `EMERGENCY_STATUS_CHANGED` | Admin toggles emergency mode | All |
| `NOTIFICATION_CREATED` | Any system notification | All |
| `HOSPITAL_CONFIG_UPDATED` | Admin changes hospital settings | All |

---

## 👥 User Roles & Portals

| Role | Login | Portal Description |
|---|---|---|
| `patient` | Phone + OTP (demo: any 6-digit OTP) | Self-service: token status, wayfinding, voice guidance |
| `doctor` | `dr_priya` / `dr_arun` / `dr_meena` / `dr_ravi` | OPD queue, voice dictation, clinical notes, auto-routing |
| `diagnostic` | `tech_murugan` | X-Ray/CT/Lab worklist, 1-click completion |
| `pharmacy` | `pharm_radha` | E-prescription verification, dispense, journey completion |
| `phc` | `phc_alanganallur` | Referral creation, hospital comparison, status tracking |
| `admin` | `admin_dean` | Command center KPIs, congestion matrix, bottleneck AI |
| `registration` | (reception staff) | Patient registration, assisted onboarding |

**Default password for all staff:** `password123`

---

## 🏗️ Initial Hospital Setup (Seed Data)

Hospital: **Government Rajaji General Hospital, Madurai**

### Physical Layout
```
Block A — Main Admin, Emergency, Pharmacy
  └── Ground Floor
      ├── Central Registration (Yellow Path)
      ├── Central Pharmacy (Purple Path)
      └── Emergency Trauma Ward (Red Path)

Block B — OPD Specialty Clinics
  ├── Ground Floor
  │   └── General Medicine OPD (Blue Path)
  └── 1st Floor
      ├── Cardiology OPD Suite (Blue Path)
      ├── Orthopedics Clinic (Blue Path)
      └── Dermatology Clinic (Blue Path)

Block C — Radiology & Diagnostics
  ├── Ground Floor
  │   ├── Digital Chest X-Ray Suite (Orange Path)
  │   └── 128-Slice CT Scanner (Orange Path)
  └── 1st Floor
      └── Biochemistry & Pathology Lab (Green Path)
```

### Departments (10 configured)
| Code | Name | Category | Avg Service Time | Active Counters |
|---|---|---|---|---|
| REG | Central Registration | registration | 2.2 min | 5/6 |
| CARDIO | Cardiology OPD | opd | 6.5 min | 2/3 |
| GENMED | General Medicine OPD | opd | 5.0 min | 4/5 |
| ORTHO | Orthopedics OPD | opd | 7.2 min | 3/3 |
| DERMA | Dermatology OPD | opd | 5.0 min | 2/2 |
| X-RAY | Digital X-Ray | diagnostic | 8.0 min | 2/2 |
| LAB | Central Biochemistry Lab | diagnostic | 4.0 min | 3/4 |
| CT | CT Scan Unit | diagnostic | 12.0 min | 1/1 |
| PHARM | Central Pharmacy | pharmacy | 2.5 min | 4/5 |
| EMERG | Emergency & Trauma | emergency | 15.0 min | 6/6 |

### Staff Accounts (9 pre-configured)
```
Doctors:      Dr. Priya Kumar (GenMed), Dr. Arun Kumar (Cardio),
              Dr. Meena Sharma (Ortho), Dr. Ravi Kumar (Derma),
              Dr. M. Senthil Nathan (GenMed)
Diagnostic:   K. Murugan (Senior Radiographer)
Pharmacy:     S. Radha (Chief Pharmacist)
PHC:          Dr. V. Rajesh (MO Alanganallur PHC)
Admin:        Medical Superintendent / Dean Console
```

---

## 🤖 Key Intelligent Features

### 1. Dynamic ETA Calculation
```typescript
// From database.ts
estimatedWaitMinutes = isDoctorQueue
  ? peopleAhead * avgServiceMinutes           // Per doctor
  : (peopleAhead * avgServiceMinutes) / activeCounters  // Shared counters
```

### 2. Load-Balanced Doctor Assignment
When registering without a specific doctor:
```typescript
// Finds doctor in department with FEWEST waiting patients
let minQueue = Infinity;
for (const doc of deptDoctors) {
  const docQueueLen = getDoctorQueue(doc.id).length;
  if (docQueueLen < minQueue) bestDoc = doc;
}
```

### 3. Priority Queue Ordering
```
Emergency → Urgent → Senior Citizen (60+) → Normal
Then by registration sequence number
```

### 4. Automatic Next-Stage Routing
- **Doctor completes** with diagnostic order → Auto-creates diagnostic token + queue entry
- **Diagnostic completes** → Auto-creates pharmacy token + queue entry
- **Pharmacy dispenses** → Journey marked `COMPLETED`, confetti fires on patient screen

### 5. Clinical AI Voice Note Dictation
Doctor speaks: *"BP 148/94, pulse 88, patient has chest pain for 3 days, suspect hypertension, prescribe Amlodipine 5mg..."*
→ Browser Speech Recognition converts to structured diagnosis, Rx, and clinical orders

### 6. PHC Multi-Hospital Telemetry
- Compares ICU availability, travel time, hospital load %, specialist availability
- Intelligent recommendation for which hospital to refer patient to
- 5-step real-time referral tracking (Created → Sent → Accepted → En Route → Received)

### 7. IVR Phone System (Tamil + English)
Patients without smartphones call the hospital:
- Press 1 → New token; Press 2 → Check status; Press 3 → Repeat token
- Press 5 → Describe symptoms → AI recommends department
- Bilingual prompts (complete Tamil translation for all IVR flows)

---

## 🔧 Environment Configuration

```env
# Server
PORT=4000
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000/ws

# SMS Provider (demo = no real SMS sent, logs to console)
SMS_PROVIDER=demo
SMS_ACCOUNT_SID=         # Twilio SID (for real SMS)
SMS_AUTH_TOKEN=          # Twilio Auth Token
SMS_FROM=+1234567890     # Twilio sender number

# Hospital
DEFAULT_HOSPITAL_NAME=Government Rajaji General Hospital
DEFAULT_HOSPITAL_LOCATION=Madurai, Tamil Nadu
```

---

## 🚀 How to Run

```bash
# 1. Install dependencies
npm install

# 2. Copy env
cp .env.example .env

# 3. Start backend (port 4000)
npm run server

# 4. Start frontend (port 5173, in another terminal)
npm run dev

# 5. (Optional) Run IVR phone UI (port 5175)
npm run phone

# 6. Run end-to-end automated test
npm run test:e2e
```

---

## 🧪 End-to-End Test Flow (`test_e2e.ts`)

Automatically verifies the full journey:
1. ✅ Hospital & department config loaded
2. ✅ Patient registered → Unique token issued → Queue entry created → ETA calculated
3. ✅ Doctor calls patient → Status → `CALLED`
4. ✅ Doctor completes consultation → Auto-routes to X-Ray diagnostic
5. ✅ X-Ray completed with findings → Auto-routes to Pharmacy
6. ✅ Pharmacy dispenses → Journey marked `COMPLETED`
7. ✅ PHC referral created & accepted by receiving hospital

---

## 📡 Frontend State Management

The entire app state lives in [`QueueFlowContext.tsx`](file:///c:/Users/HP/Documents/SIH/src/context/QueueFlowContext.tsx) (2700+ lines):

- **Session persistence** via `localStorage` (survives page refresh)
- **Real-time sync** via WebSocket event subscription + 2.5-second polling fallback
- **Role-based data loading** — switches data fetching based on active user role
- **Bilingual support** — `lang` state toggles all UI between English and Tamil
- **Accessibility settings** — font size, high contrast, voice guidance, reduced motion

---

## ☁️ Production Deployment

Configured for **Render.com** via `render.yaml`:
- Single service serves both backend API and compiled React frontend
- Backend at `:4000`, frontend built to `dist/` and served statically
- IVR phone app built to `dist/phone/` and served at `/phone`
- Environment variables configured in Render dashboard

---

## 🎨 Color-Coded Wayfinding System

| Color | Department | Token Prefix |
|---|---|---|
| 🟡 Yellow | Registration | `REG-XXX` |
| 🔵 Blue | All OPD (Cardio, GenMed, Ortho, Derma) | `CARDIO-XXX`, `GENMED-XXX`, etc. |
| 🟠 Orange | Radiology (X-Ray, CT Scan) | `X-RAY-XXX`, `CT-XXX` |
| 🟢 Green | Biochemistry Lab | `LAB-XXX` |
| 🟣 Purple | Central Pharmacy | `PHARM-XXX` |
| 🔴 Red | Emergency & Trauma | `EMERG-XXX` |

---

## 📂 Key Files Quick Reference

| File | Size | Purpose |
|---|---|---|
| [`server/db/database.ts`](file:///c:/Users/HP/Documents/SIH/server/db/database.ts) | 919 lines | All database operations |
| [`server/db/types.ts`](file:///c:/Users/HP/Documents/SIH/server/db/types.ts) | 267 lines | All DB entity interfaces |
| [`server/db/seed.ts`](file:///c:/Users/HP/Documents/SIH/server/db/seed.ts) | 257 lines | Hospital bootstrap data |
| [`server/routes/api.ts`](file:///c:/Users/HP/Documents/SIH/server/routes/api.ts) | ~79KB | All 30+ REST API routes |
| [`server/realtime.ts`](file:///c:/Users/HP/Documents/SIH/server/realtime.ts) | 93 lines | WebSocket broadcast engine |
| [`server/services/notificationService.ts`](file:///c:/Users/HP/Documents/SIH/server/services/notificationService.ts) | 117 lines | SMS + in-app notifications |
| [`server/ivr/ivr.service.ts`](file:///c:/Users/HP/Documents/SIH/server/ivr/ivr.service.ts) | 22KB | IVR state machine |
| [`server/ivr/ivr.prompts.ts`](file:///c:/Users/HP/Documents/SIH/server/ivr/ivr.prompts.ts) | 84 lines | Bilingual IVR prompts |
| [`src/context/QueueFlowContext.tsx`](file:///c:/Users/HP/Documents/SIH/src/context/QueueFlowContext.tsx) | 2709 lines | Global React state |
| [`src/services/api.ts`](file:///c:/Users/HP/Documents/SIH/src/services/api.ts) | 141 lines | Frontend HTTP client |
| [`src/services/websocket.ts`](file:///c:/Users/HP/Documents/SIH/src/services/websocket.ts) | 109 lines | Frontend WebSocket client |
| [`src/components/doctor/DoctorPortal.tsx`](file:///c:/Users/HP/Documents/SIH/src/components/doctor/DoctorPortal.tsx) | 111KB | Doctor OPD mega-component |
| [`src/components/patient/PatientHome.tsx`](file:///c:/Users/HP/Documents/SIH/src/components/patient/PatientHome.tsx) | 83KB | Patient dashboard |
