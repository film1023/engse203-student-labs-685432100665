import { apiFetch, setAuthToken, clearAuthToken, getAuthToken } from './apiClient.js';

/**
 * เข้าสู่ระบบเจ้าหน้าที่ — POST /api/auth/login
 * สำเร็จ: เก็บ token (apiClient แนบ Authorization: Bearer ให้ทุกคำขอ) และชื่อผู้ใช้ไว้แสดงผล
 * ไม่สำเร็จ: ApiError 400/401/429 ส่งต่อให้หน้าจอแสดงข้อความ
 */
const USER_KEY = 'campus.authUser';

export async function login(email, password) {
  const result = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(result.token);
  try { localStorage.setItem(USER_KEY, JSON.stringify(result.user)); } catch { /* private mode */ }
  return result.user;
}

export function logout() {
  clearAuthToken();
  try { localStorage.removeItem(USER_KEY); } catch { /* ข้ามได้ */ }
}

/** ผู้ใช้ที่เข้าสู่ระบบอยู่ · ไม่มี token = null (token หมดอายุจะถูกล้างเมื่อ API ตอบ 401) */
export function getCurrentUser() {
  if (!getAuthToken()) return null;
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
}
