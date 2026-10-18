import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config.js';
import requestRoutes from './routes/requestRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // CP10 · CORS ต้องอยู่บนสุด เพื่อให้ preflight (OPTIONS) ผ่านก่อนถึง route อื่น
  app.use(cors({ origin: config.corsOrigin }));

  // CP14 · morgan — dev: สั้น มีสี · production: combined (มี IP, user-agent, เวลา)
  // ไม่ log ตอนรันด้วย node --test (มันตั้ง NODE_TEST_CONTEXT ให้) เพื่อให้ผล test อ่านง่าย
  if (!process.env.NODE_TEST_CONTEXT) {
    app.use(morgan(config.isProduction ? 'combined' : 'dev'));
  }

  app.use(express.json());

  app.get('/', (req, res) => {
    res.json({ message: 'Campus Service API is running', version: '2.0.0' });
  });
  app.use('/api/requests', requestRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
