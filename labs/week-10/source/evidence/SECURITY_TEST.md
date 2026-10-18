# LAB 10 — ผลการทดสอบความปลอดภัยและฐานข้อมูล

ผู้จัดทำ: ธีรนัย ไชยกันทะ 685432100665 · วันที่: 18/10/2026
ทดสอบด้วย supertest กับฐานข้อมูลที่สร้างใหม่จาก `schema.sql` (10 คำร้อง · 5 ผู้ใช้)

## CP31 · SQL Injection

ทุก query ใน `requestService.js` ที่รับค่าจากผู้ใช้ใช้ `prepare()` + `?` · ส่วนที่ต่อ string มีเฉพาะ `${SELECT_SHAPE}` ซึ่งเป็นโค้ดของเราเองที่เขียนตายตัว

### ① เงื่อนไขที่เป็นจริงเสมอ

**ยิง** `GET /api/requests?status=x' OR '1'='1`
**ผลที่ได้** `200` `[]` (0 รายการ) ✓ ถูกป้องกัน
**เพราะ** ทั้งก้อน `x' OR '1'='1` ถูกส่งเป็น *ค่า* ของ `?` — SQLite หาแถวที่ `status` เท่ากับข้อความนี้ตรงตัว ซึ่งไม่มี

### ② พยายามลบตาราง

**ยิง** `GET /api/requests?status='; DROP TABLE requests; --`
**ผลที่ได้** `200` `[]` ✓ · ยิง `GET /api/requests` ต่อทันทีได้ `200` และ **10 รายการครบ** — ตารางยังอยู่
**เพราะ** `;` และ `--` อยู่ในค่า ไม่ใช่ในคำสั่ง จึงไม่มีคำสั่งที่สองให้รัน

### ③ ต่อเงื่อนไขเพิ่ม

**ยิง** `GET /api/requests?status=pending' OR status='completed`
**ผลที่ได้** `200` `[]` ✓ (ถ้าหลุดจะได้คำร้อง pending + completed รวม 7 รายการ)
**เพราะ** เหตุผลเดียวกับข้อ ①

ทั้ง 3 เคสอยู่ใน `api/tests/api.test.js` (test "SQL injection ผ่าน ?status= ไม่หลุด และตารางยังอยู่") จึงรันซ้ำได้ทุกครั้ง

## CP32 · แปลง error จากฐานข้อมูล

| ทดสอบ | ผลที่ได้ |
|---|---|
| `service.create()` ด้วย `requestType: "ซ่อมรถ"` (ผิด CHECK) | `400` · `ค่าที่ส่งมาไม่อยู่ในรายการที่กำหนด` ✓ ไม่ใช่ 500 · ไม่มีคำว่า `CHECK constraint` |
| `service.updateStatus('REQ-001', 'ยกเลิก')` | `400` · `ค่าที่ส่งมาไม่อยู่ในรายการที่กำหนด` ✓ |
| POST ผ่าน API ด้วย type ผิด | `400` จาก `validateRequest` ก่อนถึงฐานข้อมูล ✓ |

`errorHandler.js` ไม่ได้แก้ — service แค่โยน `AppError` ที่มี `status` ถูกต้อง

## ⭐ Transaction

ส่ง `requesterName: "คนใหม่ ทดสอบ"` (ยังไม่มีในระบบ) พร้อม `requestType` ผิด CHECK
→ ได้ error `400` และจำนวนผู้ใช้ **ก่อน 5 · หลัง 5** ✓ ผู้ใช้ที่สร้างไปแล้วถูก `ROLLBACK` ไม่ค้าง

## ⭐ Index — `EXPLAIN QUERY PLAN SELECT * FROM requests WHERE status = 'pending'`

| | ผล |
|---|---|
| ไม่มี index | `SCAN requests` — อ่านทุกแถว |
| มี `idx_requests_status` | `SEARCH requests USING INDEX idx_requests_status (status=?)` |

## CP33 · Automated test

`cd api && npm test` → `# tests 12 · # pass 12 · # fail 0` · รันซ้ำรอบที่ 2 ผ่านเหมือนเดิม (test ใช้ฐานข้อมูลชั่วคราวแยกจาก `campus.db`)

## Screenshot ที่ต้องถ่ายเอง (`evidence/images/`)

- [ ] `app-from-database.png` — Dashboard แสดงข้อมูลจาก campus.db
- [ ] `checker-week07.png` — ผล `node check-week07.mjs`
