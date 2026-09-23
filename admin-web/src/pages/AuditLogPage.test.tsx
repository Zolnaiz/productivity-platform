import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuditLogPage from './AuditLogPage';
import { AuditLogEntry } from '../types/admin.types';

const serviceMocks = vi.hoisted(() => ({ getAuditLog: vi.fn() }));

vi.mock('../services/admin.service', () => ({
  adminService: { getAuditLog: serviceMocks.getAuditLog },
}));

const entry = (over: Partial<AuditLogEntry> = {}): AuditLogEntry =>
  ({
    id: 'a1',
    actorName: 'Sara Person',
    actorRole: 'manager',
    module: 'five-s-layouts',
    action: 'updated',
    method: 'PATCH',
    route: '/api/five-s-layouts/:id',
    statusCode: 200,
    severity: 'info',
    createdAt: '2026-09-23T08:00:00.000Z',
    ...over,
  }) as AuditLogEntry;

describe('the record of who changed what', () => {
  beforeEach(() => {
    serviceMocks.getAuditLog.mockReset();
  });

  it('says what a value was before, beside what it became', async () => {
    // "Set to monthly" is half an answer; the question a reader is asking is
    // what it was before they set it.
    serviceMocks.getAuditLog.mockResolvedValue([
      entry({
        changes: { fields: ['auditFrequency'], values: { auditFrequency: 'monthly' } },
        before: { fields: ['auditFrequency'], values: { auditFrequency: 'weekly' } },
      }),
    ]);

    render(<AuditLogPage />);

    expect(await screen.findByText('weekly')).toBeTruthy();
    expect(screen.getByText('monthly')).toBeTruthy();
  });

  it('shows only the new value when nothing could say what was there before', async () => {
    // A creation, or an entry written before the trail recorded this.
    serviceMocks.getAuditLog.mockResolvedValue([
      entry({ changes: { fields: ['name'], values: { name: 'Machine shop' } } }),
    ]);

    render(<AuditLogPage />);

    expect(await screen.findByText('Machine shop')).toBeTruthy();
    expect(screen.queryByText('weekly')).toBeNull();
  });

  it('leaves a field alone when only some of the change has a before', async () => {
    serviceMocks.getAuditLog.mockResolvedValue([
      entry({
        changes: { fields: ['name', 'floor'], values: { name: 'Machine shop', floor: '2nd' } },
        before: { fields: ['name'], values: { name: 'Shop' } },
      }),
    ]);

    render(<AuditLogPage />);

    expect(await screen.findByText('Shop')).toBeTruthy();
    expect(screen.getByText('2nd')).toBeTruthy();
  });

  it('says nothing rather than showing an empty change', async () => {
    // A delete carries no body, and an empty cell reads as a change with no
    // detail rather than as a change with nothing to describe.
    serviceMocks.getAuditLog.mockResolvedValue([entry({ action: 'deleted', severity: 'warning' })]);

    render(<AuditLogPage />);

    expect(await screen.findByText('—')).toBeTruthy();
  });
});
