import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

export async function setupTestApp(imports: any[]): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports,
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  await app.init();
  return app;
}