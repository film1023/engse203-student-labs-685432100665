-- ═══════════════════════════════════════════════════════════
-- Campus Service Request — โครงสร้างฐานข้อมูล
-- ENGSE203 สัปดาห์ที่ 9 · หน่วยที่ 4
-- รันไฟล์นี้แล้วได้ฐานข้อมูลครบในครั้งเดียว และรันซ้ำได้โดยไม่ error
-- ═══════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ① ลบของเดิมก่อน — ลบฝั่งที่ "ชี้ไปหา" (requests) ก่อนฝั่งที่ "ถูกชี้" (users)
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS users;

-- ② ผู้แจ้ง — 1 คนแจ้งได้หลายคำร้อง
CREATE TABLE users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  department  TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE
);

-- ③ คำร้อง — requester_id ชี้ไป users(id)
CREATE TABLE requests (
  id            TEXT PRIMARY KEY,
  requester_id  INTEGER NOT NULL,
  request_type  TEXT NOT NULL
                CHECK (request_type IN ('แจ้งซ่อม','บริการบัญชีผู้ใช้','ขอใช้อุปกรณ์','อื่น ๆ')),
  location      TEXT NOT NULL,
  details       TEXT NOT NULL,
  priority      TEXT NOT NULL DEFAULT 'normal'
                CHECK (priority IN ('normal','urgent')),
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','in-progress','completed')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (requester_id) REFERENCES users(id)
);

-- ⭐ index กับคอลัมน์ที่ใช้ใน WHERE และ JOIN บ่อยที่สุด
CREATE INDEX IF NOT EXISTS idx_requests_status    ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_requester ON requests(requester_id);

-- ④ ข้อมูลตั้งต้น — users 5 คน (คนที่ 5 ยังไม่เคยแจ้ง ใช้ทดสอบ LEFT JOIN)
INSERT INTO users (name, department, email) VALUES
  ('สมชาย ใจดี',       'วิศวกรรมซอฟต์แวร์', 'somchai@rmutl.ac.th'),
  ('สุภาวดี รักเรียน',  'วิศวกรรมซอฟต์แวร์', 'supawadee@rmutl.ac.th'),
  ('ธนกฤต ตั้งใจ',      'วิศวกรรมไฟฟ้า',     'thanakrit@rmutl.ac.th'),
  ('ปรียา ขยันยิ่ง',    'สำนักวิทยบริการ',   'preeya@rmutl.ac.th'),
  ('วรเชษฐ์ มั่นคง',    'วิศวกรรมเครื่องกล', 'worachet@rmutl.ac.th');

-- requests 10 รายการ — ครบ 3 สถานะ · 2 ระดับความเร่งด่วน · หลายภาควิชา
-- ใส่ created_at เองเพื่อให้ "3 รายการล่าสุด" ได้ผลแน่นอน
INSERT INTO requests (id, requester_id, request_type, location, details, priority, status, created_at) VALUES
  ('REQ-001', 1, 'แจ้งซ่อม',          'ห้องปฏิบัติการ 301',        'เครื่องปรับอากาศไม่ทำงานตั้งแต่เช้า',        'urgent', 'pending',     '2026-09-01 08:30:00'),
  ('REQ-002', 2, 'บริการบัญชีผู้ใช้', 'อาคารวิศวกรรมซอฟต์แวร์',    'เข้าสู่ระบบห้องปฏิบัติการไม่ได้',             'normal', 'in-progress', '2026-09-02 09:15:00'),
  ('REQ-003', 3, 'ขอใช้อุปกรณ์',      'ห้องประชุม 2',              'ขอยืมโปรเจกเตอร์สำหรับนำเสนอโครงงาน',        'normal', 'completed',   '2026-09-03 13:00:00'),
  ('REQ-004', 4, 'แจ้งซ่อม',          'ห้องสมุด ชั้น 2',           'เครื่องพิมพ์กระดาษติดบ่อยมาก',               'urgent', 'in-progress', '2026-09-05 10:45:00'),
  ('REQ-005', 1, 'อื่น ๆ',            'โรงอาหารกลาง',              'ขอเพิ่มจุดชาร์จแบตเตอรี่สำหรับนักศึกษา',     'normal', 'pending',     '2026-09-08 12:10:00'),
  ('REQ-006', 2, 'แจ้งซ่อม',          'ห้องปฏิบัติการ 401',        'ไฟในห้องกะพริบตลอดเวลา',                     'normal', 'pending',     '2026-09-10 08:05:00'),
  ('REQ-007', 3, 'แจ้งซ่อม',          'ห้องปฏิบัติการไฟฟ้า 105',   'เครื่องปรับอากาศมีน้ำหยดใส่โต๊ะทดลอง',       'urgent', 'pending',     '2026-09-12 14:20:00'),
  ('REQ-008', 4, 'บริการบัญชีผู้ใช้', 'สำนักวิทยบริการ',           'ขอรีเซ็ตรหัสผ่านอีเมลมหาวิทยาลัย',           'urgent', 'completed',   '2026-09-15 09:00:00'),
  ('REQ-009', 1, 'ขอใช้อุปกรณ์',      'ห้องปฏิบัติการ 301',        'ขอยืมกล้องเว็บแคมสำหรับสอบออนไลน์',          'normal', 'in-progress', '2026-09-18 16:30:00'),
  ('REQ-010', 3, 'แจ้งซ่อม',          'อาคารวิศวกรรมไฟฟ้า',        'ปลั๊กไฟหน้าห้องเรียนชำรุดมีประกายไฟ',         'urgent', 'pending',     '2026-09-20 11:00:00');
