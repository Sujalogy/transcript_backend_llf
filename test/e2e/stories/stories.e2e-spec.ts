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

describe('Stories (e2e)', () => {
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

    describe('GET /story', () => {
        it('should return all stories', () => {
            return request(app.getHttpServer())
                .get('/story')
                .set('Cookie', [`auth_token=${authToken}`])
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBeTruthy();
                    expect(res.body[0]).toHaveProperty('id');
                    expect(res.body[0]).toHaveProperty('title');
                });
        });

        it('should return story by id', () => {
            const storyId = 'test-id';
            return request(app.getHttpServer())
                .get(`/story/${storyId}`)
                .set('Cookie', [`auth_token=${authToken}`])
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id', storyId);
                });
        });

        it('should return 404 for non-existent story', () => {
            return request(app.getHttpServer())
                .get('/story/non-existent-id')
                .set('Cookie', [`auth_token=${authToken}`])
                .expect(404);
        });
    });

    describe('POST /story', () => {
        it('should create new story with valid data', () => {
            const storyData = {
                title: 'Test Story',
                text: 'Test content',
                settings: {
                    rate: 'medium',
                    language: 'en'
                }
            };

            return request(app.getHttpServer())
                .post('/story')
                .set('Cookie', [`auth_token=${authToken}`])
                .send(storyData)
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('message', 'Story created successfully');
                    expect(res.body).toHaveProperty('lambdaResponse');
                });
        });

        it('should return 401 when creating story without auth', () => {
            return request(app.getHttpServer())
                .post('/story')
                .send({}) 
                .expect(401);
        });
    });
});