import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config.js';
import requestRoutes from './routes/requestRoutes.js';
import userRoutes from './routes/userRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import express0 from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // ① CORS ต้องมาก่อนทุกอย่าง — ไม่งั้นเบราว์เซอร์จะถูกบล็อกก่อนถึง route
  app.use(cors({ origin: config.corsOrigin }));

  // ② logging — dev อ่านง่าย · production กระชับสำหรับเก็บ log
  app.use(morgan(config.isProd ? 'combined' : 'dev'));

  // ③ อ่าน JSON body
  app.use(express.json());

  // ④ route
  app.get('/api', (req, res) => {
  res.json({ message: 'Campus Service API is running', version: '3.0.0' });
});
app.use('/api/health', healthRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);

if (config.isProd && existsSync(config.staticDir)) {
  app.use(express.static(config.staticDir));
  // ทุก path ที่ไม่ขึ้นต้นด้วย /api → คืน index.html (React Router จัดการต่อ)
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(config.staticDir, 'index.html'));
  });
} else {
  // dev: หน้าเว็บอยู่ที่ Vite (5173) · / ของ API ตอบข้อความบอกทางแทน
  app.get('/', (req, res) => res.json({ message: 'API (dev) — หน้าเว็บอยู่ที่พอร์ต 5173' }));
}

  // TODO W11-STATIC (CP39): production เสิร์ฟ frontend build จากที่นี่

  // ⑥ ปิดท้าย
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
