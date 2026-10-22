import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AccountPage from './AccountPage';

const mocks = vi.hoisted(() => ({
  updateOwnProfile: vi.fn(),
  changePassword: vi.fn(),
  refreshUser: vi.fn(),
}));

vi.mock('../services/auth.service', () => ({
  authService: { updateOwnProfile: mocks.updateOwnProfile, changePassword: mocks.changePassword },
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Bat Dorj', phone: '99112233', language: 'en' }, refreshUser: mocks.refreshUser }),
}));
vi.mock('react-hot-toast', () => ({ toast: { success: vi.fn() } }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <AccountPage />
    </MemoryRouter>,
  );

describe('AccountPage', () => {
  beforeEach(() => Object.values(mocks).forEach((mock) => mock.mockReset()));

  it('saves name, phone and language', async () => {
    mocks.updateOwnProfile.mockResolvedValue(undefined);
    mocks.refreshUser.mockResolvedValue(undefined);
    renderPage();

    const phone = screen.getByLabelText('Phone');
    await userEvent.clear(phone);
    await userEvent.type(phone, '88001122');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mocks.updateOwnProfile).toHaveBeenCalledWith({
        firstName: 'Bat',
        lastName: 'Dorj',
        phone: '88001122',
        language: 'en',
      }),
    );
  });

  it('changes the password with the current one, and shows a wrong current password', async () => {
    mocks.changePassword.mockRejectedValue({ response: { data: { errorCode: 'AUTH_CURRENT_PASSWORD_WRONG' } } });
    renderPage();

    await userEvent.type(screen.getByLabelText('Current password'), 'wrong');
    await userEvent.type(screen.getByLabelText('New password'), 'Secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(mocks.changePassword).toHaveBeenCalledWith({ currentPassword: 'wrong', newPassword: 'Secret123' });
    expect((await screen.findByRole('alert')).textContent).toContain('current password is incorrect');
  });
});
