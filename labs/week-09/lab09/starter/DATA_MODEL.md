# DATA_MODEL.md — การออกแบบฐานข้อมูล Campus Service Request

ผู้จัดทำ: ธีรนัย ไชยกันทะ 685432100665 · ฐานข้อมูล: SQLite (`campus.db`) · สร้างจาก `schema.sql`

---

## 1. ภาพรวม

```
┌──────────────────────┐            ┌──────────────────────────┐
│ users                │            │ requests                 │
├──────────────────────┤            ├──────────────────────────┤
│ id (PK) INTEGER      │──┐         │ id (PK) TEXT  "REQ-001"  │
│ name                 │  │   1 : N │ requester_id (FK) ───────┼──┐
│ department           │  └─────────┤ request_type             │  │
│ email (UNIQUE)       │◄───────────┼──────────────────────────┼──┘
└──────────────────────┘            │ location · details       │
                                    │ priority · status        │
                                    │ created_at               │
                                    └──────────────────────────┘
```

ความสัมพันธ์แบบ **หนึ่งต่อหลาย (1 : N)** — ผู้ใช้ 1 คนแจ้งได้หลายคำร้อง แต่คำร้อง 1 รายการมีผู้แจ้งได้คนเดียว จึงเก็บ Foreign Key `requester_id` ไว้ฝั่ง "หลาย" คือ `requests`

---

## 2. ทำไมต้องแยกเป็น 2 ตาราง

ตอน Week 06–07 ทุกคำร้องเก็บ `requesterName` เป็นข้อความไว้ในตัวเอง ถ้าสมชายแจ้ง 3 เรื่อง ชื่อ "สมชาย ใจดี" ก็ถูกพิมพ์ซ้ำ 3 ครั้ง ซึ่งทำให้เกิดปัญหา:

1. **ข้อมูลซ้ำ** — ชื่อคนเดียวกันอยู่หลายแถว เปลืองพื้นที่และไม่มีแหล่งความจริงเดียว
2. **แก้ไม่ครบ** — ถ้าสมชายเปลี่ยนชื่อ ต้องไล่แก้ทุกคำร้องที่เขาเคยแจ้ง (ในข้อมูลชุดนี้คือ 3 ที่) ถ้าพลาดไปหนึ่งแถว ระบบจะมี "สมชาย" สองชื่อที่ไม่ตรงกัน
3. **เก็บข้อมูลเพิ่มไม่ได้** — อยากรู้ภาควิชาหรืออีเมลของผู้แจ้ง ต้องเพิ่มคอลัมน์ให้ทุกคำร้องแล้วกรอกซ้ำทุกครั้ง และเก็บผู้ใช้ที่ยังไม่เคยแจ้งไม่ได้เลย
4. **พิมพ์ผิดแล้วไม่มีใครรู้** — "สมชาย ใจดี" กับ "สมชาย ใจด" ถูกนับเป็นคนละคน รายงาน "ใครแจ้งมากที่สุด" จะผิดโดยไม่มี error

เมื่อแยก `users` ออกมา **ชื่อเก็บที่เดียว** — สมชายเปลี่ยนชื่อ แก้แค่ 1 แถวใน `users` ทุกคำร้องที่ชี้มาด้วย `requester_id = 1` เห็นชื่อใหม่ทันทีผ่าน JOIN · เพิ่มภาควิชา/อีเมลได้โดยไม่แตะ `requests` · และ Foreign Key ทำให้ใส่ผู้แจ้งที่ไม่มีอยู่จริงไม่ได้ (ทดสอบในข้อ 7)

---

## 3. รายละเอียดตาราง

### `users`

| คอลัมน์ | ชนิด | ข้อกำหนด | เหตุผล |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | ให้ฐานข้อมูลออกเลขให้ ไม่ต้องคิดรหัสเอง · เป็นตัวเลขจึง JOIN เร็ว |
| `name` | TEXT | NOT NULL | ผู้ใช้ที่ไม่มีชื่อแสดงในคำร้องไม่ได้ |
| `department` | TEXT | NOT NULL | ใช้กรองคำร้องตามภาควิชา (query ⑥) |
| `email` | TEXT | NOT NULL UNIQUE | อีเมลระบุตัวคนได้จริง — คนชื่อซ้ำกันได้ แต่อีเมลซ้ำไม่ได้ |

### `requests`

| คอลัมน์ | ชนิด | ข้อกำหนด | เหตุผล |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | ใช้รหัสรูปแบบ `REQ-001` ที่ API และ React ใช้มาตั้งแต่ Week 05 |
| `requester_id` | INTEGER | NOT NULL · FOREIGN KEY → `users(id)` | คำร้องต้องมีเจ้าของ และเจ้าของต้องมีอยู่จริง |
| `request_type` | TEXT | NOT NULL · CHECK 4 ค่า | กันค่าที่ระบบไม่รู้จัก เช่นพิมพ์ "ซ่อม" แทน "แจ้งซ่อม" |
| `location` | TEXT | NOT NULL | เจ้าหน้าที่ต้องรู้ว่าไปที่ไหน |
| `details` | TEXT | NOT NULL | คำร้องที่ไม่มีรายละเอียดดำเนินการไม่ได้ |
| `priority` | TEXT | NOT NULL DEFAULT `'normal'` · CHECK `normal/urgent` | ส่วนใหญ่ไม่เร่งด่วน จึงให้ค่าเริ่มต้น |
| `status` | TEXT | NOT NULL DEFAULT `'pending'` · CHECK 3 ค่า | คำร้องใหม่ต้องเริ่มที่ "รอดำเนินการ" เสมอ |
| `created_at` | TEXT | NOT NULL DEFAULT `datetime('now','localtime')` | ใช้เรียงคำร้องล่าสุด (query ⑧) · SQLite ไม่มีชนิดวันที่ จึงเก็บเป็นข้อความรูปแบบ ISO ที่เรียงได้ถูก |

**Index** — `idx_requests_status` และ `idx_requests_requester` เพราะ `status` อยู่ใน `WHERE` และ `requester_id` อยู่ใน `JOIN` บ่อยที่สุด (`EXPLAIN QUERY PLAN` ยืนยันว่าใช้ `SEARCH requests USING INDEX idx_requests_status`)

---

## 4. เหตุผลของการเลือกชนิดและข้อกำหนด

**ทำไม `users.id` เป็น INTEGER แต่ `requests.id` เป็น TEXT**
`users.id` เป็นรหัสภายในที่ไม่มีใครเห็น ให้ฐานข้อมูลนับเพิ่มเองเป็นตัวเลขจะง่ายและเร็วที่สุด ส่วน `requests.id` เป็นรหัสที่ **ผู้ใช้เห็นและอ้างถึง** ("ติดตามคำร้อง REQ-004") มีรูปแบบที่สื่อความหมาย และต้องตรงกับรหัสที่ API/React ใช้อยู่แล้ว จึงเก็บเป็นข้อความ

**ทำไมต้องมี CHECK ทั้งที่ API ตรวจข้อมูลอยู่แล้ว**
API เป็นแค่ทางเข้าทางหนึ่ง ข้อมูลยังเข้าได้จากสคริปต์ seed, การแก้ใน DB Browser, หรือโค้ดเวอร์ชันใหม่ที่ลืมตรวจ CHECK อยู่ที่ฐานข้อมูลจึงเป็น **ด่านสุดท้าย** ที่ทุกทางต้องผ่าน (เหมือนที่ Week 07 ตรวจทั้งฝั่ง React และ API) และยังเป็นเอกสารในตัวว่าค่าที่ถูกต้องมีอะไรบ้าง

---

## 5. ตัวอย่างการใช้ JOIN

```sql
SELECT r.id, u.name AS requester_name, r.request_type, r.status
FROM requests r
JOIN users u ON u.id = r.requester_id
ORDER BY r.id;
```

ผลลัพธ์จริง (4 แถวแรกจาก 10):

| id | requester_name | request_type | status |
|---|---|---|---|
| REQ-001 | สมชาย ใจดี | แจ้งซ่อม | pending |
| REQ-002 | สุภาวดี รักเรียน | บริการบัญชีผู้ใช้ | in-progress |
| REQ-003 | ธนกฤต ตั้งใจ | ขอใช้อุปกรณ์ | completed |
| REQ-004 | ปรียา ขยันยิ่ง | แจ้งซ่อม | in-progress |

LEFT JOIN (query ⑩) ต่างจาก JOIN ตรงที่ "วรเชษฐ์ มั่นคง" ซึ่งยังไม่เคยแจ้งยังอยู่ในผลด้วย `total = 0` · ถ้าใช้ JOIN ธรรมดา เขาจะหายไปจากรายงาน

---

## 6. ข้อสังเกตสำหรับสัปดาห์ที่ 10

```
-- ผลของ JOIN
REQ-001 | สมชาย ใจดี | pending

-- ข้อมูลที่ API ส่งให้ React (Week 07)
{ "id": "REQ-001", "requesterName": "สมชาย ใจดี", "status": "pending" }
```

ข้อมูลเหมือนกัน แต่ **รูปร่างต่างกัน** — ในฐานข้อมูลชื่อผู้แจ้งอยู่อีกตาราง และชื่อคอลัมน์เป็น `snake_case` (`request_type`, `requester_id`) ขณะที่ React คาดหวัง `camelCase` (`requestType`, `requesterName`) ในวัตถุเดียว

ข้อสรุป: สัปดาห์ 10 ให้ `requestService.js` ทำ JOIN แล้ว **แปลงแต่ละแถวเป็นรูปร่างเดิมของ Week 07** ก่อนส่งออก controller, route และ React จะไม่ต้องแก้เลย · ส่วนตอนสร้างคำร้อง API ยังรับ `requesterName` เป็นข้อความ จึงต้อง **แปลงชื่อเป็น `users.id`** ก่อน INSERT (หาคนเดิม หรือสร้างผู้ใช้ใหม่ถ้ายังไม่มี)

---

## 7. ผลการทดสอบ Constraint (CP25)

ทดสอบกับ `campus.db` โดยเปิด `PRAGMA foreign_keys = ON` · ทุกข้อถูกปฏิเสธ และจำนวนแถวยังเป็น requests 10 · users 5 เท่าเดิม

### ① Foreign Key

```sql
INSERT INTO requests (id, requester_id, request_type, location, details)
VALUES ('REQ-TEST', 99999, 'แจ้งซ่อม', 'ห้องทดสอบ', 'ทดสอบระบบ');
```

**ผลที่ได้** `FOREIGN KEY constraint failed` ✓

### ② CHECK สถานะ

```sql
INSERT INTO requests (id, requester_id, request_type, location, details, status)
VALUES ('REQ-TEST', 1, 'แจ้งซ่อม', 'ห้องทดสอบ', 'ทดสอบระบบ', 'ยกเลิก');
```

**ผลที่ได้** `CHECK constraint failed: status IN ('pending','in-progress','completed')` ✓

### ③ อีเมลซ้ำ

```sql
INSERT INTO users (name, department, email)
VALUES ('สมชาย ซ้ำ', 'วิศวกรรมซอฟต์แวร์', 'somchai@rmutl.ac.th');
```

**ผลที่ได้** `UNIQUE constraint failed: users.email` ✓

### ④ รหัสคำร้องซ้ำ

```sql
INSERT INTO requests (id, requester_id, request_type, location, details)
VALUES ('REQ-001', 1, 'แจ้งซ่อม', 'ห้องทดสอบ', 'ทดสอบระบบ');
```

**ผลที่ได้** `UNIQUE constraint failed: requests.id` ✓

### ⑤ ไม่ระบุสถานที่

```sql
INSERT INTO requests (id, requester_id, request_type, details)
VALUES ('REQ-TEST', 1, 'แจ้งซ่อม', 'ทดสอบระบบ');
```

**ผลที่ได้** `NOT NULL constraint failed: requests.location` ✓
