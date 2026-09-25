import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeToggle from './ThemeToggle';

const themeState = vi.hoisted(() => ({
  theme: 'system' as 'light' | 'dark' | 'system',
  setTheme: vi.fn(),
}));

vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => themeState }));

describe('ThemeToggle', () => {
  beforeEach(() => {
    themeState.theme = 'system';
    themeState.setTheme.mockReset();
  });

  it('offers all three settings the theme context supports', () => {
    render(<ThemeToggle />);

    // Not two: "system" is a real setting, and a cycling toggle cannot show it.
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByLabelText('Light')).toBeTruthy();
    expect(screen.getByLabelText('Dark')).toBeTruthy();
    expect(screen.getByLabelText('Follow system')).toBeTruthy();
  });

  it('shows which one is in force', () => {
    themeState.theme = 'dark';
    render(<ThemeToggle />);

    expect(screen.getByLabelText('Dark').getAttribute('aria-checked')).toBe('true');
    expect(screen.getByLabelText('Light').getAttribute('aria-checked')).toBe('false');
  });

  it('asks the context to change it', async () => {
    render(<ThemeToggle />);

    await userEvent.click(screen.getByLabelText('Dark'));

    expect(themeState.setTheme).toHaveBeenCalledWith('dark');
  });

  it('can go back to following the system', async () => {
    themeState.theme = 'light';
    render(<ThemeToggle />);

    await userEvent.click(screen.getByLabelText('Follow system'));

    expect(themeState.setTheme).toHaveBeenCalledWith('system');
  });

  it('is a radio group, so assistive technology reads it as one choice', () => {
    render(<ThemeToggle />);

    expect(screen.getByRole('radiogroup', { name: 'Appearance' })).toBeTruthy();
  });
});
