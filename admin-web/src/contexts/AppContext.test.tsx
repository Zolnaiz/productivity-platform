import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProvider, useApp } from './AppContext';
import { NotificationProvider } from './NotificationContext';

const AppProbe = () => {
  const { config } = useApp();
  return (
    <div>
      <span>{config.language}</span>
      <span>{config.notifications.email ? 'email-on' : 'email-off'}</span>
    </div>
  );
};

const renderAppContext = () =>
  render(
    <NotificationProvider>
      <AppProvider>
        <AppProbe />
      </AppProvider>
    </NotificationProvider>,
  );

describe('AppContext storage recovery', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('falls back to default config when stored app config is invalid JSON', () => {
    localStorage.setItem('appConfig', '{broken-json');

    renderAppContext();

    expect(screen.getByText('mn')).toBeTruthy();
    expect(screen.getByText('email-on')).toBeTruthy();
    expect(localStorage.getItem('appConfig')).not.toBe('{broken-json');
  });

  it('merges partial stored config with nested defaults', () => {
    localStorage.setItem('appConfig', JSON.stringify({ language: 'en', notifications: { sound: true } }));

    renderAppContext();

    expect(screen.getByText('en')).toBeTruthy();
    expect(screen.getByText('email-on')).toBeTruthy();
  });
});
