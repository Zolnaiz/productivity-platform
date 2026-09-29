import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WeekReminder from './WeekReminder';

const mocks = vi.hoisted(() => ({ getMine: vi.fn() }));
vi.mock('../../services/checkin.service', async (actual) => ({
  ...(await actual<typeof import('../../services/checkin.service')>()),
  checkinService: { getMine: mocks.getMine },
}));

const renderAt = (date: Date) => {
  vi.setSystemTime(date);
  return render(
    <MemoryRouter>
      <WeekReminder />
    </MemoryRouter>,
  );
};

describe('the end-of-week reminder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
  });
  afterEach(() => vi.useRealTimers());

  it('reminds on Friday when the week is not written', async () => {
    mocks.getMine.mockResolvedValue(null);
    renderAt(new Date(2026, 9, 2, 10));

    expect(await screen.findByTestId('week-reminder')).toBeTruthy();
    expect(mocks.getMine).toHaveBeenCalledWith('2026-09-28');
  });

  it('says nothing once the week is written', async () => {
    mocks.getMine.mockResolvedValue({ userId: 'u1', week: '2026-09-28', progress: 'x', plans: '', problems: '' });
    renderAt(new Date(2026, 9, 2, 10));

    await waitFor(() => expect(mocks.getMine).toHaveBeenCalled());
    expect(screen.queryByTestId('week-reminder')).toBeNull();
  });

  it('does not ask on a Monday', () => {
    renderAt(new Date(2026, 8, 28, 10));

    expect(mocks.getMine).not.toHaveBeenCalled();
    expect(screen.queryByTestId('week-reminder')).toBeNull();
  });
});
