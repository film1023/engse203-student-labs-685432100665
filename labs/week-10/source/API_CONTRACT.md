# API Contract — Campus Service Request API

**เวอร์ชัน:** 3.0.0 · **ปรับปรุง:** 18/10/2026 · **ข้อมูลเก็บใน:** SQLite (`api/data/campus.db`) · **Base URL:** `http://localhost:3001`
**รูปแบบข้อมูล:** JSON (`Content-Type: application/json`)

> **API Contract คืออะไร** — ข้อตกลงระหว่างคนทำ front-end กับคนทำ back-end
> ว่าจะคุยกันด้วย endpoint อะไร ส่งอะไรไป ได้อะไรกลับ
> มีไว้เพื่อให้สองฝั่ง**ทำงานคู่ขนานกันได้** โดยไม่ต้องรอกัน

---

## โครงสร้างข้อมูล Request

| field | ชนิด | คำอธิบาย | ตัวอย่าง |
|---|---|---|---|
| `id` | string | รหัสคำร้อง · ขึ้นต้นด้วย `REQ-` · เซิร์ฟเวอร์สร้างให้ | `"REQ-001"` |
| `requesterName` | string | ชื่อผู้แจ้ง · อย่างน้อย 2 ตัวอักษร | `"สมชาย ใจดี"` |
| `requestType` | string | ประเภท · 1 ใน 4 ค่าที่กำหนด | `"แจ้งซ่อม"` |
| `location` | string | สถานที่ · ห้ามว่าง | `"ห้องปฏิบัติการ 301"` |
| `details` | string | รายละเอียด · อย่างน้อย 10 ตัวอักษร | `"เครื่องปรับอากาศไม่ทำงาน"` |
| `priority` | string | `"normal"` หรือ `"urgent"` | `"urgent"` |
| `status` | string | `"pending"` · `"in-progress"` · `"completed"` | `"pending"` |

**ค่าที่ยอมรับของ `requestType`** — `แจ้งซ่อม` · `บริการบัญชีผู้ใช้` · `ขอใช้อุปกรณ์` · `อื่น ๆ`

---

## Endpoints

| Method | Endpoint | คำอธิบาย | Request body | สำเร็จ | ผิดพลาด |
|---|---|---|---|---|---|
| `GET` | `/api/requests` | ดูคำร้องทั้งหมด | — | `200` + array | — |
| `GET` | `/api/requests?status=` | กรองตามสถานะ | — | `200` + array | — |
| `GET` | `/api/requests/:id` | ดูคำร้องใบเดียว | — | `200` + object | `404` ไม่พบ |
| `POST` | `/api/requests` | สร้างคำร้องใหม่ | Request (ไม่ต้องมี `id`, `status`) | `201` + object ที่สร้าง | `400` ข้อมูลไม่ถูกต้อง |
| `PUT` | `/api/requests/:id` | เปลี่ยนสถานะ | `{ "status": "..." }` | `200` + object ที่แก้แล้ว | `400` สถานะผิด · `404` ไม่พบ |
| `DELETE` | `/api/requests/:id` | ลบคำร้อง | — | `204` ไม่มี body | `404` ไม่พบ |

---

## ตัวอย่างการเรียกใช้

### GET /api/requests

```http
GET /api/requests HTTP/1.1
Host: localhost:3001
```

```json
[
  {
    "id": "REQ-001",
    "requesterName": "สมชาย ใจดี",
    "requestType": "แจ้งซ่อม",
    "location": "ห้องปฏิบัติการ 301",
    "details": "เครื่องปรับอากาศไม่ทำงานตั้งแต่เช้า",
    "priority": "urgent",
    "status": "pending"
  }
]
```

### POST /api/requests

```http
POST /api/requests HTTP/1.1
Content-Type: application/json

{
  "requesterName": "สุภาวดี รักเรียน",
  "requestType": "ขอใช้อุปกรณ์",
  "location": "ห้องประชุม 2",
  "details": "ขอยืมโปรเจกเตอร์สำหรับนำเสนอ",
  "priority": "normal"
}
```

**201 Created**

```json
{
  "id": "REQ-MTYOA3MX-YEX9",
  "requesterName": "สุภาวดี รักเรียน",
  "requestType": "ขอใช้อุปกรณ์",
  "location": "ห้องประชุม 2",
  "details": "ขอยืมโปรเจกเตอร์สำหรับนำเสนอ",
  "priority": "normal",
  "status": "pending"
}
```

**400 Bad Request** — เมื่อข้อมูลไม่ถูกต้อง

```json
{
  "error": "ข้อมูลคำร้องไม่ถูกต้อง",
  "details": [
    "ชื่อผู้แจ้งต้องมีอย่างน้อย 2 ตัวอักษร",
    "รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร"
  ]
}
```

### PUT /api/requests/:id

```http
PUT /api/requests/REQ-001 HTTP/1.1
Content-Type: application/json

{ "status": "in-progress" }
```

**200 OK** — คืนคำร้องที่อัปเดตแล้ว

### DELETE /api/requests/:id

**204 No Content** — ไม่มี body ส่งกลับ

---

## รูปแบบ Error

ทุก error ตอบเป็น JSON ที่มี field `error` เสมอ

```json
{ "error": "ข้อความที่ผู้ใช้ทั่วไปอ่านเข้าใจ" }
```

กรณี validation จะมี `details` เพิ่มมาเป็น array บอกว่าผิดตรงไหนบ้าง

| Status | เมื่อไหร่ | ฝั่งไหนผิด |
|---|---|---|
| `400` | ข้อมูลที่ส่งมาไม่ถูกต้อง (รวมถึงฐานข้อมูลปฏิเสธด้วย FOREIGN KEY / CHECK / NOT NULL) | ผู้ใช้ |
| `404` | ไม่พบทรัพยากรที่ขอ | ผู้ใช้ |
| `409` | ข้อมูลซ้ำกับที่มีอยู่ (UNIQUE) | ผู้ใช้ |
| `500` | โค้ดเซิร์ฟเวอร์ผิดพลาด (เช่น ไม่พบตาราง) | เซิร์ฟเวอร์ |

### error จากฐานข้อมูลถูกแปลก่อนส่งออก

API **ไม่ส่งข้อความดิบของ SQLite** (เช่น `CHECK constraint failed: …`) ให้ client เพราะบอกโครงสร้างภายใน — ชั้น service แปลงเป็นข้อความภาษาไทยและ status ที่ถูกต้อง

| error จาก SQLite | status | ข้อความที่ client ได้ |
|---|---|---|
| `FOREIGN KEY constraint failed` | `400` | `อ้างถึงข้อมูลที่ไม่มีอยู่จริง` |
| `CHECK constraint failed` | `400` | `ค่าที่ส่งมาไม่อยู่ในรายการที่กำหนด` |
| `NOT NULL constraint failed` | `400` | `ข้อมูลที่จำเป็นยังไม่ครบ` |
| `UNIQUE constraint failed` | `409` | `ข้อมูลนี้มีอยู่แล้วในระบบ` |
| อื่น ๆ | `500` | `เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์` |

ในทางปฏิบัติ `validateRequest` ตรวจ body ก่อนถึงฐานข้อมูล จึงมักได้ `400` พร้อม `details` ก่อน · การแปล error ข้างบนเป็นด่านสุดท้ายเผื่อข้อมูลหลุด validation

> **ตอน production จะไม่ส่ง stack trace กลับไป** — เปิดเผยโครงสร้างภายในให้คนภายนอกเห็นไม่ได้

---

## CORS

API อนุญาตให้เรียกจาก origin ที่กำหนดใน `CORS_ORIGIN` เท่านั้น

```
Access-Control-Allow-Origin: http://localhost:5173
```

**ถ้าเรียกจาก origin อื่น** เบราว์เซอร์จะบล็อกก่อนที่โค้ดจะได้เห็น response — จะเห็น error ใน Console ว่าถูกบล็อกโดย CORS policy

> ⚠ CORS เป็นกลไกของ **เบราว์เซอร์** เท่านั้น · Postman และ curl ไม่ถูกบล็อก เพราะไม่ใช่เบราว์เซอร์

---

## Environment Variables

### ฝั่ง API (`api/.env`)

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|
| `PORT` | `3001` | พอร์ตที่ API รับคำขอ |
| `CORS_ORIGIN` | `http://localhost:5173` | origin ที่อนุญาตให้เรียก |
| `NODE_ENV` | `development` | `production` จะเปลี่ยนรูปแบบ log และซ่อน stack trace |

### ฝั่ง Frontend (`frontend/.env.local`)

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3001` | ที่อยู่ของ API |

> **ต้องขึ้นต้นด้วย `VITE_`** ไม่งั้น Vite จะไม่ส่งค่าไปให้โค้ดฝั่งเบราว์เซอร์
> และ**ห้าม commit ไฟล์ `.env`** — ใช้ `.env.example` เป็นตัวอย่างแทน

---

## การรันทั้งระบบ

ต้องเปิด **2 terminal** พร้อมกัน

```bash
# Terminal 1 — API
cd api && npm run dev          # http://localhost:3001

# Terminal 2 — Frontend
cd frontend && npm run dev     # http://localhost:5173
```

**ลำดับสำคัญ** — เปิด API ก่อนเสมอ ไม่งั้น frontend จะขึ้นข้อความว่าติดต่อเซิร์ฟเวอร์ไม่ได้

---

## Data Model (ฐานข้อมูล)

ข้อมูลเก็บใน SQLite 2 ตาราง ความสัมพันธ์ **หนึ่งต่อหลาย** (ผู้ใช้ 1 คน → หลายคำร้อง) · สร้างจาก `api/data/schema.sql` ด้วย `npm run db:setup` (`npm run db:reset` เพื่อล้างกลับเป็นข้อมูลตั้งต้น)

### `users`

| คอลัมน์ | ชนิด | ข้อกำหนด |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `name` | TEXT | NOT NULL |
| `department` | TEXT | NOT NULL |
| `email` | TEXT | NOT NULL UNIQUE |

### `requests`

| คอลัมน์ | ชนิด | ข้อกำหนด |
|---|---|---|
| `id` | TEXT | PRIMARY KEY · รูปแบบ `REQ-001` |
| `requester_id` | INTEGER | NOT NULL · FOREIGN KEY → `users(id)` |
| `request_type` | TEXT | NOT NULL · CHECK `แจ้งซ่อม` / `บริการบัญชีผู้ใช้` / `ขอใช้อุปกรณ์` / `อื่น ๆ` |
| `location` | TEXT | NOT NULL |
| `details` | TEXT | NOT NULL |
| `priority` | TEXT | NOT NULL DEFAULT `normal` · CHECK `normal` / `urgent` |
| `status` | TEXT | NOT NULL DEFAULT `pending` · CHECK `pending` / `in-progress` / `completed` |
| `created_at` | TEXT | NOT NULL DEFAULT เวลาปัจจุบัน |

Index: `idx_requests_status(status)` · `idx_requests_requester(requester_id)`

### ⚠ โครงสร้างในฐานข้อมูลไม่เหมือนรูปแบบที่ API ส่งออก

| ฐานข้อมูล | API (JSON) | ทำไม |
|---|---|---|
| `requester_id` (ตัวเลข) | `requesterName` (ชื่อ) | ฐานข้อมูลเก็บ id เพื่อไม่ให้ชื่อซ้ำหลายที่ · frontend ต้องการชื่อไปแสดง |
| `request_type` | `requestType` | ฐานข้อมูลใช้ `snake_case` · JavaScript ใช้ `camelCase` |
| `created_at` | (ไม่ส่งออก) | ยังไม่มีหน้าจอที่ใช้ — คงรูปแบบเดิมของ Week 07 ไว้ |

**ชั้น service เป็นตัวแปลง** ด้วย `JOIN users` และ `AS` (`u.name AS requesterName`, `r.request_type AS requestType`) จึงไม่ต้องแก้ controller, route หรือ React

### ⭐ พฤติกรรมของ `POST /api/requests` ที่ต้องรู้

> **ถ้าส่ง `requesterName` ที่ยังไม่มีในระบบ API จะสร้างผู้ใช้ใหม่ให้อัตโนมัติ**

- จับคู่ด้วย **ชื่อตรงตัวอักษรทุกตัว** (ตัดช่องว่างหัวท้ายแล้ว) — `"สมชาย ใจดี"` ใช้ผู้ใช้เดิม แต่ `"สมชาย  ใจดี"` (เว้นวรรคสองที) หรือพิมพ์ผิดจะ **กลายเป็นผู้ใช้ใหม่**
- ผู้ใช้ที่สร้างอัตโนมัติได้ `department = "ไม่ระบุ"` และอีเมลชั่วคราว `user-<สุ่ม>@rmutl.ac.th`
- การสร้างผู้ใช้ + คำร้องอยู่ใน **transaction เดียว** — ถ้าบันทึกคำร้องไม่สำเร็จ ผู้ใช้ใหม่จะถูกยกเลิกด้วย ไม่มีผู้ใช้ค้าง
- `id` คำร้องใหม่ = เลขมากที่สุดที่มีอยู่ + 1 (`REQ-011`, `REQ-012`, …)

---

## ⭐ Endpoint สำหรับผู้ใช้

| Method | Endpoint | ทำอะไร | สำเร็จ | ผิดพลาด |
|---|---|---|---|---|
| `GET` | `/api/users` | รายชื่อผู้ใช้ทั้งหมด พร้อม `requestCount` (รวมคนที่ยังไม่เคยแจ้ง = 0) | `200` | — |
| `GET` | `/api/users/:id/requests` | คำร้องทั้งหมดของผู้ใช้คนนั้น (รูปแบบเดียวกับ `/api/requests`) | `200` | `404` ไม่พบผู้ใช้ |

```json
// GET /api/users
[
  { "id": 1, "name": "สมชาย ใจดี", "department": "วิศวกรรมซอฟต์แวร์", "requestCount": 3 },
  { "id": 5, "name": "วรเชษฐ์ มั่นคง", "department": "วิศวกรรมเครื่องกล", "requestCount": 0 }
]
```

---

## ความปลอดภัย — SQL Injection

ทุก query ที่รับค่าจากผู้ใช้ส่งค่าผ่าน placeholder `?` · ค่า `?status=x' OR '1'='1` จึงถูกตีความเป็น **ข้อความ** ไม่ใช่คำสั่ง SQL และคืน `[]` · รายละเอียดการทดสอบดู `evidence/SECURITY_TEST.md`

---

## ประวัติการเปลี่ยนแปลง

| เวอร์ชัน | สัปดาห์ | เปลี่ยนอะไร | Breaking? |
|---|---|---|:---:|
| 1.0.0 | Week 06 | GET, POST, DELETE · ข้อมูลในหน่วยความจำ | — |
| 2.0.0 | Week 07 | เพิ่ม PUT · CORS · env config | ไม่ |
| 3.0.0 | Week 10 | ย้ายข้อมูลไป SQLite · POST สร้างผู้ใช้อัตโนมัติ · error จากฐานข้อมูลตอบ 400/409 · เพิ่ม `/api/users` · ข้อมูลไม่หายเมื่อรีสตาร์ต | ไม่ — รูปแบบ JSON เหมือนเดิมทุก endpoint |
