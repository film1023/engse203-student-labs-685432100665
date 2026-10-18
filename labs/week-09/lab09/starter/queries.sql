-- ═══════════════════════════════════════════════════════════
-- queries.sql — คำสั่งค้นหาตอบโจทย์ (ทุกข้อรันจริงกับ campus.db แล้ว)
-- ═══════════════════════════════════════════════════════════

-- ① คำร้องทั้งหมด เรียงตามรหัส
SELECT * FROM requests ORDER BY id;

-- ② คำร้องที่ยังไม่ได้ดำเนินการ (status = 'pending')
SELECT id, location, details FROM requests
WHERE status = 'pending'
ORDER BY id;

-- ③ คำร้องเร่งด่วนที่ยังไม่เสร็จ — ใช้เงื่อนไข 2 ข้อพร้อมกัน
SELECT id, location, details, status FROM requests
WHERE priority = 'urgent' AND status <> 'completed'
ORDER BY id;

-- ④ ค้นคำร้องจากคำบางส่วนในรายละเอียด
SELECT id, details FROM requests
WHERE details LIKE '%เครื่องปรับอากาศ%'
ORDER BY id;

-- ⑤ คำร้องพร้อมชื่อผู้แจ้ง — ชื่ออยู่คนละตาราง จึงต้อง JOIN
SELECT r.id, u.name AS requester_name, r.request_type, r.status
FROM requests r
JOIN users u ON u.id = r.requester_id
ORDER BY r.id;

-- ⑥ คำร้องเฉพาะของภาควิชาหนึ่ง (JOIN + WHERE)
SELECT r.id, u.name, u.department, r.details
FROM requests r
JOIN users u ON u.id = r.requester_id
WHERE u.department = 'วิศวกรรมไฟฟ้า'
ORDER BY r.id;

-- ⑦ รายชื่อผู้แจ้งที่ไม่ซ้ำกัน (เฉพาะคนที่เคยแจ้งแล้ว)
SELECT DISTINCT u.name
FROM requests r
JOIN users u ON u.id = r.requester_id
ORDER BY u.name;

-- ⑧ คำร้อง 3 รายการล่าสุด
SELECT id, details, created_at FROM requests
ORDER BY created_at DESC
LIMIT 3;

-- ⭐ Challenge ─────────────────────────────────────────────

-- ⑨ นับจำนวนคำร้องแยกตามสถานะ (GROUP BY + COUNT)
SELECT status, COUNT(*) AS total
FROM requests
GROUP BY status
ORDER BY total DESC;

-- ⑩ ใครแจ้งคำร้องมากที่สุด — LEFT JOIN ให้คนที่ยังไม่เคยแจ้งติดมาด้วย (total = 0)
SELECT u.name, u.department, COUNT(r.id) AS total
FROM users u
LEFT JOIN requests r ON r.requester_id = u.id
GROUP BY u.id
ORDER BY total DESC, u.name;

-- ⑪ สร้าง INDEX ให้การค้นด้วย status เร็วขึ้น (มีใน schema.sql แล้ว — IF NOT EXISTS จึงรันซ้ำได้)
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);

-- ตรวจว่า query ข้อ ② ใช้ index จริง
EXPLAIN QUERY PLAN SELECT id FROM requests WHERE status = 'pending';
