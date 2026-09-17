## API_TEST.md

| # | Method | Path | ส่งอะไร | status ที่ได้ | ผ่าน |
|---|---|---|---|---|---|
| 1 | GET | `/api/requests` | — | 200 | ☑ |
| 2 | GET | `/api/requests/REQ-001` | — | 200 | ☑ |
| 3 | GET | `/api/requests/REQ-999` | — | 404 | ☑ |
| 4 | POST | `/api/requests` | ข้อมูลครบ | 201 | ☑ |
| 5 | POST | `/api/requests` | ข้อมูลไม่ครบ | 400 | ☑ |
| 6 | DELETE | `/api/requests/REQ-003` | — | 204 | ☑ |
| 7 | DELETE | `/api/requests/REQ-999` | — | 404 | ☑ |
| 8 | GET | `/api/unknown` | — | 404| ☑ |
