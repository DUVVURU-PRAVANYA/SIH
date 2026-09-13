import { IVRSession, IVRLanguage, IVRCallState } from './ivr.types';
import { PROMPTS_EN, PROMPTS_TA } from './ivr.prompts';

class IVRSessionManager {
  private sessions: Map<string, IVRSession> = new Map();

  public createSession(callerPhone: string, defaultLanguage: IVRLanguage = 'en'): IVRSession {
    const sessionId = `CALL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanPhone = (callerPhone || '9876543210').replace(/[^0-9]/g, '').slice(-10);

    const session: IVRSession = {
      sessionId,
      callerPhone: cleanPhone,
      language: defaultLanguage,
      state: 'LANGUAGE_MENU',
      startTime: Date.now(),
      lastPromptTextEn: PROMPTS_EN.languageSelect,
      lastPromptTextTa: PROMPTS_TA.languageSelect,
      lastSpokenText: PROMPTS_EN.languageSelect,
      needsSpeechInput: false,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  public getSession(sessionId: string): IVRSession | undefined {
    return this.sessions.get(sessionId);
  }

  public updateSession(sessionId: string, updates: Partial<IVRSession>): IVRSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const updated = { ...session, ...updates };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  public endSession(sessionId: string): IVRSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.state = 'CALL_ENDED';
    session.endTime = Date.now();
    return session;
  }

  public deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  // Cleanup sessions older than 30 minutes
  public cleanup() {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [id, s] of this.sessions.entries()) {
      if ((s.startTime && s.startTime < cutoff) || s.state === 'CALL_ENDED') {
        this.sessions.delete(id);
      }
    }
  }
}

export const ivrSessionManager = new IVRSessionManager();
