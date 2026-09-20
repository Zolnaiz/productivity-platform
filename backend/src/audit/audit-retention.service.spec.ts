import { Logger } from '@nestjs/common';
import {
  AuditRetentionService,
  DEFAULT_RETENTION_DAYS,
  cutoffFor,
  retentionDays,
} from './audit-retention.service';

const createService = (configured?: unknown) => {
  const entries = { delete: jest.fn(async () => ({ affected: 0 })) };
  const configService = { get: jest.fn(() => configured) };
  const service = new AuditRetentionService(entries as never, configService as never);

  return { service, entries };
};

describe('how long the trail is kept', () => {
  it('is two years unless somebody says otherwise', () => {
    // A quality programme is reviewed annually and argued about the year
    // after, so a year is too short.
    expect(retentionDays(undefined)).toBe(DEFAULT_RETENTION_DAYS);
    expect(DEFAULT_RETENTION_DAYS).toBe(730);
  });

  it('takes the number it is given', () => {
    expect(retentionDays('90')).toBe(90);
    expect(retentionDays(365)).toBe(365);
  });

  it('reads zero as keep everything, which has to be said rather than implied', () => {
    expect(retentionDays('0')).toBe(0);
  });

  it('falls back rather than trusting a value that makes no sense', () => {
    // A negative or unreadable setting must not become "delete everything".
    expect(retentionDays('-30')).toBe(DEFAULT_RETENTION_DAYS);
    expect(retentionDays('soon')).toBe(DEFAULT_RETENTION_DAYS);
  });

  it('reads an absent setting as the default, not as zero', () => {
    // `Number(null)` is 0, so a cast would turn "nobody configured this" into
    // "keep everything for ever" — a decision nobody took.
    expect(retentionDays(null)).toBe(DEFAULT_RETENTION_DAYS);
    expect(retentionDays('')).toBe(DEFAULT_RETENTION_DAYS);
    expect(retentionDays(undefined)).toBe(DEFAULT_RETENTION_DAYS);
  });

  it('counts the cutoff back from now', () => {
    const now = new Date('2026-09-20T00:00:00.000Z');

    expect(cutoffFor(30, now).toISOString()).toBe('2026-08-21T00:00:00.000Z');
  });
});

describe('the nightly pass', () => {
  it('removes what is older than the cutoff and nothing else', async () => {
    const { service, entries } = createService('30');
    entries.delete.mockResolvedValue({ affected: 12 } as never);

    expect(await service.removeExpiredEntries()).toBe(12);
    expect(entries.delete).toHaveBeenCalledWith({ createdAt: expect.anything() });
  });

  it('deletes nothing at all when everything is kept', async () => {
    const { service, entries } = createService('0');

    expect(await service.removeExpiredEntries()).toBe(0);
    expect(entries.delete).not.toHaveBeenCalled();
  });

  it('is a warning rather than an outage when it fails', async () => {
    // The trail keeps being written, and the next night tries again.
    const warned = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const { service, entries } = createService('30');
    entries.delete.mockRejectedValue(new Error('database busy') as never);

    expect(await service.removeExpiredEntries()).toBe(0);
    expect(warned).toHaveBeenCalledWith(expect.stringContaining('database busy'));
    warned.mockRestore();
  });

  it('says how many it removed, and stays quiet when there was nothing', async () => {
    const logged = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const { service, entries } = createService('30');

    await service.removeExpiredEntries();
    expect(logged).not.toHaveBeenCalled();

    entries.delete.mockResolvedValue({ affected: 5 } as never);
    await service.removeExpiredEntries();
    expect(logged).toHaveBeenCalledWith(expect.stringContaining('Removed 5'));

    logged.mockRestore();
  });
});
