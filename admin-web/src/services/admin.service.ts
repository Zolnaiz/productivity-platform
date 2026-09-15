import { get, isDemoMode, patch, shouldUseDemoFallback } from './api';
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
 * The audit trail is read here too, from `/audit-log`. Nothing writes to it
 * from this side — the server records what it observed.
 */

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

const demoAuditLog: AuditLogEntry[] = [
  {
    id: 'log-1',
    actorName: 'Demo Owner',
    actorRole: 'admin',
    module: 'projects',
    action: 'created',
    method: 'POST',
    route: '/projects',
    statusCode: 201,
    severity: 'info',
    createdAt: '2026-06-12T09:10:00.000Z',
  },
  {
    id: 'log-2',
    actorName: 'Quality Manager',
    actorRole: 'manager',
    module: 'audit-runs',
    action: 'created',
    method: 'POST',
    route: '/audit-runs',
    statusCode: 201,
    severity: 'info',
    createdAt: '2026-06-12T10:30:00.000Z',
  },
  {
    id: 'log-3',
    actorName: 'Demo Owner',
    actorRole: 'admin',
    module: 'users',
    action: 'deactivate',
    targetId: 'u4',
    method: 'POST',
    route: '/users/:id/deactivate',
    statusCode: 201,
    severity: 'warning',
    createdAt: '2026-06-11T17:20:00.000Z',
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

const fetchFromApi = async <T>(path: string, demoData: T): Promise<T> => {
  if (isDemoMode()) {
    return demoData;
  }

  try {
    return await get<T>(path);
  } catch (error) {
    if (!shouldUseDemoFallback()) {
      throw error;
    }

    return demoData;
  }
};

const fetchOrganization = () =>
  isDemoMode()
    ? Promise.resolve(readDemoOrganization())
    : fetchFromApi<Organization>('/organizations/my-organization', readDemoOrganization());

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
   * The trail, read from the server.
   *
   * There is no `appendAuditLog` any more. Entries are written by the server
   * from requests it observed, which is the only way the record means
   * anything: a client that can add to its own history is not evidence of
   * what it did.
   */
  getAuditLog: (limit = 100) =>
    fetchFromApi<AuditLogEntry[]>(`/audit-log?limit=${limit}`, demoAuditLog),
};
