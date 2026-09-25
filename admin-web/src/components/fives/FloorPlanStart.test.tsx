import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FloorPlanStart from './FloorPlanStart';
import { detectRooms } from './floorPlanWalls';

const handlers = vi.hoisted(() => ({
  onBlank: vi.fn(),
  onTemplate: vi.fn(),
  onBlueprint: vi.fn(),
}));

const renderStart = () => render(<FloorPlanStart {...handlers} />);

describe('FloorPlanStart', () => {
  beforeEach(() => {
    handlers.onBlank.mockReset();
    handlers.onTemplate.mockReset();
    handlers.onBlueprint.mockReset();
  });

  it('asks how to begin instead of answering for the person', () => {
    // What replaced a sample office appearing unasked.
    renderStart();

    expect(screen.getByText('Start your floor plan')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Import a drawing/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Draw from scratch/ })).toBeTruthy();
  });

  it('offers the templates by name and real size', () => {
    renderStart();

    expect(screen.getByText('Office floor')).toBeTruthy();
    expect(screen.getByText(/16 × 10 m/)).toBeTruthy();
    expect(screen.getByText('Production hall')).toBeTruthy();
  });

  it('hands back the template that was chosen', async () => {
    renderStart();

    await userEvent.click(screen.getByText('Production hall'));

    expect(handlers.onTemplate).toHaveBeenCalledWith(expect.objectContaining({ id: 'hall' }));
  });

  it('gives a template that is walls and nothing else', async () => {
    renderStart();

    await userEvent.click(screen.getByText('Office floor'));

    const template = handlers.onTemplate.mock.calls[0][0];
    expect(template.walls.length).toBeGreaterThan(0);
    expect(template).not.toHaveProperty('zones');
    expect(detectRooms(template.walls, template.corners).length).toBeGreaterThan(0);
  });

  it('says a blank plan is wanted', async () => {
    renderStart();

    await userEvent.click(screen.getByRole('button', { name: /Draw from scratch/ }));

    expect(handlers.onBlank).toHaveBeenCalled();
  });

  it('draws each template preview from its own walls', () => {
    // A thumbnail drawn by hand could show something the template is not.
    renderStart();

    const preview = screen.getByRole('img', { name: 'Office floor' });

    expect(preview.querySelectorAll('line').length).toBeGreaterThan(3);
  });

  it('says plainly that a template contains nothing', () => {
    renderStart();

    expect(screen.getByText(/walls and nothing else/)).toBeTruthy();
  });
});
