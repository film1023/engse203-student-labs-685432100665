# LAB 07 — API Test Evidence

ผู้จัดทำ: ธีรนัย ไชยกันทะ 685432100665 · วันที่ทดสอบ: 18/10/2026

## 1. Checker ของวิชา

```text
node check-week07.mjs
🏫 ในห้อง (CP09–CP12)   ผ่าน 25/25 รายการ
🏠 ที่บ้าน (CP13–CP16)   ผ่าน 8/8 รายการ
⭐ Challenge            ผ่าน 3/3 รายการ
ผ่าน 36/36 รายการ
```

## 2. Automated test (`cd api && npm test`)

```text
# tests 13
# suites 6
# pass 13
# fail 0
```

| # | กลุ่ม | ชื่อ test | ผล |
|---|---|---|---|
| 1 | GET list | คืนรายการทั้งหมด พร้อม status 200 และเป็น array | ✅ |
| 2 | GET list | กรองด้วย ?status=pending คืนเฉพาะ pending | ✅ |
| 3 | GET :id | REQ-001 ตอบ 200 | ✅ |
| 4 | GET :id | รหัสที่ไม่มี ตอบ 404 | ✅ |
| 5 | POST | ข้อมูลถูกต้อง ตอบ 201 + status pending | ✅ |
| 6 | POST | ข้อมูลไม่ครบ ตอบ 400 + details | ✅ |
| 7 | PUT | เปลี่ยนเป็น in-progress ตอบ 200 และ GET ซ้ำเห็นค่าใหม่ | ✅ |
| 8 | PUT | status ไม่ถูกต้อง ตอบ 400 | ✅ |
| 9 | PUT | รหัสที่ไม่มี ตอบ 404 | ✅ |
| 10 | DELETE | ลบสำเร็จ 204 · ลบซ้ำ 404 | ✅ |
| 11 | CORS | Access-Control-Allow-Origin ตรง origin ที่อนุญาต | ✅ |
| 12 | CORS | preflight OPTIONS ตอบ 204 | ✅ |
| 13 | Error | เส้นทางที่ไม่มี ตอบ 404 รูปแบบ { error } | ✅ |

**ลองทำให้พัง** — แก้ `createRequest` ให้ตอบ `200` แทน `201` แล้วรัน `npm test` → `not ok 3 - POST /api/requests` (`# pass 12 · # fail 1`) · แก้กลับแล้วผ่านครบ 13/13

## 3. ยิงจริงทีละ endpoint

| Method | Endpoint | Body | Status ที่ได้ | ตรง contract |
|---|---|---|---|---|
| GET | `/api/requests?status=pending` | — | 200 (1 รายการ) | ✅ |
| GET | `/api/requests/REQ-001` | — | 200 | ✅ |
| GET | `/api/requests/REQ-999` | — | 404 | ✅ |
| POST | `/api/requests` | ข้อมูลครบ | 201 · `status: "pending"` | ✅ |
| POST | `/api/requests` | ชื่อ 1 ตัว · details สั้น | 400 · details 2 ข้อ | ✅ |
| PUT | `/api/requests/REQ-001` | `{ "status": "in-progress" }` | 200 | ✅ |
| PUT | `/api/requests/REQ-001` | `{ "status": "done" }` | 400 | ✅ |
| PUT | `/api/requests/REQ-999` | `{ "status": "completed" }` | 404 | ✅ |
| DELETE | `/api/requests/REQ-002` | — | 204 | ✅ |
| DELETE | `/api/requests/REQ-002` (ซ้ำ) | — | 404 | ✅ |
| OPTIONS | `/api/requests` (preflight POST) | — | 204 + ACAO `http://localhost:5173` | ✅ |

## 4. CP14 — logging และ production

| ทดสอบ | ผล |
|---|---|
| `NODE_ENV=development` | log แบบ morgan `dev` เช่น `GET /api/requests/REQ-001 200 0.916 ms - 321` |
| `NODE_ENV=production` | log แบบ `combined` เช่น `::ffff:127.0.0.1 - - [18/Oct/2026:05:02:13 +0000] "GET /nope HTTP/1.1" 404 58 "-" "-"` |
| production + error | `{"error":"ไม่พบเส้นทาง GET /nope"}` — **ไม่มี `stack`** ✅ |

## 5. Screenshot (`evidence/images/`)

| ไฟล์ | สถานะ |
|---|---|
| `network-cors-ok.png` | ☐ ต้องถ่ายจากเบราว์เซอร์ |
| `app-with-api.png` | ☐ ต้องถ่ายจากเบราว์เซอร์ |
| `error-state.png` | ☐ ต้องถ่ายจากเบราว์เซอร์ |
