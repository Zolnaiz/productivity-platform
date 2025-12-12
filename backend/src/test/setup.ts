import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

let app: INestApplication;
let dataSource: DataSource;

export const setupTestApp = async (): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      AppModule,
    ],
  })
    .overrideProvider('DATA_SOURCE')
    .useValue({
      getRepository: jest.fn(),
    })
    .compile();

  app = moduleFixture.createNestApplication();
  dataSource = moduleFixture.get<DataSource>(DataSource);
  
  await app.init();

  return { app, dataSource };
};

export const cleanupTestApp = async (): Promise<void> => {
  if (dataSource && dataSource.isInitialized) {
    // Drop and recreate schema for clean tests
    await dataSource.dropDatabase();
    await dataSource.synchronize();
  }
  
  if (app) {
    await app.close();
  }
};

export const getTestDataSource = (): DataSource => dataSource;
export const getTestApp = (): INestApplication => app;