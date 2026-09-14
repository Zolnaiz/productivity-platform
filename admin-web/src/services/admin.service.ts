import { get, isDemoMode, localId, patch, shouldUseDemoFallback } from './api';
import { peopleService } from './people.service';
import {
  AuditLogEntry,
  Organization,
  OrganizationSettings,
  WorkspaceProfile,
  WorkspaceSettings,
} from '../types/admin.types';

/**
 * The workspace: who this organization is, and how it is set up.
 *
 * This used to keep the whole thing in browser storage, so the workspace name
 * a person typed was visible only to them. It now reads and writes
 * `/organizations/my-organization`. The API takes the organization from the
 * caller's token, so there is no id to pass and no way to reach another
 * tenant's record.
 *
 * The audit log is the exception and says so on its own screen: there is no
 * table behind it yet.
 */

const auditLogKey = 'productivity-demo-audit-log';
const demoOrganizationKey = 'productivity-demo-organization';

const demoOrganization: Organization = {
  id: 'workspace-demo',
  name: 'Demo Operations Workspace',
  address: 'Ulaanbaatar, Mongolia',
  contactEmail: 'owner@example.com',
  phone: '+976 9900 0000',
  settings: {
    industry: 'Manufacturing / Operations',
    timezone: 'Asia/Ulaanbaatar',
    language: 'mn-MN',
    monthCloseDay: 5,
  },
};

const defaultAuditLog: AuditLogEntry[] = [
  {
    id: 'log-1',
    actor: 'Demo Owner',
    action: 'Workspace opened',
    module: 'Admin',
    details: 'The demo workspace was opened for exploration.',
    severity: 'info',
    createdAt: '2026-06-12 09:10',
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

/** Stands in for `GET /organizations/my-organization`. */
const readDemoOrganization = () => readObject(demoOrganizationKey, demoOrganization);

/** Stands in for `PATCH /organizations/my-organization`. */
const updateDemoOrganization = (changes: Partial<Organization>) =>
  writeObject(demoOrganizationKey, { ...readDemoOrganization(), ...changes });

const fetchOrganization = async (): Promise<Organization> => {
  if (isDemoMode()) {
    return readDemoOrganization();
  }

  try {
    return await get<Organization>('/organizations/my-organization');
  } catch (error) {
    if (!shouldUseDemoFallback()) {
      throw error;
    }

    return readDemoOrganization();
  }
};

const saveOrganization = (changes: Partial<Organization>) =>
  isDemoMode()
    ? Promise.resolve(updateDemoOrganization(changes))
    : patch<Organization>('/organizations/my-organization', changes);

/**
 * Merges into the existing settings rather than replacing them.
 *
 * `settings` is one JSON column, so writing only the keys a screen knows
 * about would silently drop the ones belonging to the other screen — saving
 * the workspace profile would erase the chosen language.
 */
const withSettings = (current: Organization, changes: OrganizationSettings) => ({
  settings: { ...(current.settings ?? {}), ...changes },
});

const appendAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) => {
  const logs = readObject<AuditLogEntry[]>(auditLogKey, defaultAuditLog);
  const item: AuditLogEntry = {
    ...entry,
    id: localId(),
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };

  writeObject(auditLogKey, [item, ...logs]);
  return item;
};

const toProfile = (organization: Organization, employeeCount: number): WorkspaceProfile => ({
  id: organization.id,
  name: organization.name,
  industry: organization.settings?.industry ?? '',
  address: organization.address ?? '',
  contactEmail: organization.contactEmail ?? '',
  contactPhone: organization.phone ?? '',
  employeeCount,
});

const toSettings = (organization: Organization): WorkspaceSettings => ({
  timezone: organization.settings?.timezone ?? 'Asia/Ulaanbaatar',
  // The language select offers `mn-MN` and `en-US`; a bare `mn`
  // matches neither option and leaves the field blank.
  language: organization.settings?.language ?? 'mn-MN',
  monthCloseDay: organization.settings?.monthCloseDay ?? 5,
});

export const adminService = {
  getOrganization: fetchOrganization,

  getWorkspaceProfile: async (): Promise<WorkspaceProfile> => {
    // The headcount is counted, not stored, so it cannot drift from the
    // people who can actually sign in.
    const [organization, members] = await Promise.all([
      fetchOrganization(),
      peopleService.getMembers().catch(() => []),
    ]);

    return toProfile(organization, members.filter((member) => member.isActive).length);
  },

  updateWorkspaceProfile: async (profile: WorkspaceProfile): Promise<WorkspaceProfile> => {
    const current = await fetchOrganization();
    const saved = await saveOrganization({
      name: profile.name,
      address: profile.address,
      contactEmail: profile.contactEmail,
      phone: profile.contactPhone,
      ...withSettings(current, { industry: profile.industry }),
    });

    return toProfile(saved, profile.employeeCount);
  },

  getWorkspaceSettings: async (): Promise<WorkspaceSettings> => toSettings(await fetchOrganization()),

  updateWorkspaceSettings: async (settings: WorkspaceSettings): Promise<WorkspaceSettings> => {
    const current = await fetchOrganization();

    return toSettings(await saveOrganization(withSettings(current, settings)));
  },

  /**
   * The audit log has no table behind it yet.
   *
   * Kept local, and the screen says so. A record of who changed what has to be
   * written by the server as things happen — a list the browser keeps is not
   * an audit trail, and dressing one up as though it were is worse than
   * having none.
   */
  getAuditLog: () => Promise.resolve(readObject<AuditLogEntry[]>(auditLogKey, defaultAuditLog)),
  appendAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) => Promise.resolve(appendAuditLog(entry)),
};
