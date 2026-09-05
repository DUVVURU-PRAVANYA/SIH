import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

export type RealtimeEventName =
  | 'TOKEN_CREATED'
  | 'PATIENT_CALLED'
  | 'CONSULTATION_STARTED'
  | 'CONSULTATION_COMPLETED'
  | 'DIAGNOSTIC_ORDER_CREATED'
  | 'DIAGNOSTIC_STARTED'
  | 'DIAGNOSTIC_COMPLETED'
  | 'PHARMACY_ORDER_CREATED'
  | 'PHARMACY_STARTED'
  | 'PHARMACY_COMPLETED'
  | 'QUEUE_UPDATED'
  | 'ETA_UPDATED'
  | 'REFERRAL_CREATED'
  | 'REFERRAL_ACCEPTED'
  | 'REFERRAL_UPDATED'
  | 'EMERGENCY_STATUS_CHANGED'
  | 'NOTIFICATION_CREATED'
  | 'HOSPITAL_CONFIG_UPDATED';

export interface RealtimeMessage {
  event: RealtimeEventName;
  payload: any;
  timestamp: string;
}

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function initWebSocketServer(server: http.Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    clients.add(ws);
    // console.log(`[WS] Client connected. Total active connections: ${clients.size}`);

    // Send welcome handshake
    ws.send(
      JSON.stringify({
        event: 'CONNECTED',
        payload: { message: 'GH-QueueFlow Realtime WebSocket Engine Connected', activeConnections: clients.size },
        timestamp: new Date().toISOString(),
      })
    );

    ws.on('message', (message: string) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        }
      } catch (err) {
        // ignore non-json
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      // console.log(`[WS] Client disconnected. Total active connections: ${clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[WS] Connection error:', err);
      clients.delete(ws);
    });
  });

  console.log('⚡ WebSocket Realtime Engine initialized on path /ws');
}

export function broadcastEvent(event: RealtimeEventName, payload: any) {
  const message: RealtimeMessage = {
    event,
    payload,
    timestamp: new Date().toISOString(),
  };

  const raw = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(raw);
      } catch (err) {
        console.error(`[WS] Error sending event ${event}:`, err);
      }
    }
  });
}
