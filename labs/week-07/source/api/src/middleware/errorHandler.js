import { config } from '../config.js';

/** ⭐ error ที่กำหนด status เองได้ — โยนจากที่ไหนก็ได้ แล้ว errorHandler ตอบให้ */
export class AppError extends Error {
  constructor(message, status = 500, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    if (details) this.details = details;
  }
}

/** ⭐ ห่อ handler ที่เป็น async — ส่ง error ที่ reject ต่อให้ errorHandler (จำเป็นใน Express 4) */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** CP14 · จับ error ที่หลุดมาจากทุก route — ต้องมี 4 พารามิเตอร์ Express ถึงจะรู้ว่าเป็น error handler */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // JSON ที่ส่งมาเสีย → express.json() โยน error ที่มี status 400
  const status = err.status ?? err.statusCode ?? 500;

  if (status >= 500) {
    // 5xx — ผู้ใช้ไม่ได้ทำผิด แต่เราต้องรู้เพื่อไปแก้
    console.error('เกิดข้อผิดพลาดภายใน:', err.message);
  }

  let message = err.message;
  if (status >= 500) message = 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';
  else if (err.type === 'entity.parse.failed') message = 'รูปแบบ JSON ที่ส่งมาไม่ถูกต้อง';

  res.status(status).json({
    error: message,
    ...(err.details ? { details: err.details } : {}),
    // ส่ง stack เฉพาะตอนพัฒนาเท่านั้น — production ห้ามเปิดเผยโครงสร้างภายใน
    ...(config.isProduction ? {} : { stack: err.stack?.split('\n').slice(0, 3) }),
  });
}

/** ไม่มี route ไหนตรง */
export function notFound(req, res) {
  res.status(404).json({ error: `ไม่พบเส้นทาง ${req.method} ${req.originalUrl}` });
}
