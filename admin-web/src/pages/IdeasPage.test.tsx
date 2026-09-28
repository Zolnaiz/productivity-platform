import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IdeasPage from './IdeasPage';

const mocks = vi.hoisted(() => ({
  getIdeas: vi.fn(),
  createIdea: vi.fn(),
  reviewIdea: vi.fn(),
  getMembers: vi.fn(),
  permissions: ['ideas:read', 'ideas:create'] as string[],
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (permission: string) => mocks.permissions.includes(permission), user: { id: 'u1' } }),
}));
vi.mock('../services/idea.service', () => ({
  ideaService: { getIdeas: mocks.getIdeas, createIdea: mocks.createIdea, reviewIdea: mocks.reviewIdea },
}));
vi.mock('../services/people.service', () => ({ peopleService: { getMembers: mocks.getMembers } }));
// Photographs load on request, and are not what this page's tests are about.
vi.mock('../components/common/PhotoEvidence', () => ({ default: () => <div data-testid="photos" /> }));

const thisYear = `${new Date().getFullYear()}-03-01T08:00:00.000Z`;

const ideas = [
  { id: 'i1', authorId: 'u2', title: 'Shadow board for wrenches', description: 'We lose time.', area: 'Assembly', benefit: '10 minutes a shift', status: 'submitted', reviewNote: '', createdAt: thisYear },
  { id: 'i2', authorId: 'u2', title: 'Floor tape at the dock', description: '', area: '', benefit: '', status: 'done', reviewNote: 'Thank you.', createdAt: thisYear },
  { id: 'i3', authorId: 'u3', title: 'Bigger bins', description: '', area: '', benefit: '', status: 'declined', reviewNote: 'Moving next month.', createdAt: thisYear },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <IdeasPage />
    </MemoryRouter>,
  );

describe('the idea box', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.permissions = ['ideas:read', 'ideas:create'];
    mocks.getIdeas.mockResolvedValue(ideas);
    mocks.getMembers.mockResolvedValue([
      { id: 'u2', firstName: 'Saran', lastName: 'Tuya', isActive: true },
      { id: 'u3', firstName: 'Bat', lastName: 'Erdene', isActive: true },
    ]);
  });

  it('takes an idea from anybody, and thanks them', async () => {
    mocks.createIdea.mockResolvedValue({ id: 'i4', authorId: 'u1', title: 'Label the racking', description: '', area: 'Stores', benefit: '', status: 'submitted', reviewNote: '' });
    renderPage();
    await screen.findAllByTestId('idea');

    fireEvent.change(screen.getByLabelText('The idea'), { target: { value: 'Label the racking' } });
    fireEvent.change(screen.getByLabelText('Where'), { target: { value: 'Stores' } });
    fireEvent.submit(screen.getByTestId('idea-form'));

    await waitFor(() => expect(mocks.createIdea).toHaveBeenCalledWith(expect.objectContaining({ title: 'Label the racking', area: 'Stores' })));
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.getAllByTestId('idea')[0].textContent).toContain('Label the racking');
  });

  it('shows everybody what was suggested and what became of it', async () => {
    renderPage();
    const [board, tape, bins] = await screen.findAllByTestId('idea');

    await waitFor(() => expect(board.textContent).toContain('Saran Tuya'));
    expect(board.textContent).toContain('New');
    expect(tape.textContent).toContain('In place');
    expect(bins.textContent).toContain('Moving next month.');
  });

  it('narrows to one stage', async () => {
    renderPage();
    await screen.findAllByTestId('idea');

    fireEvent.click(screen.getByRole('radio', { name: /In place/ }));

    expect(screen.getAllByTestId('idea')).toHaveLength(1);
  });

  it('names who made things better this year', async () => {
    renderPage();

    const improvers = await screen.findByTestId('improvers');
    await waitFor(() => expect(improvers.textContent).toContain('Saran Tuya'));
    expect(improvers.textContent).not.toContain('Bat Erdene');
  });

  it('offers no decision to somebody who may not make one', async () => {
    renderPage();
    await screen.findAllByTestId('idea');

    expect(screen.queryByRole('button', { name: 'Take it up' })).toBeNull();
  });

  it('lets a manager take an idea up, with the work for the person who had it', async () => {
    mocks.permissions = ['ideas:read', 'ideas:create', 'ideas:review'];
    mocks.reviewIdea.mockResolvedValue({ ...ideas[0], status: 'approved', taskId: 't9', reviewNote: 'Go ahead.' });
    renderPage();
    const [board] = await screen.findAllByTestId('idea');

    fireEvent.click(within(board).getByRole('button', { name: 'Take it up' }));
    fireEvent.change(screen.getByLabelText('A word to whoever had it'), { target: { value: 'Go ahead.' } });
    fireEvent.submit(screen.getByTestId('idea-decision'));

    await waitFor(() =>
      expect(mocks.reviewIdea).toHaveBeenCalledWith('i1', expect.objectContaining({ status: 'approved', assigneeId: 'u2', note: 'Go ahead.' })),
    );
    expect(await within(board).findByText('Taken up')).toBeTruthy();
    expect(within(board).getByRole('link', { name: 'See the task' })).toBeTruthy();
  });
});
