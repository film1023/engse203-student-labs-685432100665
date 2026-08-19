/**
 * requestService.js — ชั้นเข้าถึงข้อมูล
 */

import {
  clearStoredRequests,
  readStoredRequests,
  writeStoredRequests,
} from './requestStorage.js';

const LAB_DELAY_MS = 420;

/* ─────────── ให้มาแล้ว ─────────── */

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForLabDelay() {
  await delay(globalThis.__ENGSE203_SKIP_DELAY__ ? 0 : LAB_DELAY_MS);
}

/* ─────────── คาบ 5A ─────────── */

async function fetchSeedRequests() {
  const baseUrl = import.meta.env?.BASE_URL ?? '/';
  const response = await fetch(`${baseUrl}data/initialRequests.json`);

  if (!response.ok) {
    throw new Error('ไม่สามารถโหลดข้อมูลตัวอย่างได้');
  }

  return structuredClone(await response.json());
}

/* ─────────── คาบ 5B ─────────── */

/**
 * โหลดข้อมูลปกติ
 *
 * ถ้ามีข้อมูลใน localStorage และถูกต้อง
 * ให้ใช้ข้อมูลนั้นก่อน
 *
 * ถ้าไม่มีข้อมูลหรือข้อมูลเสียหาย
 * ให้โหลด seed และบันทึกใหม่
 */
async function loadNormalRequests(onRecovery) {
  const stored = readStoredRequests();

  if (stored.status === 'valid') {
    return structuredClone(stored.requests);
  }

  const seedRequests = await fetchSeedRequests();

  if (stored.status === 'invalid') {
    onRecovery?.(
      stored.reason
        ? `ข้อมูลเดิมเสียหาย จึงกู้คืนข้อมูลตัวอย่างใหม่: ${stored.reason}`
        : 'ข้อมูลเดิมเสียหาย จึงกู้คืนข้อมูลตัวอย่างใหม่',
    );
  }

  writeStoredRequests(seedRequests);

  return structuredClone(seedRequests);
}

/**
 * อ่านคำร้องทั้งหมด
 */
export async function getRequests(options = {}) {
  await waitForLabDelay();

  if (options.scenario === 'error') {
    throw new Error('LAB scenario: จำลองการโหลดข้อมูลไม่สำเร็จ');
  }

  if (options.scenario === 'empty') {
    return [];
  }

  return loadNormalRequests(options.onRecovery);
}

/**
 * หาคำร้องตาม ID
 */
export async function getRequestById(requestId) {
  const requests = await getRequests();

  return requests.find((request) => request.id === requestId) ?? null;
}

/**
 * สร้าง ID ใหม่ที่ขึ้นต้นด้วย REQ-
 */
function createRequestId(requests) {
  const existingIds = new Set(requests.map((request) => request.id));

  let id;

  do {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();

    id = `REQ-${timestamp}-${random}`;
  } while (existingIds.has(id));

  return id;
}

/**
 * เพิ่มคำร้องใหม่
 */
export async function addRequest(requestInput) {
  await waitForLabDelay();

  const input = requestInput ?? {};

  const requesterName =
    typeof input.requesterName === 'string'
      ? input.requesterName.trim()
      : '';

  const requestType =
    typeof input.requestType === 'string'
      ? input.requestType.trim()
      : '';

  const location =
    typeof input.location === 'string'
      ? input.location.trim()
      : '';

  const details =
    typeof input.details === 'string'
      ? input.details.trim()
      : '';

  const priority =
    typeof input.priority === 'string'
      ? input.priority.trim()
      : '';

  if (requesterName.length < 2) {
    throw new Error('กรุณาระบุชื่อผู้แจ้งอย่างน้อย 2 ตัวอักษร');
  }

  if (!requestType) {
    throw new Error('กรุณาระบุประเภทคำร้อง');
  }

  if (!location) {
    throw new Error('กรุณาระบุสถานที่');
  }

  if (details.length < 10) {
    throw new Error('รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร');
  }

  if (!['normal', 'urgent'].includes(priority)) {
    throw new Error('กรุณาระบุระดับความเร่งด่วนเป็น normal หรือ urgent');
  }

  const requests = await loadNormalRequests();

  const newRequest = {
    id: createRequestId(requests),
    requesterName,
    requestType,
    location,
    details,
    priority,
    status: 'pending',
  };

  const nextRequests = [...requests, newRequest];

  writeStoredRequests(nextRequests);

  return structuredClone(newRequest);
}

/**
 * ลบคำร้องตาม ID
 */
export async function deleteRequest(requestId) {
  await waitForLabDelay();

  const requests = await loadNormalRequests();

  const nextRequests = requests.filter(
    (request) => request.id !== requestId,
  );

  writeStoredRequests(nextRequests);

  return structuredClone(nextRequests);
}

/**
 * คืนข้อมูลตัวอย่างเริ่มต้น
 */
export async function resetRequests() {
  await waitForLabDelay();

  clearStoredRequests();

  const seedRequests = await fetchSeedRequests();

  writeStoredRequests(seedRequests);

  return structuredClone(seedRequests);
}