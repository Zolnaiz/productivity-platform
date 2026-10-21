import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import FiveSTemplateLibrary, { LIBRARY, libraryTemplate } from './FiveSTemplateLibrary';

const mocks = vi.hoisted(() => ({ createAuditTemplate: vi.fn() }));
vi.mock('../../services/operations.service', () => ({ operationsService: mocks }));

describe('ready 5S checklists', () => {
  beforeEach(() => mocks.createAuditTemplate.mockReset());

  it.each(LIBRARY)('%s has ten scored questions in both languages', (id) => {
    for (const language of ['mn', 'en']) {
      const t = i18n.getFixedT(language);
      const template = libraryTemplate(id, t as never);
      expect(template.category).toBe('5s');
      expect(template.questions).toHaveLength(10);
      expect(template.questions?.every((question) => question.type === 'score' && question.maxScore === 5)).toBe(true);
      expect(template.title).not.toContain('fiveSLibrary');
    }
  });

  it('adds one in a click, and offers no second copy of one already added', async () => {
    mocks.createAuditTemplate.mockImplementation(async (template) => ({ id: 'new', ...template }));
    const onAdded = vi.fn();
    const existing = [{ id: 't1', title: '5S warehouse audit' }] as never;
    render(<FiveSTemplateLibrary existing={existing} onAdded={onAdded} />);

    expect((screen.getByRole('button', { name: 'Added' }) as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);

    await waitFor(() => expect(onAdded).toHaveBeenCalled());
    expect(mocks.createAuditTemplate.mock.calls[0][0]).toMatchObject({ title: '5S office audit', category: '5s' });
  });
});
