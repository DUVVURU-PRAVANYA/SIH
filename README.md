# 🏥 GH-QueueFlow
### *Government Hospital Intelligent Patient Flow & Queue Management System*
**Department of Health & Family Welfare, Government of Tamil Nadu**

> **Tagline:** *“One Patient. One Intelligent Journey. One Connected Hospital.”*  
> **Core Architectural Principle:** *“Complex Intelligence Behind the System. Extreme Simplicity for the Patient.”*

---

## 🌟 Overview

**GH-QueueFlow** is a full-stack, real-time hospital patient flow orchestration platform engineered specifically for large government hospitals (e.g. Government Rajaji General Hospital, Madurai / Government General Hospital, Chennai).

### The Problem It Solves:
Traditional government hospitals suffer from **fragmented queueing**: patients stand in separate physical lines to register, consult a doctor, obtain diagnostic tokens, and collect medications at the pharmacy.

### The Unified Journey Paradigm:
GH-QueueFlow issues **ONE persistent Journey ID** (`JNY-YYYYMMDD-XXXXX`) that cascades through every stage of care:

```
[ Central Registration / Kiosk ]
            ↓ (CARDIO-043)
[ Cardiology OPD Consultation (Dr. Priya Kumar) ]
            ↓ (Auto-Generated Next Stage: X-RAY-032)
[ Digital Chest X-Ray (Diagnostic Block C) ]
            ↓ (Auto-Generated Next Stage: PHARM-016)
[ Central Pharmacy Dispensing (Counter 3) ]
            ↓
[ Journey Completed & Digital Health Record Synced ✅ ]
```

---

## 🚀 Key Modules & Capabilities

1. **🎟️ Ultra-Simple Patient Experience (Tamil-First & Voice-Guided)**:
   - **4 Giant Action Buttons**: `GET MY TOKEN`, `WHERE DO I GO?`, `MY TURN STATUS`, `HEAR AGAIN`.
   - **Dynamic Queue & ETA Calculation**: Calculated live from database state (`people ahead = count of waiting entries before target`).
   - **Universal Color Paths**: Blue (Cardiology/OPD), Orange (X-Ray/CT), Green (Lab), Purple (Pharmacy), Red (Emergency), Yellow (Registration).
   - **Web Speech API**: Real Tamil (`ta-IN`) and English voice synthesis that speaks the actual room, block, and people ahead.
   - **Multi-Modal Entry**: Hospital Touchscreen Kiosk, SMS Simulator, and Assisted Registration.

2. **🩺 Doctor OPD Portal**:
   - Live queue with senior citizen/urgent triage indicators.
   - Patient EMR card (BP 148/94, pulse, SpO2, ABHA ID).
   - **Clinical AI Voice Note Dictation**: Real browser Speech Recognition converting clinical speech into structured Diagnosis, Rx, and Orders with **doctor confirmation**.
   - **Automatic Next-Stage Routing**: Auto-creates `X-RAY` or `PHARMACY` tokens upon consultation completion.

3. **🔬 Diagnostic & Imaging Staff Portal**:
   - Real-time modality worklists for Digital X-Ray, Biochemistry Lab, and CT Scan.
   - 1-Click scan completion with findings summary -> **Auto-routes patient to Central Pharmacy**.
   - Live bottleneck detection & capacity expansion simulations.

4. **💊 Central Pharmacy Dispensing Portal**:
   - Paperless e-prescription verification against TNMSC formulary.
   - 1-Click dispense & journey completion with celebratory confetti!

5. **🏥 Primary Health Centre (PHC) Referral Center**:
   - Rural PHC referral creator with golden-hour urgency classification.
   - **Intelligent Multi-Hospital Telemetry Comparator**: Evaluates ICU availability, travel time, hospital load %, and specialist on-duty status across district hospitals.
   - Real-time 5-step referral tracking stepper.

6. **📊 Hospital Admin Operations Command Center**:
   - Top 6 live operational KPIs computed from database state.
   - Live Patient Flow pipeline (Registration -> Doctor -> Diagnostics -> Pharmacy -> Completed).
   - Department Congestion Matrix & Bottleneck AI Impact Simulator.
   - Doctor workload and ICU/Bed telemetry.
   - Patient Journey Audit Trail & Token Search.
   - Regulatory report center with PDF & CSV export.
   - **Generic Hospital Setup**: Configure hospital name, location, beds, blocks, rooms, and departments dynamically in the database.

7. **⚡ Realtime WebSocket Synchronization**:
   - All role portals (Patient, Doctor, Diagnostics, Pharmacy, Admin) sync live across multiple browser tabs via WebSocket broadcast.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express, TypeScript, TSX runtime.
- **Database**: Relational embedded engine with ACID disk persistence (`server/data/db.json`), relational foreign keys, and auto-increment sequences.
- **Realtime**: WebSockets (`ws`) broadcasting live queue, consultation, diagnostic, pharmacy, and referral events.
- **Speech**: Web Speech API Recognition (Doctor dictation) & Web Speech API Synthesis (Patient Tamil/English audio).

---

## 📦 Installation & Setup

### 1. Prerequisites
- Node.js v18+ (tested on v24.14.0)
- npm v9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

---

## 🏃 Running the Application

### Start the Backend Server (Express + WebSockets)
```bash
npm run server
```
*Backend runs on `http://localhost:4000` with WebSockets at `ws://localhost:4000/ws`.*

### Start the Frontend Dev Server (Vite)
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173/`.*

---

## 🧪 Automated End-to-End Test

Run the automated integration test script:
```bash
npm run test:e2e
```

**Test Verification Highlights:**
1. Hospital & department config loaded.
2. Patient registered -> Unique Token issued -> Queue entry & dynamic ETA calculated.
3. Doctor calls patient -> Patient status updates to CALLED in real time.
4. Doctor completes consultation -> System auto-routes to Diagnostic X-Ray.
5. X-Ray completed -> System auto-routes to Central Pharmacy.
6. Pharmacy dispenses -> Patient journey marked `COMPLETED` ✅.
7. PHC referral created & accepted by receiving hospital.

---

## 🌐 Real-Time Multi-Tab Testing Guide

To test genuine live synchronization across roles:

1. **Tab 1 (Patient)**: Open `http://localhost:5173/` and switch to **Patient Portal**. Notice your active Token (e.g. `CARDIO-042`) and waiting count.
2. **Tab 2 (Doctor)**: Open another tab and switch to **Doctor OPD**. Click **Call Next** or **Start Consultation**.
   - *Instantly, Tab 1 displays `YOUR TURN NOW` with room directions and audio alert.*
3. **Doctor Consultation**: Dictate notes or click **Complete Consultation & Auto-Route to X-Ray**.
   - *Instantly, Tab 1 changes destination to Diagnostic Block C (Room 18) with Orange Path.*
4. **Tab 3 (Diagnostics)**: Open a tab and switch to **Diagnostics**. You will see the newly generated `X-RAY` order. Click **Complete X-Ray**.
   - *Instantly, Tab 1 changes destination to Central Pharmacy Counter 3 with Purple Path.*
5. **Tab 4 (Pharmacy)**: Open a tab and switch to **Pharmacy**. You will see the e-prescription. Click **Dispense & Complete Journey**.
   - *Instantly, Tab 1 celebrates with confetti and marks the journey COMPLETED.*
6. **Tab 5 (Admin)**: Observe live flow counts, waiting queues, and KPI numbers incrementing in real time!
