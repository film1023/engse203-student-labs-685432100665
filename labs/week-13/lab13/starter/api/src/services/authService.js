import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { findUserByEmail } from './requestService.js';
import { verifyPassword } from '../utils/password.js';

export function login(email, password) {
  const user = findUserByEmail(email);
  if (!user || user.role !== 'staff' || !verifyPassword(password, user.passwordHash)) {
    return null;
  }
  // payload อ่านได้ทุกคน (แค่ base64) — ใส่เฉพาะสิ่งที่ไม่ลับ ห้ามใส่รหัสผ่าน
  const payload = { sub: String(user.id), name: user.name, role: user.role };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  return { token, user: { id: user.id, name: user.name, role: user.role } };
}

/** ตรวจ token — ถูกต้องคืน payload · ปลอม/หมดอายุ โยน error */
export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}