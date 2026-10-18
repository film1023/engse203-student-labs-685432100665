import { test, before, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadSeed } from '../src/services/requestService.js';
import { config } from '../src/config.js';

let app;
before(() => {
  app = createApp();
});
// โหลด seed ใหม่ทุกเคส — แต่ละ test ไม่ขึ้นกับผลของ test ก่อนหน้า
beforeEach(async () => {
  await loadSeed();
});

const validRequest = {
  requesterName: 'ทดสอบ ระบบ',
  requestType: 'แจ้งซ่อม',
  location: 'C3-401',
  details: 'รายละเอียดยาวพอสมควรจริง',
  priority: 'normal',
};

describe('GET /api/requests', () => {
  test('คืนรายการทั้งหมด พร้อม status 200 และเป็น array', async () => {
    const res = await request(app).get('/api/requests');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length > 0);
  });

  test('กรองด้วย ?status=pending คืนเฉพาะคำร้องสถานะ pending', async () => {
    const res = await request(app).get('/api/requests?status=pending');
    assert.equal(res.status, 200);
    assert.ok(res.body.every((r) => r.status === 'pending'));
  });
});

describe('GET /api/requests/:id', () => {
  test('รหัสที่มีอยู่ (REQ-001) ตอบ 200 พร้อมคำร้องรหัสนั้น', async () => {
    const res = await request(app).get('/api/requests/REQ-001');
    assert.equal(res.status, 200);
    assert.equal(res.body.id, 'REQ-001');
  });

  test('รหัสที่ไม่มี ตอบ 404 พร้อมข้อความ error', async () => {
    const res = await request(app).get('/api/requests/REQ-999');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'ไม่พบคำร้องรหัส REQ-999');
  });
});

describe('POST /api/requests', () => {
  test('ข้อมูลถูกต้อง ตอบ 201 พร้อม id ใหม่และ status เป็น pending', async () => {
    const res = await request(app).post('/api/requests').send(validRequest);
    assert.equal(res.status, 201);
    assert.match(res.body.id, /^REQ-/);
    assert.equal(res.body.status, 'pending');
  });

  test('ข้อมูลไม่ครบ ตอบ 400 พร้อม details เป็น array บอกจุดที่ผิด', async () => {
    const res = await request(app).post('/api/requests').send({ requesterName: 'ก' });
    assert.equal(res.status, 400);
    assert.ok(Array.isArray(res.body.details));
    assert.ok(res.body.details.length >= 1);
  });
});

describe('PUT /api/requests/:id', () => {
  test('เปลี่ยนสถานะเป็น in-progress ตอบ 200 และ GET ซ้ำเห็นค่าใหม่', async () => {
    const res = await request(app).put('/api/requests/REQ-001').send({ status: 'in-progress' });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'in-progress');
    const again = await request(app).get('/api/requests/REQ-001');
    assert.equal(again.body.status, 'in-progress');
  });

  test('สถานะไม่อยู่ใน 3 ค่าที่ยอมรับ ตอบ 400', async () => {
    const res = await request(app).put('/api/requests/REQ-001').send({ status: 'done' });
    assert.equal(res.status, 400);
  });

  test('รหัสที่ไม่มี ตอบ 404', async () => {
    const res = await request(app).put('/api/requests/REQ-999').send({ status: 'completed' });
    assert.equal(res.status, 404);
  });
});

describe('DELETE /api/requests/:id', () => {
  test('ลบสำเร็จ ตอบ 204 และลบซ้ำได้ 404', async () => {
    const first = await request(app).delete('/api/requests/REQ-001');
    assert.equal(first.status, 204);
    const second = await request(app).delete('/api/requests/REQ-001');
    assert.equal(second.status, 404);
  });
});

describe('CORS และ error', () => {
  test('ตอบ Access-Control-Allow-Origin ตรงกับ origin ที่อนุญาต', async () => {
    const res = await request(app).get('/api/requests').set('Origin', config.corsOrigin);
    assert.equal(res.headers['access-control-allow-origin'], config.corsOrigin);
  });

  test('preflight OPTIONS สำหรับ POST ตอบ 204', async () => {
    const res = await request(app)
      .options('/api/requests')
      .set('Origin', config.corsOrigin)
      .set('Access-Control-Request-Method', 'POST');
    assert.equal(res.status, 204);
  });

  test('เส้นทางที่ไม่มี ตอบ 404 รูปแบบ { error }', async () => {
    const res = await request(app).get('/api/unknown');
    assert.equal(res.status, 404);
    assert.equal(typeof res.body.error, 'string');
  });
});
