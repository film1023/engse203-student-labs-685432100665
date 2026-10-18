import * as service from '../services/requestService.js';
import { AppError } from '../middleware/errorHandler.js';

/** controller รู้จัก req/res และตัดสิน status code — แต่ไม่จัดการข้อมูลเอง */

const ALLOWED_STATUS = ['pending', 'in-progress', 'completed'];

export async function listRequests(req, res) {
  const { status } = req.query;
  res.status(200).json(service.findAll({ status }));
}

export async function getRequest(req, res) {
  const found = service.findById(req.params.id);
  if (!found) throw new AppError(`ไม่พบคำร้องรหัส ${req.params.id}`, 404);
  res.status(200).json(found);
}

export async function createRequest(req, res) {
  const created = service.create(req.body);
  res.status(201).json(created);
}

export async function updateRequestStatus(req, res) {
  const { status } = req.body ?? {};
  if (!ALLOWED_STATUS.includes(status)) {
    throw new AppError('สถานะต้องเป็น pending, in-progress หรือ completed', 400);
  }
  const updated = service.updateStatus(req.params.id, status);
  if (!updated) throw new AppError(`ไม่พบคำร้องรหัส ${req.params.id}`, 404);
  res.status(200).json(updated);
}

export async function deleteRequest(req, res) {
  const removed = service.remove(req.params.id);
  if (!removed) throw new AppError(`ไม่พบคำร้องรหัส ${req.params.id}`, 404);
  res.status(204).end();
}
