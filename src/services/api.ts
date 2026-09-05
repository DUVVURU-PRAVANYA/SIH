const API_BASE_URL = 'http://localhost:4000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const json = await res.json();
    return json;
  } catch (err: any) {
    console.warn(`[API] Request to ${endpoint} failed:`, err);
    return {
      success: false,
      error: err.message || 'Network connection to backend server failed',
    };
  }
}

export const apiClient = {
  // Hospital & Config
  getHospital: () => fetchApi('/hospital'),
  updateHospitalConfig: (config: any) =>
    fetchApi('/hospital/config', { method: 'POST', body: JSON.stringify(config) }),

  // Departments
  getDepartments: () => fetchApi('/departments'),
  updateCounterAllocation: (deptId: string, activeCounters: number, isBottleneck?: boolean) =>
    fetchApi(`/departments/${deptId}/counter`, {
      method: 'POST',
      body: JSON.stringify({ activeCounters, isBottleneck }),
    }),

  // Doctors
  getDoctors: () => fetchApi('/doctors'),

  // Patient Registration & Journey
  registerPatient: (data: {
    name: string;
    nameTa?: string;
    age: number;
    gender: string;
    phone: string;
    departmentId: string;
    priority?: string;
    preferredLanguage?: string;
  }) => fetchApi('/patients/register', { method: 'POST', body: JSON.stringify(data) }),

  createVisit: (data: {
    patientId: string;
    doctorId?: string;
    departmentId: string;
    symptoms?: string;
    priority?: string;
    forceNew?: boolean;
  }) => fetchApi('/visits/create', { method: 'POST', body: JSON.stringify(data) }),

  getActiveVisit: (patientId: string) => fetchApi(`/patients/${patientId}/active-visit`),

  getPatient: (patientId: string) => fetchApi(`/patients/${patientId}`),

  updatePatientProfile: (
    patientId: string,
    data: {
      name?: string;
      nameTa?: string;
      age?: number;
      gender?: string;
      bloodGroup?: string;
      allergies?: string[] | string;
      chronicConditions?: string[] | string;
    }
  ) => fetchApi(`/patients/${patientId}/profile`, { method: 'PUT', body: JSON.stringify(data) }),

  getPatientHistory: (patientId: string) => fetchApi(`/patients/${patientId}/history`),
  getPatientReports: (patientId: string) => fetchApi(`/patients/${patientId}/reports`),
  getPatientPrescriptions: (patientId: string) => fetchApi(`/patients/${patientId}/prescriptions`),

  getJourney: (journeyId: string) => fetchApi(`/journey/${journeyId}`),

  // Queues & Doctor
  getQueue: (departmentId: string) => fetchApi(`/queues/${departmentId}`),
  callPatient: (data: { queueEntryId?: string; departmentId?: string }) =>
    fetchApi('/queues/call', { method: 'POST', body: JSON.stringify(data) }),
  startConsultation: (queueEntryId: string, journeyId: string) =>
    fetchApi('/consultations/start', { method: 'POST', body: JSON.stringify({ queueEntryId, journeyId }) }),
  completeConsultation: (data: any) =>
    fetchApi('/consultations/complete', { method: 'POST', body: JSON.stringify(data) }),
  createRevisit: (data: { patientId: string; decisionType: 'normal' | 'emergency'; doctorRemarks?: string }) =>
    fetchApi('/visits/revisit', { method: 'POST', body: JSON.stringify(data) }),

  // Diagnostics
  getDiagnostics: () => fetchApi('/diagnostics'),
  startDiagnostic: (orderId: string) =>
    fetchApi('/diagnostics/start', { method: 'POST', body: JSON.stringify({ orderId }) }),
  completeDiagnostic: (orderId: string, findingsSummary?: string) =>
    fetchApi('/diagnostics/complete', { method: 'POST', body: JSON.stringify({ orderId, findingsSummary }) }),

  // Pharmacy
  getPharmacyOrders: () => fetchApi('/pharmacy'),
  updatePharmacyStatus: (orderId: string, status: string) =>
    fetchApi('/pharmacy/status', { method: 'POST', body: JSON.stringify({ orderId, status }) }),
  dispensePharmacyOrder: (orderId: string) =>
    fetchApi('/pharmacy/dispense', { method: 'POST', body: JSON.stringify({ orderId }) }),

  // Referrals
  getReferrals: () => fetchApi('/referrals'),
  createReferral: (data: any) =>
    fetchApi('/referrals', { method: 'POST', body: JSON.stringify(data) }),
  updateReferralStatus: (id: string, status: string) =>
    fetchApi(`/referrals/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Admin Dashboard
  getAdminDashboard: () => fetchApi('/admin/dashboard'),
  toggleEmergency: () => fetchApi('/admin/emergency', { method: 'POST' }),
  resetDatabase: () => fetchApi('/admin/reset', { method: 'POST' }),

  // Notifications
  getNotifications: (role?: string, journeyId?: string) =>
    fetchApi(`/notifications?role=${role || ''}&journeyId=${journeyId || ''}`),
  markNotificationRead: (id: string) =>
    fetchApi('/notifications/read', { method: 'POST', body: JSON.stringify({ id }) }),
};
