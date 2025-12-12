import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: true,
          dropSchema: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('AppController', () => {
    it('/ (GET) should return API status', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('version');
        });
    });

    it('/health (GET) should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'healthy');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('services');
        });
    });
  });

  describe('AuthController (e2e)', () => {
    let authToken: string;

    describe('POST /auth/register', () => {
      it('should register a new user', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'test@example.com',
            password: 'Test@123',
            firstName: 'Test',
            lastName: 'User',
            phone: '99000000',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data).toHaveProperty('email', 'test@example.com');
          });
      });

      it('should not register with existing email', async () => {
        // First registration
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'duplicate@example.com',
            password: 'Test@123',
            firstName: 'Duplicate',
            lastName: 'User',
          });

        // Second registration with same email
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'duplicate@example.com',
            password: 'Test@123',
            firstName: 'Duplicate',
            lastName: 'User',
          })
          .expect(400);
      });
    });

    describe('POST /auth/login', () => {
      beforeAll(async () => {
        // Register a user first
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'login@example.com',
            password: 'Login@123',
            firstName: 'Login',
            lastName: 'User',
          });
      });

      it('should login successfully', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'login@example.com',
            password: 'Login@123',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');
            authToken = res.body.data.accessToken;
          });
      });

      it('should not login with wrong password', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'login@example.com',
            password: 'Wrong@123',
          })
          .expect(401);
      });

      it('should not login with non-existent email', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'Test@123',
          })
          .expect(401);
      });
    });

    describe('GET /auth/profile', () => {
      it('should get profile with valid token', () => {
        return request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('email', 'login@example.com');
          });
      });

      it('should not get profile without token', () => {
        return request(app.getHttpServer())
          .get('/auth/profile')
          .expect(401);
      });

      it('should not get profile with invalid token', () => {
        return request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });

    describe('POST /auth/logout', () => {
      it('should logout successfully', () => {
        return request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
          });
      });
    });
  });

  describe('UsersController (e2e)', () => {
    let adminToken: string;
    let regularToken: string;

    beforeAll(async () => {
      // Login as admin
      const adminRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Login@123',
        });
      adminToken = adminRes.body.data.accessToken;

      // Create regular user and login
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'regular@example.com',
          password: 'Regular@123',
          firstName: 'Regular',
          lastName: 'User',
        });

      const regularRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'regular@example.com',
          password: 'Regular@123',
        });
      regularToken = regularRes.body.data.accessToken;
    });

    describe('GET /users', () => {
      it('should get users list for admin', () => {
        return request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('users');
            expect(Array.isArray(res.body.data.users)).toBe(true);
          });
      });

      it('should not get users list for regular user', () => {
        return request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${regularToken}`)
          .expect(403);
      });
    });

    describe('GET /users/profile', () => {
      it('should get user profile', () => {
        return request(app.getHttpServer())
          .get('/users/profile')
          .set('Authorization', `Bearer ${regularToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('email', 'regular@example.com');
          });
      });
    });
  });

  describe('QuestionnairesController (e2e)', () => {
    let authToken: string;
    let questionnaireId: string;

    beforeAll(async () => {
      // Login
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Login@123',
        });
      authToken = res.body.data.accessToken;
    });

    describe('POST /questionnaires', () => {
      it('should create a questionnaire', () => {
        return request(app.getHttpServer())
          .post('/questionnaires')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Test Questionnaire',
            description: 'Test description',
            questions: [
              {
                id: 'q1',
                text: 'Test question',
                type: 'text',
                required: true,
              },
            ],
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data).toHaveProperty('title', 'Test Questionnaire');
            questionnaireId = res.body.data.id;
          });
      });
    });

    describe('GET /questionnaires', () => {
      it('should get questionnaires list', () => {
        return request(app.getHttpServer())
          .get('/questionnaires')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('questionnaires');
            expect(Array.isArray(res.body.data.questionnaires)).toBe(true);
          });
      });
    });

    describe('GET /questionnaires/:id', () => {
      it('should get questionnaire by id', () => {
        return request(app.getHttpServer())
          .get(`/questionnaires/${questionnaireId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id', questionnaireId);
            expect(res.body.data).toHaveProperty('title', 'Test Questionnaire');
          });
      });

      it('should return 404 for non-existent questionnaire', () => {
        return request(app.getHttpServer())
          .get('/questionnaires/nonexistent-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('PUT /questionnaires/:id', () => {
      it('should update questionnaire', () => {
        return request(app.getHttpServer())
          .put(`/questionnaires/${questionnaireId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Updated Questionnaire',
            description: 'Updated description',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('title', 'Updated Questionnaire');
          });
      });
    });
  });

  describe('ResponsesController (e2e)', () => {
    let authToken: string;
    let questionnaireId: string;
    let responseId: string;

    beforeAll(async () => {
      // Login
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Login@123',
        });
      authToken = res.body.data.accessToken;

      // Create a questionnaire
      const questionnaireRes = await request(app.getHttpServer())
        .post('/questionnaires')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Response Test Questionnaire',
          description: 'For response testing',
          questions: [
            {
              id: 'q1',
              text: 'Test question for response',
              type: 'text',
              required: true,
            },
          ],
        });
      questionnaireId = questionnaireRes.body.data.id;
    });

    describe('POST /responses', () => {
      it('should create a response', () => {
        return request(app.getHttpServer())
          .post('/responses')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            questionnaireId,
            answers: [
              {
                questionId: 'q1',
                answer: 'Test answer',
              },
            ],
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data).toHaveProperty('questionnaireId', questionnaireId);
            responseId = res.body.data.id;
          });
      });
    });

    describe('GET /responses/:id', () => {
      it('should get response by id', () => {
        return request(app.getHttpServer())
          .get(`/responses/${responseId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id', responseId);
          });
      });
    });
  });

  describe('ExpensesController (e2e)', () => {
    let authToken: string;
    let expenseId: string;

    beforeAll(async () => {
      // Login
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Login@123',
        });
      authToken = res.body.data.accessToken;
    });

    describe('POST /expenses', () => {
      it('should create an expense', () => {
        return request(app.getHttpServer())
          .post('/expenses')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Expense',
            amount: 100000,
            category: 'office_supplies',
            expenseDate: '2024-01-01',
            recipientName: 'Test Recipient',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data).toHaveProperty('name', 'Test Expense');
            expenseId = res.body.data.id;
          });
      });
    });

    describe('GET /expenses', () => {
      it('should get expenses list', () => {
        return request(app.getHttpServer())
          .get('/expenses')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('expenses');
            expect(Array.isArray(res.body.data.expenses)).toBe(true);
          });
      });
    });
  });

  describe('ReportsController (e2e)', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Login@123',
        });
      authToken = res.body.data.accessToken;
    });

    describe('GET /reports', () => {
      it('should get reports list', () => {
        return request(app.getHttpServer())
          .get('/reports')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('reports');
            expect(Array.isArray(res.body.data.reports)).toBe(true);
          });
      });
    });
  });
});