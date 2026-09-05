import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Hospital,
  Block,
  Floor,
  Room,
  Department,
  User,
  Patient,
  Journey,
  JourneyStage,
  QueueEntry,
  Consultation,
  DiagnosticOrder,
  PharmacyOrder,
  PHCReferral,
  Notification,
  ServiceCounter,
  AuditLog,
} from './types';

interface DatabaseSchema {
  hospitals: Hospital[];
  blocks: Block[];
  floors: Floor[];
  rooms: Room[];
  departments: Department[];
  users: User[];
  patients: Patient[];
  journeys: Journey[];
  journeyStages: JourneyStage[];
  queueEntries: QueueEntry[];
  consultations: Consultation[];
  diagnosticOrders: DiagnosticOrder[];
  pharmacyOrders: PharmacyOrder[];
  phcReferrals: PHCReferral[];
  notifications: Notification[];
  serviceCounters: ServiceCounter[];
  auditLogs: AuditLog[];
  sequences: {
    journeyCount: number;
    tokens: Record<string, number>; // deptCode -> sequence
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export class DatabaseEngine {
  private data: DatabaseSchema;
  private isLoaded: boolean = false;

  constructor() {
    this.data = this.getDefaultSchema();
    this.init();
  }

  private getDefaultSchema(): DatabaseSchema {
    return {
      hospitals: [],
      blocks: [],
      floors: [],
      rooms: [],
      departments: [],
      users: [],
      patients: [],
      journeys: [],
      journeyStages: [],
      queueEntries: [],
      consultations: [],
      diagnosticOrders: [],
      pharmacyOrders: [],
      phcReferrals: [],
      notifications: [],
      serviceCounters: [],
      auditLogs: [],
      sequences: {
        journeyCount: 0,
        tokens: {},
      },
    };
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        this.isLoaded = true;
      } catch (err) {
        console.error('Error reading DB file, initializing fresh:', err);
        this.data = this.getDefaultSchema();
        this.save();
      }
    } else {
      this.save();
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  public setRawData(newData: DatabaseSchema) {
    this.data = newData;
    this.save();
  }

  // Sequence Generators
  public getNextJourneyId(): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.data.sequences.journeyCount += 1;
    const seq = this.data.sequences.journeyCount.toString().padStart(5, '0');
    this.save();
    return `JNY-${today}-${seq}`;
  }

  public getNextTokenNumber(deptCode: string): string {
    if (!this.data.sequences.tokens[deptCode]) {
      this.data.sequences.tokens[deptCode] = 0;
    }
    this.data.sequences.tokens[deptCode] += 1;
    const num = this.data.sequences.tokens[deptCode].toString().padStart(3, '0');
    this.save();
    return `${deptCode}-${num}`;
  }

  // Generic Query Getters
  public getHospital(): Hospital {
    return this.data.hospitals[0];
  }

  public updateHospital(updates: Partial<Hospital>): Hospital {
    if (this.data.hospitals.length > 0) {
      this.data.hospitals[0] = { ...this.data.hospitals[0], ...updates };
      this.save();
      return this.data.hospitals[0];
    }
    throw new Error('No hospital configured');
  }

  public getDepartments(): Department[] {
    return this.data.departments;
  }

  public getDepartmentById(id: string): Department | undefined {
    return this.data.departments.find((d) => d.id === id);
  }

  public getDepartmentByCode(code: string): Department | undefined {
    return this.data.departments.find((d) => d.code === code);
  }

  public updateDepartment(id: string, updates: Partial<Department>): Department {
    const idx = this.data.departments.findIndex((d) => d.id === id);
    if (idx >= 0) {
      this.data.departments[idx] = { ...this.data.departments[idx], ...updates };
      this.save();
      return this.data.departments[idx];
    }
    throw new Error(`Department ${id} not found`);
  }

  public getPatients(): Patient[] {
    return this.data.patients;
  }

  public getPatientById(id: string): Patient | undefined {
    return this.data.patients.find((p) => p.id === id);
  }

  public normalizePhone(raw: string): string {
    return (raw || '').replace(/[^0-9]/g, '').slice(-10);
  }

  public getPatientByPhone(phone: string): Patient | undefined {
    const clean = this.normalizePhone(phone);
    if (!clean) return undefined;
    return this.data.patients.find((p) => this.normalizePhone(p.phone) === clean);
  }

  public createPatient(p: Omit<Patient, 'id' | 'createdAt'> & { id?: string }): Patient {
    const newPatient: Patient = {
      ...p,
      id: p.id || `GH-P-${Math.floor(10000 + Math.random() * 90000)}`,
      role: 'patient',
      createdAt: new Date().toISOString(),
    };
    this.data.patients.unshift(newPatient);
    this.save();
    return newPatient;
  }

  public getJourneys(): Journey[] {
    return this.data.journeys;
  }

  public getJourneyById(id: string): Journey | undefined {
    return this.data.journeys.find((j) => j.id === id);
  }

  public createJourney(j: Omit<Journey, 'id' | 'createdAt'>): Journey {
    const id = this.getNextJourneyId();
    const newJourney: Journey = {
      ...j,
      id,
      createdAt: new Date().toISOString(),
    };
    this.data.journeys.unshift(newJourney);
    this.save();
    return newJourney;
  }

  public updateJourney(id: string, updates: Partial<Journey>): Journey {
    const idx = this.data.journeys.findIndex((j) => j.id === id);
    if (idx >= 0) {
      this.data.journeys[idx] = { ...this.data.journeys[idx], ...updates };
      this.save();
      return this.data.journeys[idx];
    }
    throw new Error(`Journey ${id} not found`);
  }

  public getJourneyStages(journeyId: string): JourneyStage[] {
    return this.data.journeyStages
      .filter((s) => s.journeyId === journeyId)
      .sort((a, b) => a.sequenceNum - b.sequenceNum);
  }

  public createJourneyStage(s: Omit<JourneyStage, 'id' | 'createdAt'>): JourneyStage {
    const newStage: JourneyStage = {
      ...s,
      id: `STG-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.journeyStages.push(newStage);
    this.save();
    return newStage;
  }

  public updateJourneyStage(id: string, updates: Partial<JourneyStage>): JourneyStage {
    const idx = this.data.journeyStages.findIndex((s) => s.id === id);
    if (idx >= 0) {
      this.data.journeyStages[idx] = { ...this.data.journeyStages[idx], ...updates };
      this.save();
      return this.data.journeyStages[idx];
    }
    throw new Error(`JourneyStage ${id} not found`);
  }

  // Queue Operations
  public getDepartmentQueue(departmentId: string): QueueEntry[] {
    return this.data.queueEntries
      .filter((q) => q.departmentId === departmentId && (q.status === 'waiting' || q.status === 'called' || q.status === 'in_service'))
      .sort((a, b) => {
        // Priority ordering: Emergency -> Urgent -> Senior -> Normal, then sequence
        const pMap: Record<string, number> = { emergency: 0, urgent: 1, senior: 2, normal: 3 };
        if (pMap[a.priority] !== pMap[b.priority]) {
          return pMap[a.priority] - pMap[b.priority];
        }
        return a.sequenceNum - b.sequenceNum;
      });
  }

  public createQueueEntry(q: Omit<QueueEntry, 'id' | 'createdAt'>): QueueEntry {
    const newEntry: QueueEntry = {
      ...q,
      id: `QE-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.queueEntries.push(newEntry);
    this.save();
    return newEntry;
  }

  public updateQueueEntry(id: string, updates: Partial<QueueEntry>): QueueEntry {
    const idx = this.data.queueEntries.findIndex((q) => q.id === id);
    if (idx >= 0) {
      this.data.queueEntries[idx] = { ...this.data.queueEntries[idx], ...updates };
      this.save();
      return this.data.queueEntries[idx];
    }
    throw new Error(`QueueEntry ${id} not found`);
  }

  // Dynamic People Ahead Calculation
  public calculatePeopleAhead(departmentId: string, queueEntryId: string): { peopleAhead: number; position: number; estimatedWaitMinutes: number } {
    const queue = this.getDepartmentQueue(departmentId);
    const targetIdx = queue.findIndex((q) => q.id === queueEntryId);
    const dept = this.getDepartmentById(departmentId);
    const avgMins = dept ? dept.avgServiceMinutes : 5;
    const counters = dept ? Math.max(1, dept.activeCounters) : 1;

    if (targetIdx < 0) {
      return { peopleAhead: 0, position: 0, estimatedWaitMinutes: 0 };
    }

    // Count people ahead who are waiting or called before this index
    const peopleAhead = targetIdx;
    const position = targetIdx + 1;
    const estimatedWaitMinutes = Math.max(1, Math.round((peopleAhead * avgMins) / counters));

    return { peopleAhead, position, estimatedWaitMinutes };
  }

  // Consultations
  public createConsultation(c: Omit<Consultation, 'id' | 'createdAt'>): Consultation {
    const newConsultation: Consultation = {
      ...c,
      id: `CNS-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.consultations.unshift(newConsultation);
    this.save();
    return newConsultation;
  }

  public getConsultationByJourney(journeyId: string): Consultation | undefined {
    return this.data.consultations.find((c) => c.journeyId === journeyId);
  }

  // Diagnostics
  public getDiagnosticOrders(): DiagnosticOrder[] {
    return this.data.diagnosticOrders;
  }

  public getDiagnosticOrderByJourney(journeyId: string): DiagnosticOrder | undefined {
    return this.data.diagnosticOrders.find((d) => d.journeyId === journeyId);
  }

  public createDiagnosticOrder(d: Omit<DiagnosticOrder, 'id' | 'orderedAt'>): DiagnosticOrder {
    const newOrder: DiagnosticOrder = {
      ...d,
      id: `DXO-${Date.now().toString().slice(-6)}`,
      orderedAt: new Date().toISOString(),
    };
    this.data.diagnosticOrders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  public updateDiagnosticOrder(id: string, updates: Partial<DiagnosticOrder>): DiagnosticOrder {
    const idx = this.data.diagnosticOrders.findIndex((d) => d.id === id);
    if (idx >= 0) {
      this.data.diagnosticOrders[idx] = { ...this.data.diagnosticOrders[idx], ...updates };
      this.save();
      return this.data.diagnosticOrders[idx];
    }
    throw new Error(`DiagnosticOrder ${id} not found`);
  }

  // Pharmacy
  public getPharmacyOrders(): PharmacyOrder[] {
    return this.data.pharmacyOrders;
  }

  public getPharmacyOrderByJourney(journeyId: string): PharmacyOrder | undefined {
    return this.data.pharmacyOrders.find((p) => p.journeyId === journeyId);
  }

  public createPharmacyOrder(p: Omit<PharmacyOrder, 'id' | 'createdAt'>): PharmacyOrder {
    const newOrder: PharmacyOrder = {
      ...p,
      id: `PHO-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.pharmacyOrders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  public updatePharmacyOrder(id: string, updates: Partial<PharmacyOrder>): PharmacyOrder {
    const idx = this.data.pharmacyOrders.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.data.pharmacyOrders[idx] = { ...this.data.pharmacyOrders[idx], ...updates };
      this.save();
      return this.data.pharmacyOrders[idx];
    }
    throw new Error(`PharmacyOrder ${id} not found`);
  }

  // Referrals
  public getReferrals(): PHCReferral[] {
    return this.data.phcReferrals;
  }

  public createReferral(r: Omit<PHCReferral, 'id' | 'createdAt' | 'updatedAt'>): PHCReferral {
    const newRef: PHCReferral = {
      ...r,
      id: `REF-TN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.phcReferrals.unshift(newRef);
    this.save();
    return newRef;
  }

  public updateReferral(id: string, updates: Partial<PHCReferral>): PHCReferral {
    const idx = this.data.phcReferrals.findIndex((r) => r.id === id);
    if (idx >= 0) {
      this.data.phcReferrals[idx] = {
        ...this.data.phcReferrals[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.phcReferrals[idx];
    }
    throw new Error(`Referral ${id} not found`);
  }

  // Notifications
  public getNotifications(role?: string, journeyId?: string): Notification[] {
    return this.data.notifications.filter((n) => {
      if (journeyId && n.targetJourneyId && n.targetJourneyId !== journeyId) return false;
      if (role && n.targetRole !== 'all' && n.targetRole !== role) return false;
      return true;
    });
  }

  public createNotification(n: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
    const newNotif: Notification = {
      ...n,
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(newNotif);
    this.save();
    return newNotif;
  }

  public markNotificationRead(id: string): void {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.save();
    }
  }

  // Audit Logs
  public logAudit(actionType: string, entityName: string, entityId: string, details: string, userId?: string) {
    const log: AuditLog = {
      id: `AUD-${Date.now()}`,
      userId,
      actionType,
      entityName,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    this.save();
  }
}

export const db = new DatabaseEngine();
