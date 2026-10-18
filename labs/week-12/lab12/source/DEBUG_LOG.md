# บันทึกการไล่ปัญหา (Debug Log)

กระบวนการเดียวกันทุก bug: อาการ → ทำซ้ำได้ → แยกชั้น → สมมติฐาน + หลักฐาน → แก้ → regression test (เขียน test ก่อน ให้ fail แล้วค่อยแก้)

---

## BUG #0 · รายละเอียดยาว 10 ตัวอักษรพอดีถูกปฏิเสธ

- **อาการ:** คำร้องที่รายละเอียดยาว 10 ตัวอักษรพอดี (เช่น `1234567890`) ได้ 400 "รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร" ทั้งที่กฎบอกว่าอย่างน้อย 10 ต้องผ่าน · ไม่มีผู้ใช้แจ้ง
- **วิธีทำซ้ำ:** `validateRequestInput({ ...valid, details: '1234567890' })` ได้ error 1 ข้อ แทน `[]`
- **เครื่องมือ:** unit test ค่าขอบ TC-03 (`npm test --prefix api`) — Expected `[]` · Received `['รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร']`
- **สาเหตุ (ไฟล์:บรรทัด):** `api/src/validators/requestValidator.js:37` ใช้ `length <= MIN_DETAILS` ซึ่งปฏิเสธค่าที่เท่ากับขอบด้วย (off-by-one)
- **วิธีแก้:** เปลี่ยนเป็น `length < MIN_DETAILS` ให้ตรงกับกฎของชื่อผู้แจ้ง · 9 ตัวยังถูกปฏิเสธ (ไม่แก้เกิน)
- **test ที่กัน:** `api/tests/unit/requestValidator.test.js` → "10 ตัวอักษร → ผ่าน (ตรงขอบพอดี)" และ "9 ตัวอักษร → error (ต่ำกว่าขอบ 1)"

## BUG #1 · ลบคำร้องแล้วเพิ่มใหม่ ได้ 500

- **อาการ:** หลังเจ้าหน้าที่ลบคำร้อง 1 รายการ การส่งคำร้องใหม่ได้ "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" (500) · ก่อนลบส่งได้ปกติ
- **วิธีทำซ้ำ:** ข้อมูลตั้งต้น 5 รายการ → `DELETE /api/requests/REQ-002` → `POST /api/requests` ข้อมูลถูกต้อง → 500 ทุกครั้ง
- **เครื่องมือ:** stack trace ใน terminal ของ API → `Error: UNIQUE constraint failed: requests.id at Module.create (…/services/requestService.js:127:7)` · แล้ววาง breakpoint ใน `nextId()` ดูค่า `total`
- **สาเหตุ (ไฟล์:บรรทัด):** `api/src/services/requestService.js:101` คำนวณรหัสใหม่จาก `COUNT(*) + 1` · ลบ REQ-002 แล้วเหลือ 4 รายการ จึงได้ `REQ-005` ซึ่งยังมีอยู่ → INSERT ชน PRIMARY KEY · "เมื่อวานส่งได้" เพราะยังไม่มีการลบ จำนวนจึงตรงกับเลขท้ายพอดี
- **วิธีแก้:** ใช้เลขมากที่สุดที่มีอยู่ + 1: `SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER))` (แปลงเป็นตัวเลขเพื่อให้ REQ-1000 > REQ-999)
- **test ที่กัน:** `api/tests/integration/requests.api.test.js` → "BUG #1 · ลบรายการกลาง (REQ-002) แล้วเพิ่มใหม่ → 201 และได้รหัสที่ไม่ซ้ำ" และ "BUG #1 · ลบหลายรายการแล้วเพิ่มต่อกัน 2 ครั้ง → 201 ทั้งคู่"

## BUG #2 · Dashboard แสดง "กำลังดำเนินการ 0"

- **อาการ:** การ์ดสรุปบน Dashboard บอก "กำลังดำเนินการ 0" ทั้งที่รายการด้านล่างมีคำร้องสถานะ in-progress · ตัวเลขอื่นถูก
- **วิธีทำซ้ำ:** `npm run db:reset --prefix api` → เปิด Dashboard → การ์ดแสดง 0 ทุกครั้ง (ข้อมูลตั้งต้นมี REQ-002 เป็น in-progress)
- **เครื่องมือ:** DevTools → Network → `GET /api/requests` → Response มี `"status": "in-progress"` ถูกต้อง → API ไม่ผิด ปัญหาอยู่ frontend · แล้วเขียน unit test ด้วยข้อมูลหน้าตาเดียวกับ Response
- **สาเหตุ (ไฟล์:บรรทัด):** `frontend/src/utils/requestSummary.js:12` นับ `count('in progress')` (ช่องว่าง) แต่ API และฐานข้อมูลใช้ `in-progress` (ขีดกลาง) จึงไม่มีรายการใดตรงเลย
- **วิธีแก้:** เปลี่ยนเป็น `count('in-progress')` ให้ตรงกับค่าใน `API_CONTRACT.md`
- **test ที่กัน:** `frontend/src/utils/requestSummary.test.js` → "BUG #2 · นับ \"in-progress\" (ขีดกลาง) จากข้อมูลจริงของ API ได้ถูก" (ข้อมูลตั้งต้นของ test ใช้ status เดียวกับ Response จริง)

## BUG #3 · เปลี่ยนสถานะคำร้องที่ไม่มีอยู่ ได้ 500

- **อาการ:** เปลี่ยนสถานะคำร้องที่ถูกลบไปแล้ว ได้ 500 แทนที่จะบอกว่า "ไม่พบคำร้อง"
- **วิธีทำซ้ำ:** `PUT /api/requests/REQ-999` พร้อม `{ "status": "completed" }` → 500 ทุกครั้ง
- **เครื่องมือ:** stack trace → `TypeError: Cannot read properties of null (reading 'id') at updateRequestStatus (…/controllers/requestController.js:30:35)` — บรรทัดแรกที่เป็นไฟล์ของเรา
- **สาเหตุ (ไฟล์:บรรทัด):** `api/src/controllers/requestController.js:30` เรียก `console.log(updated.id …)` **ก่อน** เช็ค `if (!updated)` · service คืน `null` เมื่อไม่พบ จึงอ่าน `.id` ของ `null` แล้วพัง ไปไม่ถึงบรรทัดที่ตอบ 404
- **วิธีแก้:** ย้าย `console.log` ไปไว้หลังการเช็ค `null` — ไม่พบตอบ 404 ก่อน
- **test ที่กัน:** `api/tests/integration/requests.api.test.js` → "BUG #3 · เปลี่ยนสถานะคำร้องที่ไม่มี → 404 (ไม่ใช่ 500)" และ "BUG #3 · คำร้องที่เพิ่งถูกลบ → PUT ได้ 404"

---

## coverage (Challenge)

`npm run coverage --prefix api` → statements **93.7%** (เดิม 77%)

- ลบ `api/src/middleware/logger.js` — coverage 0% และไม่มีไฟล์ไหน import (ถูกแทนด้วย morgan ตั้งแต่ Week 07) = dead code
- เพิ่ม `tests/integration/system.api.test.js` (health · users · หน้าแรก · transaction rollback) และ `tests/unit/errorHandler.test.js`
- ส่วนที่ยังไม่ครอบคลุม: ทาง production ใน `app.js` (เสิร์ฟ `frontend/dist`) และการเชื่อม Turso — ต้องตั้ง env คนละแบบ
