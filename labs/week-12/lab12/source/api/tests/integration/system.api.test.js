import { describe, test, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { loadSeed, create, listUsers } from '../../src/services/requestService.js';

/**
 * Integration test ของส่วนที่ไม่ใช่ /api/requests — health · users · หน้าแรก
 * และ transaction ใน service (เรียก service ตรง เพราะ validator กันข้อมูลผิดก่อนถึง DB เสมอ)
 */
const app = createApp();
beforeEach(async () => { await loadSeed(); });

describe('หน้าแรกและ /api', () => {
  test('GET /api → 200 บอกว่า API ทำงาน', async () => {
    const r = await request(app).get('/api');
    expect(r.status).toBe(200);
    expect(r.body.message).toMatch(/running/);
  });
  test('GET / ตอน dev/test → JSON บอกทางไปหน้าเว็บ (ไม่ใช่ 404)', async () => {
    const r = await request(app).get('/');
    expect(r.status).toBe(200);
    expect(r.body.api).toBe('/api');
  });
});

describe('GET /api/health', () => {
  test('ต่อฐานข้อมูลได้ → 200 status ok พร้อมข้อมูลฐานข้อมูล', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('ok');
    expect(r.body.database.connected).toBe(true);
    expect(r.body.database.driver).toBe('sqlite');
  });
});

describe('/api/users', () => {
  test('GET /api/users → รายชื่อผู้ใช้ ไม่มีอีเมลหลุดออกไป', async () => {
    const r = await request(app).get('/api/users');
    expect(r.status).toBe(200);
    expect(r.body.length).toBeGreaterThan(0);
    expect(r.body[0]).toHaveProperty('name');
    expect(r.body[0]).not.toHaveProperty('email');
  });
  test('GET /api/users/1/requests → เฉพาะคำร้องของผู้ใช้ 1', async () => {
    const r = await request(app).get('/api/users/1/requests');
    expect(r.status).toBe(200);
    expect(r.body.map((x) => x.id)).toContain('REQ-001');
  });
});

describe('service.create — transaction', () => {
  test('INSERT ล้มเหลว (ประเภทผิด CHECK) → ROLLBACK ไม่เหลือผู้ใช้ใหม่ค้าง', () => {
    const before = listUsers().length;
    expect(() => create({
      requesterName: 'ผู้ใช้ ใหม่เอี่ยม', requestType: 'ซ่อมรถ',
      location: 'ลานจอด', details: 'ทดสอบ rollback ของ transaction', priority: 'normal',
    })).toThrow(/CHECK/);
    expect(listUsers().length).toBe(before);
  });
});
