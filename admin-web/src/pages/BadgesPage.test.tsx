import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BadgesPage from './BadgesPage';

vi.mock('../services/productivity.service', () => ({
  productivityService: {
    getBadges: async () => [
      { id: 'firstWorkLog', earned: true, current: 1, target: 1 },
      { id: 'focusStreak', earned: false, current: 2, target: 3 },
    ],
  },
}));

describe('BadgesPage', () => {
  it('names each badge from the locale and shows earned state and progress', async () => {
    render(<BadgesPage />);

    expect(await screen.findByText('First work log')).toBeTruthy();
    expect(screen.getByText('Three focus sessions in one day.')).toBeTruthy();
    expect(screen.getByText('Progress: 2 of 3')).toBeTruthy();
    expect(screen.getByText('Earned')).toBeTruthy();
    expect(screen.getByText('Locked')).toBeTruthy();
  });
});
