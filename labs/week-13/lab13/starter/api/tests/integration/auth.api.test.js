import { describe, test, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { loadSeed } from '../../src/services/requestService.js';
import { resetLoginLimiter } from '../../src/routes/authRoutes.js';
import { STAFF, loginAsStaff, tokenFor } from '../helpers/auth.js';

/**
 * Week 13 — เข้าสู่ระบบและสิทธิ์
 * test 3 ข้อแรกให้มาแล้ว — จะ fail จนกว่าจะทำ CP50–CP51 เสร็จ (เขียน test ก่อน แล้วทำให้ผ่าน)
 */
const app = createApp();
beforeEach(async () => { await loadSeed(); resetLoginLimiter(); });

describe('POST /api/auth/login', () => {
  test('อีเมลและรหัสผ่านถูก → 200 พร้อม token', async () => {
    const r = await request(app).post('/api/auth/login').send(STAFF);
    expect(r.status).toBe(200);
    expect(r.body.token.split('.')).toHaveLength(3);
  });
  test('รหัสผ่านผิด กับ อีเมลที่ไม่มี → 401 ข้อความเดียวกัน', async () => {
  const wrong = await request(app).post('/api/auth/login').send({ ...STAFF, password: 'nope1234' });
  const unknown = await request(app).post('/api/auth/login').send({ email: 'ghost@rmutl.ac.th', password: 'nope1234' });
  expect(wrong.status).toBe(401);
  expect(unknown.status).toBe(401);
  expect(wrong.body.error).toBe(unknown.body.error);
});
  // 🏫 TODO W13-LOGIN (CP50): อีเมลที่ไม่มี ต้องได้ข้อความ error เดียวกับรหัสผ่านผิด
});

describe('สิทธิ์ของ PUT / DELETE', () => {   // มีอยู่แล้วใน starter — เติมต่อจาก test 'ไม่มี token → 401' ตรง TODO W13-AUTH
  const put = () => request(app).put('/api/requests/REQ-001').send({ status: 'completed' });

  test('token ที่เซ็นด้วย secret อื่น (ปลอม) → 401', async () => {
    const r = await put().set('Authorization', `Bearer ${tokenFor('staff', 'not-the-real-secret')}`);
    expect(r.status).toBe(401);
  });
  test('token ถูกต้องแต่ไม่ใช่เจ้าหน้าที่ → 403', async () => {
    const r = await put().set('Authorization', `Bearer ${tokenFor('requester')}`);
    expect(r.status).toBe(403);
  });
  test('เจ้าหน้าที่ → PUT 200 และ DELETE 204', async () => {
    const auth = `Bearer ${await loginAsStaff(app)}`;
    await put().set('Authorization', auth).expect(200);
    await request(app).delete('/api/requests/REQ-002').set('Authorization', auth).expect(204);
  });
  test('ส่งคำร้อง (POST) และดูรายการ (GET) ยังไม่ต้องเข้าสู่ระบบ', async () => {
    await request(app).get('/api/requests').expect(200);
    await request(app).post('/api/requests').send({
      requesterName: 'นักศึกษา ทั่วไป', requestType: 'แจ้งซ่อม', location: 'ห้อง 205',
      details: 'ไฟห้องเรียนดับสองดวง', priority: 'normal',
    }).expect(201);
  });
});

describe('⭐ ความปลอดภัยเพิ่มเติม', () => {
  test('ทุก response มี security headers', async () => {
    const r = await request(app).get('/api/health');
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-frame-options']).toBe('DENY');
    expect(r.headers['referrer-policy']).toBe('no-referrer');
  });

  test('login ผิด 5 ครั้ง → ครั้งที่ 6 ได้ 429 แม้รหัสผ่านถูก', async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/api/auth/login').send({ ...STAFF, password: 'wrong-pass' }).expect(401);
    }
    const r = await request(app).post('/api/auth/login').send(STAFF);
    expect(r.status).toBe(429);
    expect(r.headers['retry-after']).toBeDefined();
  });

  test('login ผิด 4 ครั้งแล้วถูก → 200 และตัวนับเริ่มใหม่', async () => {
    for (let i = 0; i < 4; i += 1) {
      await request(app).post('/api/auth/login').send({ ...STAFF, password: 'wrong-pass' }).expect(401);
    }
    await request(app).post('/api/auth/login').send(STAFF).expect(200);
    for (let i = 0; i < 4; i += 1) {
      await request(app).post('/api/auth/login').send({ ...STAFF, password: 'wrong-pass' }).expect(401);
    }
    await request(app).post('/api/auth/login').send(STAFF).expect(200);
  });
});
