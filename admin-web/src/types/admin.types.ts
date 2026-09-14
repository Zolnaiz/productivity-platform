/**
 * The organization, as the API returns it.
 *
 * `industry`, `timezone`, `language` and `monthCloseDay` live inside the
 * record's `settings` object rather than as columns, because they are the
 * organization's own preferences rather than part of its identity.
 */
export interface Organization {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  settings?: OrganizationSettings;
}

export interface OrganizationSettings {
  industry?: string;
  timezone?: string;
  language?: string;
  /** The day of the month the books close on. */
  monthCloseDay?: number;
}

/**
 * What the workspace screen edits.
 *
 * `employeeCount` is not stored — it is counted from the members the users
 * API returns, so it cannot disagree with who is actually in the workspace.
 * There was also a `plan` field with no column behind it and nothing reading
 * it; a billing tier the tenant could type into itself is not a billing tier.
 */
export interface WorkspaceProfile {
  id: string;
  name: string;
  industry: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  employeeCount: number;
}

export interface WorkspaceSettings {
  timezone: string;
  language: string;
  monthCloseDay: number;
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
