import { IVRActionResponse, DemoCaller } from '../types';
async function safeIvrFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const candidates: string[] = [];

  if (import.meta.env.VITE_API_URL) {
    candidates.push(`${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/ivr`);
  }

  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Always include relative path first (works seamlessly on Render, production reverse proxies, and Vite dev server)
    candidates.push('/api/ivr');
    if (isLocal) {
      candidates.push(`http://${window.location.hostname}:4000/api/ivr`);
      candidates.push('http://localhost:4000/api/ivr');
      candidates.push('http://127.0.0.1:4000/api/ivr');
    }
  } else {
    candidates.push('http://localhost:4000/api/ivr');
  }

  const uniqueCandidates = Array.from(new Set(candidates));
  let lastError: any = null;

  for (const base of uniqueCandidates) {
    try {
      const url = `${base}${endpoint}`;
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        lastError = new Error(`Server returned ${res.status}: ${errBody || res.statusText}`);
        continue;
      }

      const text = await res.text();
      if (!text || !text.trim()) {
        lastError = new Error('Empty response from IVR server');
        continue;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        lastError = new Error(`Invalid JSON received: ${text.slice(0, 100)}`);
        continue;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Could not connect to IVR server on port 4000');
}

export class IVRClient {
  public async startCall(phone: string, language: 'en' | 'ta' = 'en'): Promise<IVRActionResponse> {
    return safeIvrFetch<IVRActionResponse>('/call/start', {
      method: 'POST',
      body: JSON.stringify({ phone, language }),
    });
  }

  public async sendDtmf(sessionId: string, digit: string): Promise<IVRActionResponse> {
    return safeIvrFetch<IVRActionResponse>('/call/dtmf', {
      method: 'POST',
      body: JSON.stringify({ sessionId, digit }),
    });
  }

  public async sendSymptom(sessionId: string, transcript: string): Promise<IVRActionResponse> {
    return safeIvrFetch<IVRActionResponse>('/call/symptom', {
      method: 'POST',
      body: JSON.stringify({ sessionId, transcript }),
    });
  }

  public async endCall(sessionId: string): Promise<IVRActionResponse> {
    return safeIvrFetch<IVRActionResponse>('/call/end', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  public async checkStatus(phone: string, language: 'en' | 'ta' = 'en'): Promise<any> {
    try {
      const data = await safeIvrFetch<any>(`/call/status/${encodeURIComponent(phone)}?lang=${language}`, {
        method: 'GET',
      });
      return data?.data || data;
    } catch {
      return null;
    }
  }

  public async getDemoCallers(): Promise<DemoCaller[]> {
    try {
      const data = await safeIvrFetch<any>('/demo-callers', {
        method: 'GET',
      });
      return data?.callers || [];
    } catch {
      return [
        { label: 'Default Demo Caller (New/Clean)', phone: '9876543210', type: 'default' },
      ];
    }
  }
}

export const ivrClient = new IVRClient();
