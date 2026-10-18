# AI Usage — LAB 07

| หัวข้อ | รายละเอียด |
|---|---|
| เครื่องมือที่ใช้ | Claude (Anthropic) |
| วันที่ | 18/10/2026 |

## ถามหรือให้ช่วยอะไร

ให้ช่วยทำ Take-Home CP13–CP16 และ Challenge ตามคู่มือ `LAB07_TAKEHOME_GUIDE_TH.md`

## ส่วนที่ AI ช่วยเขียน

- `api/src/app.js` — ใส่ morgan (`dev`/`combined`) ต่อจาก CORS
- `api/src/middleware/errorHandler.js` — `AppError`, `asyncHandler`, ซ่อน `stack` ตอน production, ข้อความ JSON เสีย
- `api/src/controllers/requestController.js`, `routes/requestRoutes.js` — เปลี่ยนมาโยน `AppError` และห่อด้วย `asyncHandler`
- `api/tests/api.test.js` — 13 เคส
- `frontend/src/pages/RequestDetailPage.jsx` — ปุ่มเปลี่ยนสถานะ (disabled ระหว่างรอ, ใช้ค่าที่ API ตอบกลับ)
- `frontend/src/services/apiClient.js` — retry เฉพาะ GET เมื่อ status 0/5xx (500ms → 1s → 2s)
- `API_CONTRACT.md`, `evidence/API_TEST.md` — ตัวอย่างทุกอันมาจากการยิงจริงด้วย supertest
- `api/.env.example`, `frontend/.env.example`, `.gitignore`

## สิ่งที่ตรวจ/แก้เอง

- [ ] อ่านโค้ดทุกไฟล์ที่ AI แก้ และอธิบายได้ว่าแต่ละส่วนทำอะไร
- [ ] เปิด API + frontend แล้วกดเปลี่ยนสถานะเอง · refresh แล้วสถานะยังอยู่
- [ ] ยิงด้วย Postman เทียบกับ `API_CONTRACT.md` อย่างน้อย 3 เส้น
- [ ] ถ่าย screenshot 3 ภาพเอง

## สิ่งที่ได้เรียนรู้ (เขียนเอง)

<เขียนด้วยคำของตัวเอง>
