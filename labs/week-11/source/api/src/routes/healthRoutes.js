import { Router } from 'express';
import { getDbStatus } from '../services/requestService.js';
import { config } from '../config.js';

/**
 * GET /api/health — ระบบบอกสถานะตัวเอง (CP37)
 * ต่อฐานข้อมูลได้ → 200 status 'ok' · ต่อไม่ได้ → 503 'degraded'
 * Render ใช้ path นี้เป็น Health Check
 */
const router = Router();

router.get('/', (req, res) => {
  const db = getDbStatus();
  const ok = db.connected;
  
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    env: config.env,
    uptime: Math.round(process.uptime()),
    database: db,
    time: new Date().toISOString(),
  });

});

export default router;
