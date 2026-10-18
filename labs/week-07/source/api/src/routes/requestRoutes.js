import { Router } from 'express';
import * as controller from '../controllers/requestController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// route เจาะจงต้องมาก่อน route ที่มี :id เสมอ
router.get('/', asyncHandler(controller.listRequests));
router.post('/', validateRequest, asyncHandler(controller.createRequest));
router.get('/:id', asyncHandler(controller.getRequest));
router.put('/:id', asyncHandler(controller.updateRequestStatus));
router.delete('/:id', asyncHandler(controller.deleteRequest));

export default router;
