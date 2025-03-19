import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { setupTestApp } from '../../helpers/test-setup.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestApp([AppModule]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Google Authentication', () => {
    it('/auth/google (GET)', () => {
      return request(app.getHttpServer())
        .get('/auth/google')
        .expect(302)
        .expect('Location', /^https:\/\/accounts\.google\.com/);
    });

    it('/auth/me (GET) should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('/auth/logout (GET) should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/auth/logout')
        .expect(401);
    });
  });
});