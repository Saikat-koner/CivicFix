import { Response } from 'express';

export interface CivicRealtimeEvent {
  type: 'issue_created' | 'issue_upvoted' | 'issue_updated' | 'issue_status_changed' | 'issue_deleted' | 'comment_added' | 'vote_recorded';
  issueId: string;
  data?: any;
  timestamp: string;
}

class RealtimeStreamManager {
  private clients: Set<Response> = new Set();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Send periodic heartbeat every 20s to prevent reverse proxy timeouts
    this.heartbeatTimer = setInterval(() => {
      this.broadcastComment('heartbeat');
    }, 20000);
  }

  public registerClient(res: Response, clientId?: string) {
    this.clients.add(res);

    // Initial greeting / handshake event
    res.write(`event: stream_connected\n`);
    res.write(`data: ${JSON.stringify({ status: 'connected', connectedClients: this.clients.size, timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  public broadcast(event: CivicRealtimeEvent) {
    const payload = `event: issue_event\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(payload);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  public broadcastComment(text: string) {
    for (const client of this.clients) {
      try {
        client.write(`: ${text}\n\n`);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }
}

export const realtimeStreamManager = new RealtimeStreamManager();
