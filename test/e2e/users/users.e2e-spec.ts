import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { setupTestApp } from '../../helpers/test-setup.helper';

async function mockGoogleLogin(app: INestApplication<any>) {
    return request(app.getHttpServer())
        .post('/auth/google/login')
        .send({
            token: 'mock-google-token',
        })
        .expect(200);
}

describe('Users (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await setupTestApp([AppModule]);
    // Get auth token by logging in (mock authentication for testing)
    const loginResponse = await mockGoogleLogin(app);
    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/profile', () => {
    it('should return user profile when authenticated', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .set('Cookie', [`auth_token=${authToken}`])
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('firstName');
          expect(res.body).toHaveProperty('lastName');
        });
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);
    });
  });
});