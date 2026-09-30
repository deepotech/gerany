import fs from 'fs';
import path from 'path';

export interface DataAuditEvent {
  eventId: string;
  entityId: string;
  entityType: 'mosque' | 'city' | 'verification' | 'claim' | 'contribution';
  field: string;
  previousValue: any;
  newValue: any;
  actor: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'REVOKE' | 'PROMOTE';
  reason: string;
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
}

export class AuditLogService {
  private events: DataAuditEvent[] = [];
  private logFilePath: string;

  constructor(storageDir?: string) {
    const dir = storageDir || path.resolve(process.cwd(), 'reports', 'audit');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.logFilePath = path.join(dir, 'production-audit-events.jsonl');
  }

  logEvent(event: Omit<DataAuditEvent, 'eventId' | 'timestamp'>): DataAuditEvent {
    const fullEvent: DataAuditEvent = {
      ...event,
      eventId: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
    };

    this.events.push(fullEvent);

    try {
      fs.appendFileSync(this.logFilePath, JSON.stringify(fullEvent) + '\n', 'utf8');
    } catch {
      // Non-blocking in ephemeral test environments
    }

    return fullEvent;
  }

  getEventsForEntity(entityId: string): DataAuditEvent[] {
    return this.events.filter((e) => e.entityId === entityId);
  }

  getAllEvents(): DataAuditEvent[] {
    return [...this.events];
  }
}
