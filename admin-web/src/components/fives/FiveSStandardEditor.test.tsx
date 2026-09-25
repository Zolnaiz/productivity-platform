import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FiveSStandardEditor from './FiveSStandardEditor';
import { FiveSGuidelineContent } from '../../types/fiveS.types';

const content = (over: Partial<FiveSGuidelineContent> = {}): FiveSGuidelineContent => ({
  operatingCadence: [{ title: 'Daily 5S', timing: 'Every day', detail: 'Tidy your own area.' }],
  labelStandards: ['Everything has a place.'],
  assessmentCriteria: [{ id: 'policy-1', category: '5S policy', criterion: 'It is written down.' }],
  publicChecklistGroups: [{ code: 'seiri', title: '1. Sort', items: ['No waste in the area.'] }],
  maxScore: 5,
  ...over,
});

const renderEditor = (over: Partial<FiveSGuidelineContent> = {}) => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<FiveSStandardEditor content={content(over)} onSave={onSave} />);

  return onSave;
};

const saved = (onSave: ReturnType<typeof vi.fn>) => onSave.mock.calls[0][0] as FiveSGuidelineContent;

/**
 * The standard was a hundred strings in a component, then seed data, and until
 * now changing it meant a database write by hand. That is the difference
 * between data being an organization's and data being theirs to keep.
 */
describe('editing the standard an organization works to', () => {
  it('saves a changed cadence row', async () => {
    const onSave = renderEditor();

    fireEvent.change(screen.getByLabelText('Timing of cadence row 1'), {
      target: { value: 'Twice a day' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save the standard' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(saved(onSave).operatingCadence[0]).toMatchObject({ timing: 'Twice a day' });
  });

  it('adds and removes a cadence row', async () => {
    const onSave = renderEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Add a row' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove Daily 5S' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save the standard' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(saved(onSave).operatingCadence).toHaveLength(1);
    expect(saved(onSave).operatingCadence[0].title).toBe('');
  });

  it('takes the labelling rules a line at a time, ignoring the blank ones', async () => {
    // One rule per line is how somebody writes a list of rules anyway, and a
    // stray empty line is not a rule.
    const onSave = renderEditor();

    fireEvent.change(screen.getByLabelText('Labelling rules, one per line'), {
      target: { value: 'First rule\n\nSecond rule\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save the standard' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(saved(onSave).labelStandards).toEqual(['First rule', 'Second rule']);
  });

  it('reads the criteria back out of the spreadsheet somebody pasted', async () => {
    // Thirty-five criteria are a spreadsheet in every organization that has
    // them, and a form of thirty-five three-field rows is one nobody finishes.
    const onSave = renderEditor();

    fireEvent.change(screen.getByLabelText(/Assessment criteria/), {
      target: { value: 'a-1 | Policy | It is written down.\nb-2 | Board | It is current.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save the standard' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(saved(onSave).assessmentCriteria).toEqual([
      { id: 'a-1', category: 'Policy', criterion: 'It is written down.' },
      { id: 'b-2', category: 'Board', criterion: 'It is current.' },
    ]);
  });

  it('ignores a criterion line that says nothing', async () => {
    const onSave = renderEditor();

    fireEvent.change(screen.getByLabelText(/Assessment criteria/), {
      target: { value: 'a-1 | Policy | It is written down.\nnonsense\nb-2 | Board |' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save the standard' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(saved(onSave).assessmentCriteria).toHaveLength(1);
  });

  it('reads the checklists as headings and the items under them', async () => {
    const onSave = renderEditor();

    fireEvent.change(screen.getByLabelText(/Public checklists/), {
      target: { value: 'seiri | 1. Sort\n- No waste\n- Nothing unused\n\nseiton | 2. Set in order\n- A place for everything' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save the standard' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(saved(onSave).publicChecklistGroups).toEqual([
      { code: 'seiri', title: '1. Sort', items: ['No waste', 'Nothing unused'] },
      { code: 'seiton', title: '2. Set in order', items: ['A place for everything'] },
    ]);
  });

  it('drops an item written before any heading, rather than inventing a group for it', async () => {
    const onSave = renderEditor();

    fireEvent.change(screen.getByLabelText(/Public checklists/), {
      target: { value: '- orphan\nseiri | 1. Sort\n- No waste' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save the standard' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(saved(onSave).publicChecklistGroups).toEqual([
      { code: 'seiri', title: '1. Sort', items: ['No waste'] },
    ]);
  });

  it('says so when the standard could not be saved', async () => {
    // Somebody who believes they have changed what everybody is judged
    // against, and has not, is worse off than somebody who knows.
    const onSave = vi.fn().mockRejectedValue(new Error('offline'));
    render(<FiveSStandardEditor content={content()} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save the standard' }));

    expect(await screen.findByText(/was not saved/)).toBeTruthy();
  });

  it('follows the standard that arrives after the first render', async () => {
    // It is fetched, so the editor is mounted with an empty one. An editor
    // that kept that emptiness would show an organization nothing where their
    // cadence should be — and saving would write the emptiness over the real
    // standard.
    const onSave = vi.fn().mockResolvedValue(undefined);
    const empty: FiveSGuidelineContent = {
      operatingCadence: [],
      labelStandards: [],
      assessmentCriteria: [],
      publicChecklistGroups: [],
      maxScore: 0,
    };

    const { rerender } = render(<FiveSStandardEditor content={empty} onSave={onSave} />);
    expect(screen.queryByLabelText('Timing of cadence row 1')).toBeNull();

    rerender(<FiveSStandardEditor content={content()} onSave={onSave} />);

    expect(screen.getByLabelText('Timing of cadence row 1')).toHaveProperty('value', 'Every day');

    fireEvent.click(screen.getByRole('button', { name: 'Save the standard' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(saved(onSave).labelStandards).toEqual(['Everything has a place.']);
  });
});
