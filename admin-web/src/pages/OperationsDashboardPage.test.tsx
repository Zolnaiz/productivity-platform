import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OperationsDashboardPage from './OperationsDashboardPage';

const serviceMocks = vi.hoisted(() => ({
  getSummary: vi.fn(),
  getActionItems: vi.fn(),
}));

vi.mock('../services/operations.service', () => ({
  operationsService: {
    getSummary: serviceMocks.getSummary,
  },
}));

vi.mock('../services/action.service', () => ({
  actionService: {
    getActionItems: serviceMocks.getActionItems,
  },
}));

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <OperationsDashboardPage />
    </MemoryRouter>,
  );

describe('OperationsDashboardPage', () => {
  beforeEach(() => {
    serviceMocks.getSummary.mockReset();
    serviceMocks.getActionItems.mockReset();
  });

  it('shows a loading state while dashboard data is being fetched', () => {
    serviceMocks.getSummary.mockReturnValue(new Promise(() => undefined));
    serviceMocks.getActionItems.mockReturnValue(new Promise(() => undefined));

    renderDashboard();

    // Asserted through the status role rather than the spinner's copy, so the
    // contract is "the page announces it is loading", not one specific string.
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('shows an error state when dashboard data cannot be loaded', async () => {
    serviceMocks.getSummary.mockRejectedValue(new Error('backend unavailable'));
    serviceMocks.getActionItems.mockRejectedValue(new Error('backend unavailable'));

    renderDashboard();

    expect(await screen.findByText('Could not load dashboard data.')).toBeTruthy();
  });
});
