import { describe, test, expect, vi } from 'vitest';
import { AppError, asyncHandler, errorHandler, notFound } from '../../src/middleware/errorHandler.js';

/** res ปลอม — จดว่าถูกเรียกด้วยอะไร โดยไม่ต้องเปิด server */
function fakeRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe('AppError', () => {
  test('เก็บ status ที่กำหนด · ไม่กำหนดเป็น 500', () => {
    expect(new AppError('ไม่พบ', 404).status).toBe(404);
    expect(new AppError('พัง').status).toBe(500);
  });
});

describe('asyncHandler', () => {
  test('error จาก handler ที่เป็น async ถูกส่งต่อให้ next()', async () => {
    const boom = new Error('boom');
    const next = vi.fn();
    await asyncHandler(async () => { throw boom; })({}, {}, next);
    expect(next).toHaveBeenCalledWith(boom);
  });
});

describe('errorHandler', () => {
  test('4xx → ส่งข้อความของ error ให้ผู้ใช้เห็น', () => {
    const res = fakeRes();
    errorHandler(new AppError('ข้อมูลไม่ถูกต้อง', 400), {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error).toBe('ข้อมูลไม่ถูกต้อง');
  });
  test('5xx → ซ่อนข้อความจริง ตอบข้อความกลาง ๆ', () => {
    const res = fakeRes();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(new Error('SQLITE internal detail'), {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error).toBe('เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('notFound', () => {
  test('ตอบ 404 พร้อม method และ path', () => {
    const res = fakeRes();
    notFound({ method: 'GET', originalUrl: '/x' }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].error).toBe('ไม่พบเส้นทาง GET /x');
  });
});
