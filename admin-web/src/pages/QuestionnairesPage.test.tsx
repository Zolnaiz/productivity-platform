import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuestionnairesPage from './QuestionnairesPage';
import { AssessmentTemplate } from '../types/assessment.types';

const serviceMocks = vi.hoisted(() => ({
  getTemplates: vi.fn(),
  updateTemplate: vi.fn(),
  createTemplate: vi.fn(),
}));

vi.mock('../services/assessment.service', () => ({
  assessmentService: {
    getTemplates: serviceMocks.getTemplates,
    updateTemplate: serviceMocks.updateTemplate,
    createTemplate: serviceMocks.createTemplate,
  },
}));

const template: AssessmentTemplate = {
  id: 'template-1',
  title: 'Line safety walk',
  description: 'Weekly safety walk for the assembly line.',
  type: 'safety',
  industry: 'Manufacturing',
  status: 'published',
  questions: [{ id: 'q-1', text: 'Walkways are clear.', type: 'score', maxScore: 5 }],
};

describe('QuestionnairesPage status changes', () => {
  beforeEach(() => {
    serviceMocks.getTemplates.mockReset().mockResolvedValue([template]);
    serviceMocks.updateTemplate.mockReset();
  });

  const openArchiveDialog = async () => {
    render(<QuestionnairesPage />);
    await screen.findByText('Line safety walk');
    await userEvent.click(screen.getByRole('button', { name: 'Archive' }));
  };

  it('asks before archiving, naming the template and what happens to it', async () => {
    await openArchiveDialog();

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Line safety walk')).toBeTruthy();
    expect(dialog.textContent).toContain('It will stop being offered for new assessments');
    expect(serviceMocks.updateTemplate).not.toHaveBeenCalled();
  });

  it('leaves the template alone when the dialog is cancelled', async () => {
    await openArchiveDialog();
    await screen.findByRole('dialog');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(serviceMocks.updateTemplate).not.toHaveBeenCalled();
  });

  it('archives only after the action is confirmed', async () => {
    serviceMocks.updateTemplate.mockResolvedValue({ ...template, status: 'archived' });

    await openArchiveDialog();
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Archive' }));

    await waitFor(() =>
      expect(serviceMocks.updateTemplate).toHaveBeenCalledWith('template-1', {
        status: 'archived',
      }),
    );
  });

  it('explains a failed status change instead of failing silently', async () => {
    serviceMocks.updateTemplate.mockRejectedValue({
      response: { status: 403, data: { errorCode: 'ACCESS_DENIED' } },
    });

    await openArchiveDialog();
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Archive' }));

    expect(await screen.findByText('You do not have access to this.')).toBeTruthy();
  });
});
