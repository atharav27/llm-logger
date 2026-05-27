// lib/utils/sse.ts — legacy EventSource helper (prefer lib/api/sse.ts for chat streaming)

export interface SSEOptions {
  url: string;
  onMessage: (data: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectIntervalMs?: number;
}

export class SSEConnection {
  private url: string;
  private onMessage: (data: any) => void;
  private onError?: (error: Event) => void;
  private onOpen?: () => void;
  
  private eventSource: EventSource | null = null;
  private autoReconnect: boolean;
  private maxReconnectAttempts: number;
  private reconnectIntervalMs: number;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isExplicitlyClosed = false;

  constructor(options: SSEOptions) {
    this.url = options.url;
    this.onMessage = options.onMessage;
    this.onError = options.onError;
    this.onOpen = options.onOpen;
    this.autoReconnect = options.autoReconnect ?? true;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.reconnectIntervalMs = options.reconnectIntervalMs ?? 1000;
  }

  public connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.isExplicitlyClosed = false;

    try {
      this.eventSource = new EventSource(this.url, {
        withCredentials: true,
      });

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        if (this.onOpen) this.onOpen();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          this.onMessage(parsedData);
        } catch (e) {
          // If message is raw string or failed to parse, pass it raw
          this.onMessage(event.data);
        }
      };

      this.eventSource.onerror = (error) => {
        if (this.onError) this.onError(error);
        
        // Close current connection
        this.closeEventSource();

        // Attempt reconnection if eligible
        if (!this.isExplicitlyClosed && this.autoReconnect) {
          this.attemptReconnect();
        }
      };
    } catch (err) {
      console.error("Failed to initialize SSE EventSource:", err);
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.clearReconnectTimer();
    this.closeEventSource();
    this.reconnectAttempts = 0;
  }

  private closeEventSource(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`SSE reconnection failed after ${this.maxReconnectAttempts} attempts.`);
      return;
    }

    this.clearReconnectTimer();

    // Exponential backoff
    const delay = this.reconnectIntervalMs * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`SSE reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  public isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}
