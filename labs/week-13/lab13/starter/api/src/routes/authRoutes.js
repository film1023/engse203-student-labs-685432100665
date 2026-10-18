import { Router } from 'express';
import * as authService from '../services/authService.js';
import { validateLoginInput } from '../validators/requestValidator.js';

const router = Router();

// ⭐ จำกัดการเดารหัสผ่าน — login ผิด 5 ครั้งภายใน 15 นาที (ต่อ IP) → 429 จนกว่าจะครบเวลา
//   เก็บในหน่วยความจำ: พอสำหรับ server เครื่องเดียว · ถ้ามีหลายเครื่องต้องย้ายไปที่เก็บกลาง (เช่น Redis)
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map();   // ip → { count, firstAt }

function isLocked(ip, now) {
  const entry = failures.get(ip);
  if (!entry) return false;
  if (now - entry.firstAt > WINDOW_MS) { failures.delete(ip); return false; }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(ip, now) {
  const entry = failures.get(ip);
  if (!entry || now - entry.firstAt > WINDOW_MS) failures.set(ip, { count: 1, firstAt: now });
  else entry.count += 1;
}

/** ล้างตัวนับ — ใช้ใน test (beforeEach) ไม่ให้ test ข้ออื่นโดน 429 ไปด้วย */
export function resetLoginLimiter() {
  failures.clear();
}

router.post('/login', (req, res) => {
  const now = Date.now();
  const ip = req.ip;
  if (isLocked(ip, now)) {
    const retryAfter = Math.ceil((failures.get(ip).firstAt + WINDOW_MS - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง' });
  }

  const errors = validateLoginInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง', details: errors });
  }
  const result = authService.login(req.body.email, req.body.password);
  if (!result) {
    recordFailure(ip, now);
    return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  }
  failures.delete(ip);   // เข้าได้แล้ว เริ่มนับใหม่
  res.status(200).json(result);
});

export default router;
