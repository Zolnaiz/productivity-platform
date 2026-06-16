import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';

const ThemeProbe = () => {
  const { theme } = useTheme();
  return <div>{theme}</div>;
};

const renderTheme = () =>
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );

describe('ThemeContext storage recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('falls back to system when stored theme is invalid', () => {
    localStorage.setItem('theme', 'blue');

    renderTheme();

    expect(screen.getByText('system')).toBeTruthy();
  });
});
