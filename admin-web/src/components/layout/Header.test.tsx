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

// The header now carries the theme and language switches, so it needs the
// theme context the way the application gives it.
import { ThemeProvider } from '../../contexts/ThemeContext';

const renderHeader = () =>
  render(
    <ThemeProvider>
      <MemoryRouter>
        <Header onMenuClick={vi.fn()} />
      </MemoryRouter>
    </ThemeProvider>,
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

    await userEvent.type(screen.getByRole('combobox'), 'Admin');

    await waitFor(() => expect(screen.getByText('Nothing matches that.')).toBeTruthy());
    expect(screen.queryByText('Workspace control centre')).toBeNull();
  });

  it('exposes admin pages in search for admin users', async () => {
    authState.user = {
      name: 'Admin User',
      roles: ['admin'],
    };
    renderHeader();

    await userEvent.type(screen.getByRole('combobox'), 'Admin');

    await waitFor(() => expect(screen.getByText('Workspace control centre')).toBeTruthy());
  });
});

describe('Header search in Mongolian', () => {
  it('finds a page by its Mongolian name', async () => {
    // The page list was English, so searching in the interface's own
    // language found nothing at all.
    const { default: i18n } = await import('../../i18n');
    await i18n.changeLanguage('mn');
    authState.user = { name: 'Employee User', roles: ['employee'] };
    renderHeader();

    await userEvent.type(screen.getByRole('combobox'), 'Хагас жил');

    await waitFor(() => expect(screen.getByText('Хагас жил, жилийн тайлан')).toBeTruthy());
    await i18n.changeLanguage('en');
  });
});

describe('search as a command palette', () => {
  beforeEach(() => {
    authState.user = { name: 'Employee User', roles: ['employee'] };
  });

  it('is reached with Ctrl+K from anywhere on the page', async () => {
    renderHeader();

    await userEvent.keyboard('{Control>}k{/Control}');

    expect(document.activeElement).toBe(screen.getByRole('combobox'));
  });

  it('offers the everyday actions before anything is typed, and moves through them with the arrows', async () => {
    renderHeader();
    await userEvent.click(screen.getByRole('combobox'));

    const options = screen.getAllByRole('option');
    expect(options[0].textContent).toContain('Add a task');
    expect(options[0].getAttribute('aria-selected')).toBe('true');

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('true');
    expect(screen.getAllByRole('option')[1].textContent).toContain('Write up my day');
  });
});
