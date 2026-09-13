import { IVRActionResponse, DemoCaller } from '../types';
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/ivr`;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' && window.location.port === '5175') {
      return 'http://localhost:4000/api/ivr';
    }
    return '/api/ivr';
  }
  return 'http://localhost:4000/api/ivr';
};

const BASE_URL = getBaseUrl();

export class IVRClient {
  public async startCall(phone: string, language: 'en' | 'ta' = 'en'): Promise<IVRActionResponse> {
    const res = await fetch(`${BASE_URL}/call/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, language }),
    });
    if (!res.ok) {
      throw new Error(`Failed to start call: ${res.statusText}`);
    }
    return res.json();
  }

  public async sendDtmf(sessionId: string, digit: string): Promise<IVRActionResponse> {
    const res = await fetch(`${BASE_URL}/call/dtmf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, digit }),
    });
    if (!res.ok) {
      throw new Error(`Failed to process key: ${res.statusText}`);
    }
    return res.json();
  }

  public async sendSymptom(sessionId: string, transcript: string): Promise<IVRActionResponse> {
    const res = await fetch(`${BASE_URL}/call/symptom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, transcript }),
    });
    if (!res.ok) {
      throw new Error(`Failed to submit symptoms: ${res.statusText}`);
    }
    return res.json();
  }

  public async endCall(sessionId: string): Promise<IVRActionResponse> {
    const res = await fetch(`${BASE_URL}/call/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) {
      throw new Error(`Failed to end call: ${res.statusText}`);
    }
    return res.json();
  }

  public async checkStatus(phone: string, language: 'en' | 'ta' = 'en'): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/call/status/${encodeURIComponent(phone)}?lang=${language}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  }

  public async getDemoCallers(): Promise<DemoCaller[]> {
    try {
      const res = await fetch(`${BASE_URL}/demo-callers`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.callers || [];
    } catch {
      return [
        { label: 'Default Demo Caller (New/Clean)', phone: '9876543210', type: 'default' },
      ];
    }
  }
}

export const ivrClient = new IVRClient();
