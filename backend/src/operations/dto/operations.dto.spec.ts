import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAuditRunDto, CreateAuditTemplateDto, CreateExpenseDto, CreateProjectDto, CreateTaskDto } from './operations.dto';

describe('Operations DTO validation', () => {
  it('requires project name', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      status: 'active',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('rejects project progress outside 0-100', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      name: 'Invalid progress project',
      progress: 120,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'progress')).toBe(true);
  });

  it('accepts a valid project create payload', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      name: 'Operations rollout',
      status: 'active',
      progress: 60,
      dueDate: '2026-07-15',
      budget: 1200000,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('requires referenced project ids to be UUIDs', async () => {
    const dto = plainToInstance(CreateTaskDto, {
      title: 'Linked task',
      projectId: 'local-project-id',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'projectId')).toBe(true);
  });

  it('requires non-negative expense amount', async () => {
    const dto = plainToInstance(CreateExpenseDto, {
      title: 'Audit materials',
      amount: -1,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'amount')).toBe(true);
  });

  it('validates nested audit template questions', async () => {
    const dto = plainToInstance(CreateAuditTemplateDto, {
      title: 'Invalid checklist',
      questions: [{ id: 'q1', text: 'Question', type: 'unsupported' }],
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'questions')).toBe(true);
  });

  it('validates nested audit run answers', async () => {
    const dto = plainToInstance(CreateAuditRunDto, {
      templateId: '11111111-1111-4111-8111-111111111111',
      answers: [{ questionId: 'q1' }],
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'answers')).toBe(true);
  });
});
