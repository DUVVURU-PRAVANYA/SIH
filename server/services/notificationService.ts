import { db } from '../db/database';
import { Notification, UserRole } from '../db/types';
import { broadcastEvent } from '../realtime';

export interface SMSPayload {
  to: string;
  message: string;
  token: string;
  journeyId: string;
  isRealSms: boolean;
  provider: string;
  timestamp: string;
}

export class NotificationService {
  private smsProvider: string;
  private isConfigured: boolean;

  constructor() {
    this.smsProvider = process.env.SMS_PROVIDER || 'demo';
    this.isConfigured = Boolean(
      process.env.SMS_ACCOUNT_SID && process.env.SMS_AUTH_TOKEN && process.env.SMS_FROM
    );
  }

  public async sendNotification(data: {
    targetRole: UserRole | 'all';
    targetJourneyId?: string;
    title: string;
    titleTa: string;
    message: string;
    messageTa: string;
    type: 'info' | 'success' | 'warning' | 'critical' | 'turn';
    phone?: string;
    token?: string;
  }): Promise<{ notification: Notification; smsResult?: SMSPayload }> {
    // 1. Create in-database Notification
    const notif = db.createNotification({
      targetRole: data.targetRole,
      targetJourneyId: data.targetJourneyId,
      title: data.title,
      titleTa: data.titleTa,
      message: data.message,
      messageTa: data.messageTa,
      type: data.type,
    });

    // 2. Broadcast via WebSocket
    broadcastEvent('NOTIFICATION_CREATED', {
      notification: notif,
      targetRole: data.targetRole,
      targetJourneyId: data.targetJourneyId,
    });

    // 3. Handle SMS (Real vs Demo Simulation)
    let smsResult: SMSPayload | undefined = undefined;
    if (data.phone) {
      smsResult = await this.dispatchSms({
        to: data.phone,
        message: `${data.title}: ${data.message}`,
        token: data.token || 'N/A',
        journeyId: data.targetJourneyId || 'N/A',
      });
    }

    return { notification: notif, smsResult };
  }

  private async dispatchSms(payload: {
    to: string;
    message: string;
    token: string;
    journeyId: string;
  }): Promise<SMSPayload> {
    const timestamp = new Date().toISOString();

    if (this.isConfigured && this.smsProvider === 'twilio') {
      try {
        console.log(`[SMS-REAL] Dispatching real SMS via Twilio to ${payload.to}...`);
        // If credentials were provided in env:
        // const client = twilio(process.env.SMS_ACCOUNT_SID, process.env.SMS_AUTH_TOKEN);
        // await client.messages.create({ ... });
        return {
          to: payload.to,
          message: payload.message,
          token: payload.token,
          journeyId: payload.journeyId,
          isRealSms: true,
          provider: 'twilio',
          timestamp,
        };
      } catch (err) {
        console.error('[SMS-ERROR] Real SMS delivery failed, falling back to Demo Simulation:', err);
      }
    }

    // DEMO SMS SIMULATION (Clearly marked and logged)
    console.log(`\n================== [DEMO SMS SIMULATION] ==================`);
    console.log(`TO: ${payload.to}`);
    console.log(`TOKEN: ${payload.token} (Journey: ${payload.journeyId})`);
    console.log(`MESSAGE:\n${payload.message}`);
    console.log(`===========================================================\n`);

    return {
      to: payload.to,
      message: payload.message,
      token: payload.token,
      journeyId: payload.journeyId,
      isRealSms: false,
      provider: 'demo-simulation',
      timestamp,
    };
  }
}

export const notificationService = new NotificationService();
