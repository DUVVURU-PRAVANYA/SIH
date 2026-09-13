import { Request, Response } from 'express';
import { ivrService } from './ivr.service';
import { ivrSessionManager } from './ivr.session';
import { db } from '../db/database';

export class IVRController {
  /**
   * POST /api/ivr/call/start
   */
  public async startCall(req: Request, res: Response) {
    try {
      const { phone, language } = req.body;
      const callerPhone = (phone || '9876543210').toString().trim();
      const initialLang = language === 'ta' ? 'ta' : 'en';

      const result = ivrService.startCall(callerPhone, initialLang);
      return res.json(result);
    } catch (err: any) {
      console.error('[IVR] Start Call Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/ivr/call/dtmf
   */
  public async handleDtmf(req: Request, res: Response) {
    try {
      const { sessionId, digit } = req.body;
      if (!sessionId || digit === undefined) {
        return res.status(400).json({ success: false, error: 'sessionId and digit are required' });
      }

      const cleanDigit = digit.toString().trim().slice(-1);
      const result = ivrService.handleDtmf(sessionId, cleanDigit);
      return res.json(result);
    } catch (err: any) {
      console.error('[IVR] DTMF Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/ivr/call/symptom
   */
  public async handleSymptomSpeech(req: Request, res: Response) {
    try {
      const { sessionId, transcript } = req.body;
      if (!sessionId || !transcript) {
        return res.status(400).json({ success: false, error: 'sessionId and transcript are required' });
      }

      const result = ivrService.handleSymptomSpeech(sessionId, transcript.toString().trim());
      return res.json(result);
    } catch (err: any) {
      console.error('[IVR] Symptom Speech Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/ivr/call/end
   */
  public async endCall(req: Request, res: Response) {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'sessionId is required' });
      }

      const result = ivrService.endCall(sessionId);
      return res.json(result);
    } catch (err: any) {
      console.error('[IVR] End Call Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/ivr/call/status/:phone
   */
  public async checkCallerStatus(req: Request, res: Response) {
    try {
      const { phone } = req.params;
      const lang = req.query.lang === 'ta' ? 'ta' : 'en';
      const statusInfo = ivrService.getActiveTokenInfo(phone, lang);
      return res.json({ success: true, data: statusInfo });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/ivr/call/:sessionId
   */
  public async getSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = ivrSessionManager.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      return res.json({ success: true, session });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/ivr/demo-callers
   * Provides quick selection of demo caller profiles for hackathon judges
   */
  public async getDemoCallers(req: Request, res: Response) {
    try {
      const existingPatients = db.getPatients().slice(0, 5);
      const callers = [
        {
          label: 'Default Demo Caller (New/Clean)',
          phone: '9876543210',
          type: 'default',
        },
        ...existingPatients.map((p) => ({
          label: `${p.name} (Existing Patient)`,
          phone: p.phone,
          type: 'existing',
        })),
        {
          label: 'Random New Caller Identity',
          phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
          type: 'random',
        },
      ];

      return res.json({ success: true, callers });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const ivrController = new IVRController();
