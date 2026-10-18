import { describe, test, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { loadSeed } from '../../src/services/requestService.js';

/**
 * Integration test — ยิง HTTP จริงผ่านทุกชั้น: route → controller → service → SQLite
 *
 * ย้ายมาจาก tests/api.test.js ของสัปดาห์ 10 (node:test → Vitest)
 *   assert.equal(a, b)  →  expect(a).toBe(b)
 *   assert.ok(x)        →  expect(x).toBe(true)
 *   before(...)         →  beforeEach(...)   ← ฐานข้อมูลใหม่ทุกข้อ
 *
 * vitest.config.js ตั้ง DB_FILE=':memory:' ไว้แล้ว
 * → loadSeed() ทุกครั้งได้ฐานข้อมูลใหม่ในหน่วยความจำ (5 รายการ) ไม่แตะ campus.db
 */

const app = createApp();
beforeEach(async () => { await loadSeed(); });

const valid = {
  requesterName: 'ทดสอบ อัตโนมัติ', requestType: 'แจ้งซ่อม',
  location: 'C3-401', details: 'รายละเอียดยาวพอสมควรจริง', priority: 'normal',
};

describe('GET /api/requests', () => {
  test('คืน array 5 รายการจากข้อมูลตั้งต้น พร้อม 200', async () => {
    const r = await request(app).get('/api/requests');
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(5);
  });
  test('คืน requesterName ไม่ใช่ requester_id', async () => {
    const r = await request(app).get('/api/requests');
    expect(r.body[0]).toHaveProperty('requesterName');
    expect(r.body[0]).not.toHaveProperty('requester_id');
  });
  test('กรอง ?status= ทำงาน', async () => {
    const r = await request(app).get('/api/requests?status=pending');
    expect(r.body.length).toBeGreaterThan(0);
    expect(r.body.every((x) => x.status === 'pending')).toBe(true);
  });
  test('SQL injection ผ่าน ?status= ไม่หลุด', async () => {
    const r = await request(app).get("/api/requests?status=' OR '1'='1");
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(0);
  });
});

describe('GET /api/requests/:id', () => {
  test('พบ → 200', async () => {
    const r = await request(app).get('/api/requests/REQ-001');
    expect(r.status).toBe(200);
    expect(r.body.id).toBe('REQ-001');
  });
  test('ไม่พบ → 404', async () => {
    const r = await request(app).get('/api/requests/REQ-999');
    expect(r.status).toBe(404);
  });
});

describe('POST /api/requests', () => {
  test('ข้อมูลถูกต้อง → 201 · ได้รหัสถัดไป', async () => {
    const r = await request(app).post('/api/requests').send(valid);
    expect(r.status).toBe(201);
    expect(r.body.id).toBe('REQ-006');
  });
  test('ข้อมูลไม่ครบ → 400 พร้อมรายการ error', async () => {
    const r = await request(app).post('/api/requests').send({ requesterName: 'x' });
    expect(r.status).toBe(400);
    expect(Array.isArray(r.body.details)).toBe(true);
  });
});

describe('PUT /api/requests/:id', () => {
  test('เปลี่ยนสถานะ → 200 และค่าใหม่ถูกบันทึก', async () => {
    const r = await request(app).put('/api/requests/REQ-001').send({ status: 'completed' });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('completed');
  });
  test('สถานะนอกรายการ → 400', async () => {
    const r = await request(app).put('/api/requests/REQ-001').send({ status: 'done' });
    expect(r.status).toBe(400);
  });
});

describe('DELETE /api/requests/:id', () => {
  test('ลบแล้ว GET ซ้ำ → 404', async () => {
    await request(app).delete('/api/requests/REQ-003').expect(204);
    await request(app).get('/api/requests/REQ-003').expect(404);
  });
  test('ลบรายการที่ไม่มี → 404', async () => {
    await request(app).delete('/api/requests/REQ-999').expect(404);
  });
});

describe('เส้นทางที่ไม่มีอยู่', () => {
  test('GET /api/nope → 404 เป็น JSON', async () => {
    const r = await request(app).get('/api/nope');
    expect(r.status).toBe(404);
    expect(r.body.error).toMatch(/ไม่พบเส้นทาง/);
  });
});

describe('ข้อมูลผิดรูปแบบ', () => {
  test('ส่ง JSON ที่เสีย → 400 เป็น JSON ไม่ใช่ 500', async () => {
    const r = await request(app).post('/api/requests')
      .set('Content-Type', 'application/json').send('{"requesterName": ');
    expect(r.status).toBe(400);
    expect(r.body).toHaveProperty('error');
  });
});

// CP47 · regression test ของ bug จาก BUG_REPORTS.md
//   เขียน test ที่ "ทำซ้ำอาการ" ก่อน → fail → แก้โค้ด → ผ่าน → bug จะไม่กลับมาโดยไม่มีใครรู้
describe('regression — BUG_REPORTS.md', () => {
  test('BUG #1 · ลบรายการกลาง (REQ-002) แล้วเพิ่มใหม่ → 201 และได้รหัสที่ไม่ซ้ำ', async () => {
    await request(app).delete('/api/requests/REQ-002').expect(204);
    const r = await request(app).post('/api/requests').send(valid);
    expect(r.status).toBe(201);
    expect(r.body.id).toBe('REQ-006');
    const all = await request(app).get('/api/requests');
    const ids = all.body.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('BUG #1 · ลบหลายรายการแล้วเพิ่มต่อกัน 2 ครั้ง → 201 ทั้งคู่', async () => {
    await request(app).delete('/api/requests/REQ-001').expect(204);
    await request(app).delete('/api/requests/REQ-004').expect(204);
    const a = await request(app).post('/api/requests').send(valid);
    const b = await request(app).post('/api/requests').send(valid);
    expect([a.status, b.status]).toEqual([201, 201]);
    expect(a.body.id).not.toBe(b.body.id);
  });

  test('BUG #3 · เปลี่ยนสถานะคำร้องที่ไม่มี → 404 (ไม่ใช่ 500)', async () => {
    const r = await request(app).put('/api/requests/REQ-999').send({ status: 'completed' });
    expect(r.status).toBe(404);
    expect(r.body.error).toMatch(/ไม่พบคำร้อง/);
  });

  test('BUG #3 · คำร้องที่เพิ่งถูกลบ → PUT ได้ 404', async () => {
    await request(app).delete('/api/requests/REQ-005').expect(204);
    const r = await request(app).put('/api/requests/REQ-005').send({ status: 'in-progress' });
    expect(r.status).toBe(404);
  });
});
