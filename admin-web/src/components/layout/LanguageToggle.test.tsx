import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LanguageToggle from './LanguageToggle';

const mocks = vi.hoisted(() => ({
  language: 'mn-MN',
  changeLanguage: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: mocks.language } }),
}));

vi.mock('../../i18n', () => ({ changeLanguage: mocks.changeLanguage }));

describe('LanguageToggle', () => {
  beforeEach(() => {
    mocks.language = 'mn-MN';
    mocks.changeLanguage.mockReset();
  });

  it('writes each language in itself', () => {
    // `Монгол`, not `Mongolian`: somebody who cannot read the active language
    // has to be able to find their own.
    render(<LanguageToggle />);

    expect(screen.getByLabelText('Монгол')).toBeTruthy();
    expect(screen.getByLabelText('English')).toBeTruthy();
  });

  it('shows which language is active', () => {
    render(<LanguageToggle />);

    expect(screen.getByLabelText('Монгол').getAttribute('aria-checked')).toBe('true');
    expect(screen.getByLabelText('English').getAttribute('aria-checked')).toBe('false');
  });

  it('follows a plain language tag as well as a regional one', () => {
    // i18next reports `mn` after a fallback, not always `mn-MN`.
    mocks.language = 'mn';
    render(<LanguageToggle />);

    expect(screen.getByLabelText('Монгол').getAttribute('aria-checked')).toBe('true');
  });

  it('switches on click', async () => {
    render(<LanguageToggle />);

    await userEvent.click(screen.getByLabelText('English'));

    expect(mocks.changeLanguage).toHaveBeenCalledWith('en-US');
  });

  it('treats anything unrecognised as English, the fallback', () => {
    mocks.language = 'de';
    render(<LanguageToggle />);

    expect(screen.getByLabelText('English').getAttribute('aria-checked')).toBe('true');
  });
});
