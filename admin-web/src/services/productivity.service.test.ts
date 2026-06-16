import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('productivityService demo storage', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('recovers default notes when stored demo data is invalid JSON', async () => {
    localStorage.setItem('productivity-demo-notes', '{broken-json');
    const { productivityService } = await import('./productivity.service');

    const notes = await productivityService.getNotes();

    expect(notes.length).toBeGreaterThan(0);
    expect(notes[0]).toHaveProperty('title');
    expect(localStorage.getItem('productivity-demo-notes')).not.toBe('{broken-json');
  });

  it('recovers default goals when stored demo data is invalid JSON', async () => {
    localStorage.setItem('productivity-demo-goals', '{broken-json');
    const { productivityService } = await import('./productivity.service');

    const goals = await productivityService.getGoals();

    expect(goals.length).toBeGreaterThan(0);
    expect(goals[0]).toHaveProperty('completed');
    expect(localStorage.getItem('productivity-demo-goals')).not.toBe('{broken-json');
  });
});
