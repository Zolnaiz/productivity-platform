import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterPage from './RegisterPage';

const serviceMocks = vi.hoisted(() => ({
  register: vi.fn(),
}));

vi.mock('../services/auth.service', () => ({
  authService: {
    register: serviceMocks.register,
  },
}));

const renderRegister = () =>
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('RegisterPage', () => {
  beforeEach(() => {
    serviceMocks.register.mockReset();
  });

  it('submits organization registration data and redirects to login', async () => {
    serviceMocks.register.mockResolvedValue({
      token: 'token',
      refreshToken: 'refresh-token',
      user: { id: 'u1' },
    });

    renderRegister();

    await userEvent.type(screen.getByLabelText('Your name'), 'Owner User');
    await userEvent.type(screen.getByLabelText('Organization name'), 'NewTech Operations');
    await userEvent.type(screen.getByLabelText('Email'), 'owner@example.com');
    await userEvent.type(screen.getByLabelText('Phone'), '+97699112233');
    await userEvent.type(screen.getByLabelText('Password'), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: 'Create workspace' }));

    expect(serviceMocks.register).toHaveBeenCalledWith({
      name: 'Owner User',
      organizationName: 'NewTech Operations',
      email: 'owner@example.com',
      phone: '+97699112233',
      password: 'Password123',
    });
    await waitFor(() => expect(screen.getByText('Login page')).toBeTruthy());
  });

  const submitRegistration = async () => {
    await userEvent.type(screen.getByLabelText('Your name'), 'Owner User');
    await userEvent.type(screen.getByLabelText('Organization name'), 'NewTech Operations');
    await userEvent.type(screen.getByLabelText('Email'), 'owner@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: 'Create workspace' }));
  };

  it('tells the user their email is already taken, not just that it failed', async () => {
    serviceMocks.register.mockRejectedValue({
      response: { status: 409, data: { errorCode: 'AUTH_EMAIL_TAKEN' } },
    });

    renderRegister();
    await submitRegistration();

    expect(
      await screen.findByText('This email is already registered. Sign in instead.'),
    ).toBeTruthy();
  });

  it('reports an unreachable backend as a connection problem', async () => {
    serviceMocks.register.mockRejectedValue(new Error('Network Error'));

    renderRegister();
    await submitRegistration();

    expect(
      await screen.findByText('Could not reach the server. Check your connection and try again.'),
    ).toBeTruthy();
  });
});
