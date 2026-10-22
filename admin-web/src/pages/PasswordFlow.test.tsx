import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
import AcceptInvitationPage from './AcceptInvitationPage';

const mocks = vi.hoisted(() => ({
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  previewInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
}));

vi.mock('../services/auth.service', () => ({ authService: mocks }));

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      </Routes>
    </MemoryRouter>,
  );

const rejection = (errorCode: string) => ({ response: { data: { errorCode } } });

describe('password and invitation pages', () => {
  beforeEach(() => Object.values(mocks).forEach((mock) => mock.mockReset()));

  it('asks for a reset link and shows one neutral confirmation', async () => {
    mocks.forgotPassword.mockResolvedValue(undefined);
    at('/forgot-password');

    await userEvent.type(screen.getByLabelText('Email'), 'bat@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send link' }));

    expect(mocks.forgotPassword).toHaveBeenCalledWith('bat@example.com');
    expect((await screen.findByRole('status')).textContent).toContain('If this email is registered');
  });

  it('sets a new password from the token in the link', async () => {
    mocks.resetPassword.mockResolvedValue(undefined);
    at('/reset-password/abc123');

    await userEvent.type(screen.getByLabelText('New password'), 'Secret123');
    await userEvent.type(screen.getByLabelText('Repeat password'), 'Secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Save password' }));

    await waitFor(() => expect(mocks.resetPassword).toHaveBeenCalledWith({ token: 'abc123', password: 'Secret123' }));
    expect((await screen.findByRole('status')).textContent).toContain('Your password has been changed');
  });

  it('does not call the server when the two passwords differ', async () => {
    at('/reset-password/abc123');

    await userEvent.type(screen.getByLabelText('New password'), 'Secret123');
    await userEvent.type(screen.getByLabelText('Repeat password'), 'Other1234');
    await userEvent.click(screen.getByRole('button', { name: 'Save password' }));

    expect((await screen.findByRole('alert')).textContent).toContain('do not match');
    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });

  it('explains an expired or used link', async () => {
    mocks.resetPassword.mockRejectedValue(rejection('PASSWORD_RESET_INVALID'));
    at('/reset-password/old');

    await userEvent.type(screen.getByLabelText('New password'), 'Secret123');
    await userEvent.type(screen.getByLabelText('Repeat password'), 'Secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Save password' }));

    expect((await screen.findByRole('alert')).textContent).toContain('not valid or has expired');
  });

  it('accepts an invitation: previews the address, then creates the account', async () => {
    mocks.previewInvitation.mockResolvedValue({ email: 'new@example.com', role: 'user' });
    mocks.acceptInvitation.mockResolvedValue(undefined);
    at('/accept-invitation?token=tok');

    expect(await screen.findByText(/new@example.com/)).toBeTruthy();
    await userEvent.type(screen.getByLabelText('Last name'), 'Dorj');
    await userEvent.type(screen.getByLabelText('First name'), 'Bat');
    await userEvent.type(screen.getByLabelText('Password'), 'Secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() =>
      expect(mocks.acceptInvitation).toHaveBeenCalledWith('tok', {
        firstName: 'Bat',
        lastName: 'Dorj',
        password: 'Secret123',
      }),
    );
    expect((await screen.findByRole('status')).textContent).toContain('Your account is ready');
  });

  it('shows the reason when the invitation is already used, and offers no form', async () => {
    mocks.previewInvitation.mockRejectedValue(rejection('INVITATION_USED'));
    at('/accept-invitation?token=tok');

    expect((await screen.findByRole('alert')).textContent).toContain('already been used');
    expect(screen.queryByRole('button', { name: 'Create account' })).toBeNull();
  });
});
