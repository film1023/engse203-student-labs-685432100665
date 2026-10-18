# CP43 — ผลการจำลอง production ในเครื่อง

วันที่: 18/10/2026 · `NODE_ENV=production` ทั้งขั้น build และ start · `PORT=10000`

## Build

- `npm install --prefix api` และ `npm install --prefix frontend --include=dev` ในโหมด production ผ่าน
- `vite build` → `✓ built` · `dist/assets/index-X9Z11gPz.js 250.32 kB`
- `grep -l "localhost:3001" frontend/dist/assets/*.js` → **ไม่มีผลลัพธ์** ✓

## Start: `Campus Service API พร้อมที่ http://localhost:10000`

| เปิด | ได้จริง | ผล |
|---|---|---|
| `http://localhost:10000/` | `200 text/html` — `<!doctype html> … ENGSE203` (หน้า React) | ✓ |
| `http://localhost:10000/about` | `200 text/html` — index.html (React Router จัดการต่อ) | ✓ |
| `http://localhost:10000/api/health` | `{"status":"ok","env":"production","database":{"connected":true,"driver":"sqlite","tables":3}}` | ✓ |
| `POST /api/requests` | `201` · `{"id":"REQ-006","requesterName":"ทดสอบ โปรดักชัน",…,"status":"pending"}` | ✓ |

log แบบ `combined`: `::ffff:127.0.0.1 - - [18/Oct/2026:05:36:49 +0000] "GET /about HTTP/1.1" 200 511 "-" "curl/7.81.0"`

หลังทดสอบ คืน `campus.db` เป็นไฟล์เดิม และรัน `npm install --prefix api` คืน devDependencies

## Screenshot ที่ต้องถ่ายเอง (`evidence/images/`)

- [ ] หน้าเว็บที่ `http://localhost:10000`
- [ ] `/api/health` แสดง `"env": "production"`
