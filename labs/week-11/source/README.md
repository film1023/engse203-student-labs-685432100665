# Campus Service — ระบบรับคำร้องในมหาวิทยาลัย (Full-Stack · Week 11)

ผู้จัดทำ: ธีรนัย ไชยกันทะ 685432100665 · ENGSE203 SEC2

## ภาพรวม

เว็บแอปให้นักศึกษาและบุคลากรแจ้งซ่อม ขอใช้อุปกรณ์ หรือขอบริการบัญชีผู้ใช้ เจ้าหน้าที่ดูรายการ เปลี่ยนสถานะ (รอดำเนินการ → กำลังดำเนินการ → เสร็จสิ้น) และลบคำร้องได้ ข้อมูลเก็บถาวรในฐานข้อมูล ปิด-เปิดเซิร์ฟเวอร์แล้วไม่หาย

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React 19 · React Router 7 · Vite |
| API | Node.js 22 · Express 5 · cors · morgan · dotenv |
| Database | SQLite ผ่าน `node:sqlite` (ไฟล์ `api/data/campus.db`) |

## สถาปัตยกรรม 3 ชั้น

```
┌──────────────┐   HTTP + JSON   ┌───────────────────────────┐   SQL    ┌──────────────┐
│ React (SPA)  │ ──────────────► │ Express API               │ ───────► │ SQLite       │
│ frontend/    │ ◄────────────── │ route → controller →      │ ◄─────── │ campus.db    │
│              │                 │ service                   │   rows   │              │
└──────────────┘                 └───────────────────────────┘          └──────────────┘
```

| ชั้น | หน้าที่ | โฟลเดอร์ |
|---|---|---|
| Frontend | หน้าจอผู้ใช้ · ฟอร์ม · loading/error state · เรียก API ผ่าน `apiClient.js` ที่เดียว | `frontend/src/` (`services/` คุยกับ API) |
| API | **route** จับคู่ URL · **controller** ตัดสิน status code · **service** จัดการข้อมูล · middleware: CORS, log, validation, error | `api/src/` |
| Database | เก็บ `users` และ `requests` (1 : N) · constraint (FK, CHECK, UNIQUE) เป็นด่านสุดท้าย | `api/data/` (`schema.sql`, `campus.db`) |

**เส้นทางของคำร้องใหม่** — ผู้ใช้กด "เพิ่มคำร้อง" → `requestService.addRequest()` → `apiFetch('POST /api/requests')` → `validateRequest` ตรวจ body → `controller.createRequest` → `service.create()` แปลงชื่อเป็น `users.id` แล้ว `INSERT` → อ่านกลับด้วย `JOIN` → ตอบ `201` + JSON รูปแบบเดิมของ Week 07 → React อัปเดตหน้าจอ

### Endpoint

| Method | Path | ทำอะไร |
|---|---|---|
| GET | `/api/health` | สถานะระบบ (`env`, `uptime`, ฐานข้อมูล) · ต่อ DB ไม่ได้ตอบ `503` |
| GET | `/api/requests` (`?status=`) | รายการคำร้อง |
| GET | `/api/requests/:id` | คำร้องรายการเดียว |
| POST | `/api/requests` | สร้างคำร้อง (ชื่อใหม่ → สร้างผู้ใช้ให้อัตโนมัติ) |
| PUT | `/api/requests/:id` | เปลี่ยนสถานะ |
| DELETE | `/api/requests/:id` | ลบคำร้อง |
| GET | `/api/users` · `/api/users/:id/requests` | ผู้ใช้ และคำร้องของแต่ละคน |

รายละเอียดเต็มอยู่ใน [`API_CONTRACT.md`](API_CONTRACT.md)

## วิธีรัน (development) — 2 terminal

ต้องใช้ Node.js **22.13 ขึ้นไป** (`node:sqlite`)

```bash
# Terminal 1 — API → http://localhost:3001
cd api
npm install
cp .env.example .env
npm run db:setup        # สร้าง campus.db ถ้ายังไม่มี (npm run db:reset = ล้างกลับเป็นข้อมูลตั้งต้น)
npm run dev

# Terminal 2 — Frontend → http://localhost:5173
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

ใน dev ส่วนหน้าเว็บมาจาก Vite (5173) และเรียก API ข้ามพอร์ตไป 3001 · CORS อนุญาตเฉพาะ `CORS_ORIGIN`

## วิธีรัน (production) — พอร์ตเดียว

```bash
# จากโฟลเดอร์นี้ (labs/week-11/source)
NODE_ENV=production npm run build
NODE_ENV=production PORT=10000 npm start      # → http://localhost:10000
```

PowerShell: `$env:NODE_ENV="production"; npm run build; $env:PORT="10000"; npm start`

- `npm run build` ติดตั้ง dependency ของ `api/` และ `frontend/` (`--include=dev` เพราะ Vite เป็น devDependency และ cloud ตั้ง `NODE_ENV=production` ตั้งแต่ขั้น build) แล้ว build React ไปที่ `frontend/dist/`
- Express เสิร์ฟ `frontend/dist/` เอง และทุก path ที่ไม่ขึ้นต้นด้วย `/api` คืน `index.html` ให้ React Router · ไม่มีปัญหา CORS เพราะเป็น origin เดียวกัน
- `frontend/.env.production` ตั้ง `VITE_API_BASE_URL=` (ว่าง) → bundle เรียก `/api/...` แบบ path สัมพัทธ์ ไม่ฝัง `localhost:3001`
- ⚠ build แบบ production ลบ devDependencies (เช่น test tools) ออกจาก `api/node_modules` — ซ้อมเสร็จให้ `npm install --prefix api` ก่อนรัน test

ผลการซ้อมจริงอยู่ใน [`evidence/PRODUCTION_TEST.md`](evidence/PRODUCTION_TEST.md)

## Environment Variables

### API (`api/.env` — ตัวอย่างใน `api/.env.example`)

| ตัวแปร | ค่าเริ่มต้น | ใช้ทำอะไร |
|---|---|---|
| `NODE_ENV` | `development` | `production` → เสิร์ฟหน้าเว็บ · log แบบ `combined` · ไม่ส่ง stack trace |
| `PORT` | `3001` | พอร์ตของ API (cloud กำหนดให้เอง) |
| `CORS_ORIGIN` | `http://localhost:5173` | origin ที่เรียก API ได้ (ใช้ตอน dev) |
| `DB_FILE` | `api/data/campus.db` | ไฟล์ฐานข้อมูล (test ใช้ไฟล์แยกได้) |
| `STATIC_DIR` | `frontend/dist` | โฟลเดอร์หน้าเว็บที่เสิร์ฟตอน production |
| `TURSO_DATABASE_URL` · `TURSO_AUTH_TOKEN` | (ว่าง) | เตรียมไว้สำหรับ ⭐⭐ Challenge Turso — **ยังไม่ได้ทำ** service ยังใช้ไฟล์ในเครื่องเสมอ |

### Frontend

| ไฟล์ | `VITE_API_BASE_URL` | ใช้เมื่อ |
|---|---|---|
| `frontend/.env.local` | `http://localhost:3001` | `npm run dev` |
| `frontend/.env.production` | (ว่าง) | `npm run build` |

ค่าลับอยู่ใน `.env` / `.env.local` เท่านั้น (อยู่ใน `.gitignore`) · commit เฉพาะ `.env.example` และ `frontend/.env.production`

## การตัดสินใจออกแบบ

**ทำไมแยก 3 ชั้น** — แต่ละชั้นรู้เรื่องของตัวเองเท่านั้น ตลอดเทอมเปลี่ยนแหล่งข้อมูลมาแล้ว 4 ครั้ง (array → localStorage → API → SQLite) และทุกครั้งแก้แค่ชั้น service เพราะ signature ของฟังก์ชันคงเดิม · React ไม่รู้ว่าข้อมูลมาจาก SQLite และ controller ไม่รู้ SQL

**ทำไมเลือก SQLite** — ข้อมูลมีโครงชัดและมีความสัมพันธ์ (ผู้ใช้ 1 คน → หลายคำร้อง) จึงเหมาะกับฐานข้อมูลเชิงสัมพันธ์ที่บังคับ Foreign Key/CHECK ได้ · SQLite เป็นไฟล์เดียว ไม่ต้องติดตั้ง server มากับ Node 22 (`node:sqlite`) และเป็น sync ทำให้ไม่ต้องเปลี่ยน controller เป็น async · เหตุผลเต็มอยู่ใน [`DATABASE_CHOICES.md`](DATABASE_CHOICES.md)

**ทำไม production ใช้พอร์ตเดียว** — deploy เป็น service เดียว ไม่ต้องตั้ง CORS ข้ามโดเมน และ URL ของ API ไม่ต้องฝังใน bundle

## ทดสอบ

```bash
cd api && npm test                                                     # automated test
node --disable-warning=ExperimentalWarning check-week11.mjs            # checker ของวิชา (ต้อง build ก่อน)
```

CI: `.github/workflows/week11-check.yml` ที่ root ของ repository รัน build + checker ทุกครั้งที่ push

## Live Demo

ยังไม่ได้ deploy (Challenge) — ดู [`DEMO.md`](DEMO.md) สำหรับวิดีโอสาธิต
