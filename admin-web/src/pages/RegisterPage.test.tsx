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

    await userEvent.type(screen.getByLabelText('Таны нэр'), 'Owner User');
    await userEvent.type(screen.getByLabelText('Байгууллагын нэр'), 'NewTech Operations');
    await userEvent.type(screen.getByLabelText('Email'), 'owner@example.com');
    await userEvent.type(screen.getByLabelText('Утас'), '+97699112233');
    await userEvent.type(screen.getByLabelText('Password'), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: 'Workspace үүсгэх' }));

    expect(serviceMocks.register).toHaveBeenCalledWith({
      name: 'Owner User',
      organizationName: 'NewTech Operations',
      email: 'owner@example.com',
      phone: '+97699112233',
      password: 'Password123',
    });
    await waitFor(() => expect(screen.getByText('Login page')).toBeTruthy());
  });

  it('shows an error when registration fails', async () => {
    serviceMocks.register.mockRejectedValue(new Error('backend unavailable'));

    renderRegister();

    await userEvent.type(screen.getByLabelText('Таны нэр'), 'Owner User');
    await userEvent.type(screen.getByLabelText('Байгууллагын нэр'), 'NewTech Operations');
    await userEvent.type(screen.getByLabelText('Email'), 'owner@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: 'Workspace үүсгэх' }));

    expect(await screen.findByText('Бүртгэл үүсгэж чадсангүй. Мэдээллээ шалгаад дахин оролдоно уу.')).toBeTruthy();
  });
});
