import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';

const authState = vi.hoisted(() => ({
  user: {
    name: 'Employee User',
    roles: ['employee'],
  },
  logout: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('../../services/operations.service', () => ({
  operationsService: {
    getProjects: vi.fn().mockResolvedValue([]),
    getTasks: vi.fn().mockResolvedValue([]),
    getAuditTemplates: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/assessment.service', () => ({
  assessmentService: {
    getResponses: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/finance.service', () => ({
  financeService: {
    getExpenses: vi.fn().mockResolvedValue([]),
  },
}));

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header onMenuClick={vi.fn()} />
    </MemoryRouter>,
  );

describe('Header search role visibility', () => {
  beforeEach(() => {
    authState.user = {
      name: 'Employee User',
      roles: ['employee'],
    };
    authState.logout.mockReset();
  });

  it('does not expose admin pages in search for non-admin users', async () => {
    renderHeader();

    await userEvent.type(screen.getByRole('searchbox'), 'Admin');

    await waitFor(() => expect(screen.getByText('No matching result')).toBeTruthy());
    expect(screen.queryByText('Workspace control center')).toBeNull();
  });

  it('exposes admin pages in search for admin users', async () => {
    authState.user = {
      name: 'Admin User',
      roles: ['admin'],
    };
    renderHeader();

    await userEvent.type(screen.getByRole('searchbox'), 'Admin');

    await waitFor(() => expect(screen.getByText('Workspace control center')).toBeTruthy());
  });
});
