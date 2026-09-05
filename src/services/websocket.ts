type EventCallback = (payload: any) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectInterval: number = 2500;
  private isExplicitlyClosed: boolean = false;
  private isConnected: boolean = false;
  private statusListeners: Set<(connected: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || 'localhost';
      const wsUrl = `${protocol}//${host}:4000/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // console.log('⚡ Connected to GH-QueueFlow Realtime WebSocket Engine');
        this.isConnected = true;
        this.notifyStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event) {
            this.dispatch(data.event, data.payload);
          }
        } catch (err) {
          // ignore non-json
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        if (!this.isExplicitlyClosed) {
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };

      this.ws.onerror = (err) => {
        // console.warn('[WS] Realtime socket connection interrupted');
        this.isConnected = false;
        this.notifyStatus(false);
      };
    } catch (err) {
      console.warn('[WS] Failed to initialize WebSocket:', err);
      this.notifyStatus(false);
    }
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public onStatusChange(callback: (connected: boolean) => void) {
    this.statusListeners.add(callback);
    callback(this.isConnected);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((cb) => cb(connected));
  }

  private dispatch(event: string, payload: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }
    // Also dispatch to wildcard '*' listeners
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      wildcard.forEach((cb) => cb({ event, payload }));
    }
  }

  public close() {
    this.isExplicitlyClosed = true;
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const realtimeClient = new RealtimeClient();
