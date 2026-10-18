import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';

// ใช้ฐานข้อมูลทดสอบแยก — test ที่เขียนข้อมูลจะไม่ไปแก้ campus.db จริง
// และสร้างใหม่จาก schema.sql ทุกครั้งที่รัน → รันซ้ำกี่รอบก็ได้ผลเดิม
const TEST_DB = path.join(tmpdir(), `campus-test-${process.pid}.db`);
process.env.DB_FILE = TEST_DB;

let app;
before(async () => {
  rmSync(TEST_DB, { force: true });
  const { createApp } = await import('../src/app.js');
  const { loadSeed } = await import('../src/services/requestService.js');
  await loadSeed();
  app = createApp();
});
after(() => rmSync(TEST_DB, { force: true }));

const validRequest = {
  requesterName: 'สมชาย ใจดี',
  requestType: 'แจ้งซ่อม',
  location: 'C3-401',
  details: 'รายละเอียดยาวพอสมควรจริง',
  priority: 'normal',
};

describe('GET /api/requests', () => {
  test('คืน array จากฐานข้อมูล พร้อม 200', async () => {
    const r = await request(app).get('/api/requests');
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.body));
    assert.equal(r.body.length, 10);
  });

  test('คืน requesterName (ชื่อจาก JOIN) ไม่ใช่ requester_id', async () => {
    const r = await request(app).get('/api/requests');
    assert.ok('requesterName' in r.body[0]);
    assert.ok(!('requester_id' in r.body[0]));
    assert.equal(r.body[0].requesterName, 'สมชาย ใจดี');
  });

  test('?status=pending กรองด้วย WHERE ในฐานข้อมูล', async () => {
    const r = await request(app).get('/api/requests?status=pending');
    assert.equal(r.status, 200);
    assert.ok(r.body.length > 0);
    assert.ok(r.body.every((x) => x.status === 'pending'));
  });

  test('SQL injection ผ่าน ?status= ไม่หลุด และตารางยังอยู่', async () => {
    for (const evil of ["x' OR '1'='1", "'; DROP TABLE requests; --", "pending' OR status='completed"]) {
      const r = await request(app).get(`/api/requests?status=${encodeURIComponent(evil)}`);
      assert.equal(r.status, 200);
      assert.equal(r.body.length, 0, `หลุด: ${evil}`);
    }
    const all = await request(app).get('/api/requests');
    assert.equal(all.status, 200);
    assert.ok(all.body.length > 0);
  });
});

describe('GET /api/requests/:id', () => {
  test('พบ → 200 · ไม่พบ → 404', async () => {
    const found = await request(app).get('/api/requests/REQ-001');
    assert.equal(found.status, 200);
    assert.equal(found.body.id, 'REQ-001');
    const missing = await request(app).get('/api/requests/REQ-999');
    assert.equal(missing.status, 404);
  });
});

describe('POST /api/requests', () => {
  test('ข้อมูลถูกต้อง → 201 · ชื่อที่มีอยู่แล้วใช้ผู้ใช้เดิม ไม่สร้างซ้ำ', async () => {
    const before = (await request(app).get('/api/users')).body.length;
    const r = await request(app).post('/api/requests').send(validRequest);
    assert.equal(r.status, 201);
    assert.match(r.body.id, /^REQ-\d{3,}$/);
    assert.equal(r.body.requesterName, 'สมชาย ใจดี');
    assert.equal(r.body.status, 'pending');
    const after = (await request(app).get('/api/users')).body.length;
    assert.equal(after, before);
  });

  test('ชื่อใหม่ → สร้างผู้ใช้ให้อัตโนมัติ', async () => {
    const before = (await request(app).get('/api/users')).body.length;
    const r = await request(app).post('/api/requests').send({ ...validRequest, requesterName: 'ผู้ใช้ ใหม่เอี่ยม' });
    assert.equal(r.status, 201);
    const after = (await request(app).get('/api/users')).body.length;
    assert.equal(after, before + 1);
  });

  test('ข้อมูลไม่ครบ → 400 (validation ยังทำงาน)', async () => {
    const r = await request(app).post('/api/requests').send({ requesterName: 'ก' });
    assert.equal(r.status, 400);
    assert.ok(Array.isArray(r.body.details));
  });
});

describe('PUT / DELETE', () => {
  test('PUT เปลี่ยนสถานะ → 200 และบันทึกลงฐานข้อมูลจริง', async () => {
    const r = await request(app).put('/api/requests/REQ-002').send({ status: 'completed' });
    assert.equal(r.status, 200);
    const again = await request(app).get('/api/requests/REQ-002');
    assert.equal(again.body.status, 'completed');
  });

  test('DELETE → 204 แล้ว GET ซ้ำ → 404', async () => {
    const del = await request(app).delete('/api/requests/REQ-003');
    assert.equal(del.status, 204);
    const again = await request(app).get('/api/requests/REQ-003');
    assert.equal(again.status, 404);
  });
});

describe('⭐ /api/users', () => {
  test('GET /api/users คืนผู้ใช้พร้อมจำนวนคำร้อง (รวมคนที่ยังไม่เคยแจ้ง)', async () => {
    const r = await request(app).get('/api/users');
    assert.equal(r.status, 200);
    assert.ok(r.body.some((u) => u.requestCount === 0));
  });

  test('GET /api/users/:id/requests คืนเฉพาะคำร้องของคนนั้น · ไม่พบ → 404', async () => {
    const r = await request(app).get('/api/users/1/requests');
    assert.equal(r.status, 200);
    assert.ok(r.body.length > 0);
    assert.ok(r.body.every((x) => x.requesterName === 'สมชาย ใจดี'));
    const missing = await request(app).get('/api/users/9999/requests');
    assert.equal(missing.status, 404);
  });
});
