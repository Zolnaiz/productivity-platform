import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateAuditRunDto,
  CreateAuditTemplateDto,
  CreateDailyGoalDto,
  CreateExpenseDto,
  CreateProjectDto,
  CreateTaskDto,
  UpsertFiveSLayoutDto,
} from './operations.dto';

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

  it('requires daily goal title and validates optional date', async () => {
    const dto = plainToInstance(CreateDailyGoalDto, {
      date: 'not-a-date',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'title')).toBe(true);
    expect(errors.some((error) => error.property === 'date')).toBe(true);
  });

  it('validates nested 5S layout zones and floorplan objects', async () => {
    const dto = plainToInstance(UpsertFiveSLayoutDto, {
      name: 'Office map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      backgroundImage: 'data:image/png;base64,abc',
      backgroundOpacity: 0.5,
      showGrid: false,
      zones: [
        {
          id: 'zone-1',
          code: 'A01',
          name: 'Reception',
          color: '#38bdf8',
          x: 10,
          y: 20,
          width: 100,
          height: 80,
          contents: 'Desk',
          standard: 'Clear desk',
          labelText: 'Owner label',
          stage: 'unsupported',
          auditFrequency: 'weekly',
        },
      ],
      objects: [{ id: 'object-1', type: 'unsupported', label: 'Object', x: 1, y: 1, width: 1, height: 1 }],
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'zones')).toBe(true);
    expect(errors.some((error) => error.property === 'objects')).toBe(true);
  });

  it('accepts the wall graph a plan is actually drawn from', async () => {
    // These fields were dropped on the way to the server for as long as walls
    // existed, so a plan drawn against a real backend emptied itself on reload.
    const dto = plainToInstance(UpsertFiveSLayoutDto, {
      name: 'Office map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      zones: [],
      objects: [],
      corners: [
        { id: 'c0', x: 0, y: 0 },
        { id: 'c1', x: 384, y: 0 },
      ],
      walls: [{ id: 'w0', from: 'c0', to: 'c1', thickness: 12 }],
      openings: [{ id: 'o0', wallId: 'w0', kind: 'door', offset: 120, width: 21.6, hinge: 'from', flip: true }],
      metresPerUnit: 1 / 24,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('still accepts a plan from a client that has no wall graph', async () => {
    const dto = plainToInstance(UpsertFiveSLayoutDto, {
      name: 'Office map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      zones: [],
      objects: [],
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('refuses a scale of zero, which would make every length zero in silence', async () => {
    const dto = plainToInstance(UpsertFiveSLayoutDto, {
      name: 'Office map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      zones: [],
      objects: [],
      metresPerUnit: 0,
    });

    expect((await validate(dto)).some((error) => error.property === 'metresPerUnit')).toBe(true);
  });

  it('refuses an opening that is not a door or a window', async () => {
    const dto = plainToInstance(UpsertFiveSLayoutDto, {
      name: 'Office map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      zones: [],
      objects: [],
      openings: [{ id: 'o0', wallId: 'w0', kind: 'portal', offset: 10, width: 20 }],
    });

    expect((await validate(dto)).some((error) => error.property === 'openings')).toBe(true);
  });

  it('accepts every object the editor can place', async () => {
    // The list stopped at six types, so a chair or a printer was placeable in
    // the editor and refused by the pipe on save.
    const dto = plainToInstance(UpsertFiveSLayoutDto, {
      name: 'Office map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      zones: [],
      objects: [
        'chair',
        'cabinet',
        'printer',
        'whiteboard',
        'sofa',
        'plant',
        'waste_bin',
        'sink',
        'pallet',
        'racking',
        'workbench',
      ].map(
        (type, index) => ({ id: `object-${index}`, type, label: type, x: 1, y: 1, width: 1, height: 1 }),
      ),
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('accepts 5S layout red-tag and cleaning metadata', async () => {
    const dto = plainToInstance(UpsertFiveSLayoutDto, {
      name: 'Office map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      backgroundImage: 'data:image/png;base64,abc',
      backgroundOpacity: 0.5,
      showGrid: true,
      zones: [
        {
          id: 'zone-1',
          code: 'A01',
          name: 'Reception',
          color: '#38bdf8',
          x: 10,
          y: 20,
          width: 100,
          height: 80,
          contents: 'Desk',
          standard: 'Clear desk',
          labelText: 'Owner label',
          stage: 'shine',
          auditFrequency: 'weekly',
          lastAuditScore: 88,
          lastAuditAt: '2026-06-24',
          redTagCount: 2,
          redTags: [
            {
              id: 'redtag-1',
              title: 'Unlabeled box',
              disposition: 'Move to owner shelf',
              status: 'open',
              ownerId: 'user-1',
              ownerName: 'Owner',
              dueDate: '2026-06-27',
              createdAt: '2026-06-24',
            },
            {
              id: 'redtag-2',
              title: 'Old material',
              disposition: 'Dispose',
              status: 'disposed',
              ownerId: 'user-1',
              ownerName: 'Owner',
              dueDate: '2026-06-25',
              createdAt: '2026-06-24',
              closedAt: '2026-06-25',
            },
          ],
          lastCleanedAt: '2026-06-24',
        },
      ],
      objects: [{ id: 'object-1', type: 'desk', label: 'Desk', x: 1, y: 1, width: 80, height: 40 }],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
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
