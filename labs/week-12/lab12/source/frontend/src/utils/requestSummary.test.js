import { describe, test, expect } from 'vitest';
import { summarizeRequests } from './requestSummary.js';

// ข้อมูลหน้าตาเดียวกับที่ GET /api/requests ส่งมาจริง (คัดจาก DevTools → Network → Response)
// สังเกต status ใช้ขีดกลาง "in-progress" ตาม API_CONTRACT.md
const fromApi = [
  { id: 'REQ-001', requesterName: 'สมชาย ใจดี', requestType: 'แจ้งซ่อม', location: 'ห้องปฏิบัติการ 301', details: 'เครื่องปรับอากาศไม่ทำงานตั้งแต่เช้า', priority: 'urgent', status: 'pending' },
  { id: 'REQ-002', requesterName: 'สุภาวดี รักเรียน', requestType: 'บริการบัญชีผู้ใช้', location: 'อาคารวิศวกรรมซอฟต์แวร์', details: 'เข้าสู่ระบบห้องปฏิบัติการไม่ได้', priority: 'normal', status: 'in-progress' },
  { id: 'REQ-003', requesterName: 'ธนกฤต ตั้งใจ', requestType: 'ขอใช้อุปกรณ์', location: 'ห้องประชุม 2', details: 'ขอยืมโปรเจกเตอร์สำหรับนำเสนอโครงงาน', priority: 'normal', status: 'completed' },
  { id: 'REQ-004', requesterName: 'ปรียา ขยันยิ่ง', requestType: 'แจ้งซ่อม', location: 'ห้องสมุด ชั้น 2', details: 'เครื่องพิมพ์กระดาษติดบ่อยมาก', priority: 'urgent', status: 'in-progress' },
];

describe('summarizeRequests', () => {
  test('รายการว่าง → ทุกค่าเป็น 0', () => {
    expect(summarizeRequests([])).toEqual({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  });

  test('BUG #2 · นับ "in-progress" (ขีดกลาง) จากข้อมูลจริงของ API ได้ถูก', () => {
    expect(summarizeRequests(fromApi)).toEqual({ total: 4, pending: 1, inProgress: 2, completed: 1 });
  });

  test('ผลรวมทุกสถานะเท่ากับ total เสมอ เมื่อทุกรายการมีสถานะที่ถูกต้อง', () => {
    const s = summarizeRequests(fromApi);
    expect(s.pending + s.inProgress + s.completed).toBe(s.total);
  });
});
