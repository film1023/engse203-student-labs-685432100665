/**
 * requestStorage.js — ที่เดียวที่แตะ localStorage ได้
 */

export const STORAGE_KEY = 'engse203-campus-requests-v1';
export const SCHEMA_VERSION = 1;

const priorities = new Set(['normal', 'urgent']);
const statuses = new Set(['pending', 'in-progress', 'completed']);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidRequest(request) {
  return Boolean(
    request
      && isNonEmptyString(request.id)
      && request.id.startsWith('REQ-')
      && typeof request.requesterName === 'string'
      && request.requesterName.trim().length >= 2
      && isNonEmptyString(request.requestType)
      && isNonEmptyString(request.location)
      && typeof request.details === 'string'
      && request.details.trim().length >= 10
      && priorities.has(request.priority)
      && statuses.has(request.status),
  );
}

function validateRequests(requests) {
  if (!Array.isArray(requests) || !requests.every(isValidRequest)) {
    return false;
  }

  return new Set(requests.map((request) => request.id)).size === requests.length;
}

/**
 * อ่านข้อมูลจาก localStorage
 */
export function readStoredRequests() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    return { status: 'missing' };
  }

  try {
    const envelope = JSON.parse(raw);

    if (envelope?.schemaVersion !== SCHEMA_VERSION) {
      return {
        status: 'invalid',
        reason: 'schemaVersion ไม่ตรงกับเวอร์ชันปัจจุบัน',
      };
    }

    if (!validateRequests(envelope?.requests)) {
      return {
        status: 'invalid',
        reason: 'ข้อมูลคำร้องไม่ถูกต้องหรือมีรหัสซ้ำ',
      };
    }

    return {
      status: 'valid',
      requests: structuredClone(envelope.requests),
    };
  } catch {
    return {
      status: 'invalid',
      reason: 'ข้อมูลใน storage ไม่ใช่ JSON ที่ถูกต้อง',
    };
  }
}

/**
 * เขียนข้อมูลลง localStorage
 */
export function writeStoredRequests(requests) {
  if (!validateRequests(requests)) {
    throw new Error('ไม่สามารถบันทึกข้อมูลคำร้องที่ไม่ถูกต้องได้');
  }

  const envelope = {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    requests: structuredClone(requests),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

/**
 * ลบเฉพาะข้อมูลของ LAB05
 */
export function clearStoredRequests() {
  localStorage.removeItem(STORAGE_KEY);
}