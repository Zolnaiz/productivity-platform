export interface WorkspaceProfile {
  id: string;
  name: string;
  industry: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  employeeCount: number;
  plan: 'demo' | 'starter' | 'growth' | 'enterprise';
}

export interface WorkspaceSettings {
  timezone: string;
  language: string;
  monthCloseDay: number;
  autoMonthlyReport: boolean;
  notifyOverdueTasks: boolean;
  notifyLowAuditScore: boolean;
  requireWorkLogApproval: boolean;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  module: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}
