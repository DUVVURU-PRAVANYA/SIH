export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : (typeof window !== 'undefined'
      ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? (window.location.port === '4000' ? '/api' : `http://${window.location.hostname}:4000/api`)
          : '/api')
      : 'http://localhost:4000/api');

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

    const text = await res.text();
    if (!text || !text.trim()) {
      return { success: res.ok, message: res.statusText };
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        error: `Unexpected response format from server (${res.status})`,
      };
    }
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
    patientId?: string;
    phone?: string;
    name?: string;
    age?: number;
    gender?: string;
    bloodGroup?: string;
    allergies?: string[] | string;
    chronicConditions?: string[] | string;
    doctorId?: string;
    departmentId?: string;
    symptoms?: string;
    priority?: string;
    forceNew?: boolean;
  }) => {
    return fetchApi('/visits/create', { method: 'POST', body: JSON.stringify(data) });
  },

  getActiveVisit: (patientId: string): Promise<ApiResponse<any>> => {
    if (!patientId) return Promise.resolve({ success: false, error: 'Patient ID is required' });
    return fetchApi(`/patients/${patientId}/active-visit`);
  },

  getPatient: (patientId: string): Promise<ApiResponse<any>> => {
    if (!patientId) return Promise.resolve({ success: false, error: 'Patient ID is required' });
    return fetchApi(`/patients/${patientId}`);
  },

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
  ): Promise<ApiResponse<any>> => {
    if (!patientId) return Promise.resolve({ success: false, error: 'Patient ID is required' });
    return fetchApi(`/patients/${patientId}/profile`, { method: 'PUT', body: JSON.stringify(data) });
  },

  getPatientHistory: (patientId: string): Promise<ApiResponse<any>> => {
    if (!patientId) return Promise.resolve({ success: false, data: [] });
    return fetchApi(`/patients/${patientId}/history`);
  },
  getPatientReports: (patientId: string): Promise<ApiResponse<any>> => {
    if (!patientId) return Promise.resolve({ success: false, data: [] });
    return fetchApi(`/patients/${patientId}/reports`);
  },
  getPatientPrescriptions: (patientId: string): Promise<ApiResponse<any>> => {
    if (!patientId) return Promise.resolve({ success: false, data: [] });
    return fetchApi(`/patients/${patientId}/prescriptions`);
  },

  getJourney: (journeyId: string) => fetchApi(`/journey/${journeyId}`),

  // Queues & Doctor
  getQueue: (departmentId: string, doctorId?: string) =>
    fetchApi(`/queues/${departmentId}${doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : ''}`),
  getDoctorQueue: (doctorId: string) => fetchApi(`/doctors/${doctorId}/queue`),
  callPatient: (data: { queueEntryId?: string; departmentId?: string; doctorId?: string }) =>
    fetchApi('/queues/call', { method: 'POST', body: JSON.stringify(data) }),
  startConsultation: (queueEntryId: string, journeyId: string) =>
    fetchApi('/consultations/start', { method: 'POST', body: JSON.stringify({ queueEntryId, journeyId }) }),
  completeConsultation: (data: any) =>
    fetchApi('/consultations/complete', { method: 'POST', body: JSON.stringify(data) }),
  createRevisit: (data: { patientId: string; decisionType: 'normal' | 'emergency'; doctorRemarks?: string; doctorId?: string }) =>
    fetchApi('/visits/revisit', { method: 'POST', body: JSON.stringify(data) }),

  // Diagnostics
  getDiagnostics: () => fetchApi('/diagnostics'),
  startDiagnostic: (orderId: string) =>
    fetchApi('/diagnostics/start', { method: 'POST', body: JSON.stringify({ orderId }) }),
  completeDiagnostic: (orderId: string, findingsSummary?: string) =>
    fetchApi('/diagnostics/complete', { method: 'POST', body: JSON.stringify({ orderId, findingsSummary }) }),
  reviewDiagnostics: (patientId?: string, orderId?: string) =>
    fetchApi('/diagnostics/review', { method: 'POST', body: JSON.stringify({ patientId, orderId }) }),

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
