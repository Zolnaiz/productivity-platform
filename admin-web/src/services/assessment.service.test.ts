import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api');
  return {
    ...actual,
    isDemoMode: () => true,
  };
});

describe('assessmentService demo storage', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('recovers default templates when stored data is invalid JSON', async () => {
    localStorage.setItem('productivity-demo-assessment-templates', '{broken-json');
    const { assessmentService } = await import('./assessment.service');

    const templates = await assessmentService.getTemplates();

    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toHaveProperty('questions');
    expect(localStorage.getItem('productivity-demo-assessment-templates')).not.toBe('{broken-json');
  });

  it('recovers default responses when stored data is invalid JSON', async () => {
    localStorage.setItem('productivity-demo-assessment-responses', '{broken-json');
    const { assessmentService } = await import('./assessment.service');

    const responses = await assessmentService.getResponses();

    expect(responses.length).toBeGreaterThan(0);
    expect(responses[0]).toHaveProperty('answers');
    expect(localStorage.getItem('productivity-demo-assessment-responses')).not.toBe('{broken-json');
  });
});
