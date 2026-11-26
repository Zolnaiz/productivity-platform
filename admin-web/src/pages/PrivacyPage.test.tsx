import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PrivacyPage from './PrivacyPage';

/*
 * The policy is what the Play listing points at, so a missing section or a raw
 * locale key showing through would be published as is. These read the page
 * the way a reviewer would: every heading present, in order, in words.
 */
const renderPolicy = () =>
  render(
    <MemoryRouter initialEntries={['/privacy']}>
      <PrivacyPage />
    </MemoryRouter>,
  );

describe('PrivacyPage', () => {
  it('shows every section of the policy, in reading order', () => {
    renderPolicy();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Privacy policy');
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'What is collected',
      'How it is used',
      'AI monthly summary',
      'On your phone',
      'Where it is kept',
      'How long it is kept',
      'Your choices',
      'Contact',
    ]);
  });

  it('never shows a locale key in place of text', () => {
    renderPolicy();

    expect(document.body.textContent).not.toMatch(/privacy\.\w+/);
  });

  it('leads back to the landing page', () => {
    renderPolicy();

    expect(screen.getByRole('link', { name: 'Back' }).getAttribute('href')).toBe('/');
  });
});
