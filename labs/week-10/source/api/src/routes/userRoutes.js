import { Router } from 'express';
import * as service from '../services/requestService.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * ⭐ /api/users — ตอนนี้ยังเล็กจึงเรียก service ตรงจาก route
 * ถ้าระบบโตขึ้น (แก้ไข/ลบผู้ใช้) ควรแยก userService + userController เหมือน requests
 */
const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(service.findAllUsers());
}));

router.get('/:id/requests', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || !service.findUserById(id)) {
    throw new AppError(`ไม่พบผู้ใช้รหัส ${req.params.id}`, 404);
  }
  res.json(service.findByRequester(id));
}));

export default router;
