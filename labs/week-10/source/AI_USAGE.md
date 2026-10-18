# AI Usage — LAB 10

| หัวข้อ | รายละเอียด |
|---|---|
| เครื่องมือที่ใช้ | Claude (Anthropic) |
| วันที่ | 18/10/2026 |

## ส่วนที่ AI ช่วยเขียน

- `api/data/schema.sql` — คัดลอกจาก LAB 09 ที่ทำเสร็จแล้ว (DROP, FK, CHECK, INDEX, seed)
- `api/src/services/requestService.js` — `toAppError`, transaction ใน `create`, `nextId` เรียงด้วยตัวเลข, ฟังก์ชันของ users, รองรับ `DB_FILE` ตอนเรียก `loadSeed()`
- `api/src/routes/userRoutes.js` และผูกใน `app.js`
- `api/tests/api.test.js` — 12 เคส ใช้ฐานข้อมูลชั่วคราวแยก
- `API_CONTRACT.md` (Data Model, รูปแบบข้อมูล, พฤติกรรม POST, error mapping) และ `evidence/SECURITY_TEST.md`

## สิ่งที่ต้องตรวจ/ทำเอง

- [ ] อธิบายได้ว่าทำไมต้องแปลงชื่อเป็น id และทำไม `?` กัน injection ได้
- [ ] ยิง curl 3 แบบใน CP31 กับ API ที่เปิดจริง
- [ ] ถ่าย screenshot 2 ภาพ

## สิ่งที่ได้เรียนรู้ (เขียนเอง)

<เขียนด้วยคำของตัวเอง>
