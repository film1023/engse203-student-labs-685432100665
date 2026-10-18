# หลักฐานการสาธิต (A4)

> ⚠ ต้องอัดวิดีโอเองแล้วใส่ลิงก์ — ถ้าใช้ Google Drive ตั้งสิทธิ์ "ทุกคนที่มีลิงก์ดูได้"

## ช่วง A — สาธิตระบบ (≈ 3–4 นาที)

🔗 _ใส่ลิงก์วิดีโอ หรือ timestamp_

- [ ] เปิดครบ 3 ชั้น (API `npm run dev` · frontend `npm run dev` · campus.db)
- [ ] ดู · เพิ่ม · เปลี่ยนสถานะ · ลบคำร้อง
- [ ] เปิด `http://localhost:3001/api/health`
- [ ] ปิด-เปิด API ใหม่ แล้วคำร้องที่เพิ่มยังอยู่
- [ ] production mode พอร์ตเดียว: `NODE_ENV=production npm run build` → `PORT=10000 npm start` → เปิด `http://localhost:10000`

## ช่วง B — อธิบาย source (≈ 4–5 นาที)

🔗 _ใส่ลิงก์วิดีโอ หรือ timestamp_

เล่าตามเส้นทาง "ผู้ใช้กดเพิ่มคำร้อง":

- [ ] `frontend/src/services/requestService.js` → `apiClient.js` (`fetch`, `VITE_API_BASE_URL`, จัดการ error)
- [ ] `api/src/app.js` → `routes/requestRoutes.js` → `middleware/validateRequest.js` → `controllers/requestController.js`
- [ ] `api/src/services/requestService.js` — แปลงชื่อเป็น `users.id`, `INSERT`, อ่านกลับด้วย `JOIN ... AS requesterName`
- [ ] `api/src/config.js` — อ่าน env ที่เดียว · `isProd`, `port`, `staticDir`
- [ ] `api/src/routes/healthRoutes.js` — เช็คการเชื่อมต่อฐานข้อมูล → 200/503
- [ ] production vs dev — `app.js` เสิร์ฟ `frontend/dist` + catch-all · `frontend/.env.production` ว่าง

## Live Demo (Challenge — ถ้าทำ)

🔗 _ยังไม่ได้ deploy_
