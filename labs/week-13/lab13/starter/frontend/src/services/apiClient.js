/**
 * ตัวกลางสำหรับคุยกับ API — ที่เดียวที่เรียก fetch()
 * ทุกฟังก์ชันใน requestService เรียกผ่านตรงนี้
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

/** error ที่รู้ว่ามาจาก API พร้อม status ที่ได้กลับมา */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ⭐ token ของเจ้าหน้าที่ — เก็บใน localStorage (หน้า login จะเรียก setAuthToken ใน Term Project)
const TOKEN_KEY = 'campus.authToken';

export function getAuthToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setAuthToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* เช่น private mode — ข้ามได้ */ }
}
export function clearAuthToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ข้ามได้ */ }
}

async function parseError(response) {
  try {
    const body = await response.json();
    return body.error ?? `คำขอไม่สำเร็จ (${response.status})`;
  } catch {
    return `คำขอไม่สำเร็จ (${response.status})`;
  }
}

/**
 * เรียก API แล้วคืนข้อมูลที่ parse แล้ว
 * - ตอบ 2xx → คืนข้อมูล (204 คืน null เพราะไม่มี body)
 * - ตอบ 4xx/5xx → โยน ApiError พร้อม status
 * - ต่อ API ไม่ได้เลย → โยน ApiError status 0
 */
export async function apiFetch(path, options = {}) {
  let response;
  const token = getAuthToken();
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      // แนบ Authorization: Bearer ที่นี่ที่เดียว ทุกคำขอได้ token เหมือนกันหมด
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    // fetch โยน error เมื่อต่อเซิร์ฟเวอร์ไม่ได้เลย เช่น API ไม่ได้เปิด
    throw new ApiError('ติดต่อเซิร์ฟเวอร์ไม่ได้ — ตรวจว่าเปิด API ที่พอร์ต 3001 แล้วหรือยัง', 0);
  }

  if (!response.ok) {
    // token หมดอายุหรือไม่ถูกต้อง → ล้างทิ้ง ให้หน้าจอพาไป login ใหม่
    if (response.status === 401) clearAuthToken();
    throw new ApiError(await parseError(response), response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}
