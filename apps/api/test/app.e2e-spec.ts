/**
 * E2E smoke tests — require a running database.
 * Run with: pnpm --filter api test:e2e
 *
 * These tests are intentionally minimal scaffolds. Expand as the test
 * database becomes available in CI.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200);
  });

  it('GET /properties requires authentication (returns 401)', () => {
    return request(app.getHttpServer())
      .get('/properties')
      .expect(401);
  });

  it('GET /leases requires authentication (returns 401)', () => {
    return request(app.getHttpServer())
      .get('/leases')
      .expect(401);
  });

  it('GET /payments requires authentication (returns 401)', () => {
    return request(app.getHttpServer())
      .get('/payments')
      .expect(401);
  });

  it('POST /auth/login with invalid credentials returns 401', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrong' })
      .expect(401);
  });
});
