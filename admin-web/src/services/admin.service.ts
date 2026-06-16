import { AuditLogEntry, WorkspaceProfile, WorkspaceSettings } from '../types/admin.types';

const profileKey = 'productivity-demo-workspace-profile';
const settingsKey = 'productivity-demo-workspace-settings';
const auditLogKey = 'productivity-demo-audit-log';

const defaultProfile: WorkspaceProfile = {
  id: 'workspace-demo',
  name: 'Demo Operations Workspace',
  industry: 'Manufacturing / Operations',
  address: 'Ulaanbaatar, Mongolia',
  contactEmail: 'owner@example.com',
  contactPhone: '+976 9900 0000',
  employeeCount: 20,
  plan: 'demo',
};

const defaultSettings: WorkspaceSettings = {
  timezone: 'Asia/Ulaanbaatar',
  language: 'mn-MN',
  monthCloseDay: 28,
  autoMonthlyReport: true,
  notifyOverdueTasks: true,
  notifyLowAuditScore: true,
  requireWorkLogApproval: false,
};

const defaultAuditLog: AuditLogEntry[] = [
  {
    id: 'log-1',
    actor: 'Demo Owner',
    action: 'Monthly report exported',
    module: 'Reports',
    details: 'CSV report was generated for the current month.',
    severity: 'info',
    createdAt: '2026-06-12 11:45',
  },
  {
    id: 'log-2',
    actor: 'Quality Manager',
    action: 'Audit submitted',
    module: '5S Audit',
    details: 'Main production floor scored 82%, corrective action needed.',
    severity: 'warning',
    createdAt: '2026-06-12 10:30',
  },
  {
    id: 'log-3',
    actor: 'Demo Owner',
    action: 'User role reviewed',
    module: 'Users',
    details: 'Manager and employee permissions were checked.',
    severity: 'info',
    createdAt: '2026-06-11 17:20',
  },
];

const readObject = <T>(key: string, fallback: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored) as T;
    } catch {
      localStorage.removeItem(key);
    }
  }
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
};

const writeObject = <T>(key: string, value: T): T => {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
};

const appendAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) => {
  const logs = readObject<AuditLogEntry[]>(auditLogKey, defaultAuditLog);
  const item: AuditLogEntry = {
    ...entry,
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
  writeObject(auditLogKey, [item, ...logs]);
  return item;
};

export const adminService = {
  getWorkspaceProfile: () => Promise.resolve(readObject(profileKey, defaultProfile)),
  updateWorkspaceProfile: (data: WorkspaceProfile) => {
    const profile = writeObject(profileKey, data);
    appendAuditLog({
      actor: 'Demo Owner',
      action: 'Workspace profile updated',
      module: 'Organizations',
      details: `${data.name} profile information was saved.`,
      severity: 'info',
    });
    return Promise.resolve(profile);
  },
  getWorkspaceSettings: () => Promise.resolve(readObject(settingsKey, defaultSettings)),
  updateWorkspaceSettings: (data: WorkspaceSettings) => {
    const settings = writeObject(settingsKey, data);
    appendAuditLog({
      actor: 'Demo Owner',
      action: 'Workspace settings updated',
      module: 'Settings',
      details: 'Report, notification, and approval settings were changed.',
      severity: 'info',
    });
    return Promise.resolve(settings);
  },
  getAuditLog: () => Promise.resolve(readObject<AuditLogEntry[]>(auditLogKey, defaultAuditLog)),
  appendAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) => Promise.resolve(appendAuditLog(entry)),
};
