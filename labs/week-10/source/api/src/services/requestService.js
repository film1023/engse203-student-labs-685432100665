import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync } from 'node:fs';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Week 10 — service อ่าน/เขียนฐานข้อมูล SQLite (node:sqlite)
 * ⚠ signature ของทุกฟังก์ชันเหมือน Week 07 → controller และ frontend ไม่ต้องแก้
 * ⚠ ค่าจากผู้ใช้ส่งผ่าน ? เสมอ — ไม่ต่อ string เข้า SQL (กัน SQL injection)
 */

let db;

// path อ้างจากตำแหน่งไฟล์นี้ ไม่ใช่จากที่รันคำสั่ง
const HERE = path.dirname(fileURLToPath(import.meta.url));
const API_ROOT = path.resolve(HERE, '../..');
const SCHEMA_FILE = path.join(API_ROOT, 'data', 'schema.sql');
// อ่านตอนเรียก loadSeed() เพื่อให้ test ตั้ง DB_FILE เป็นฐานข้อมูลแยกได้
const dbFile = () => (process.env.DB_FILE
  ? path.resolve(process.cwd(), process.env.DB_FILE)
  : path.join(API_ROOT, 'data', 'campus.db'));

// SELECT_SHAPE เป็นโค้ดของเราเอง เขียนตายตัว — ต่อ string ได้ปลอดภัย
const SELECT_SHAPE = `
  SELECT r.id,
         u.name          AS requesterName,
         r.request_type  AS requestType,
         r.location,
         r.details,
         r.priority,
         r.status
  FROM requests r
  JOIN users u ON u.id = r.requester_id`;

/** CP32 · แปลง error จากฐานข้อมูลเป็นภาษาคน + status ที่ถูกต้อง */
function toAppError(err) {
  const m = err?.message ?? '';
  if (m.includes('FOREIGN KEY')) return new AppError('อ้างถึงข้อมูลที่ไม่มีอยู่จริง', 400);
  if (m.includes('CHECK'))       return new AppError('ค่าที่ส่งมาไม่อยู่ในรายการที่กำหนด', 400);
  if (m.includes('NOT NULL'))    return new AppError('ข้อมูลที่จำเป็นยังไม่ครบ', 400);
  if (m.includes('UNIQUE'))      return new AppError('ข้อมูลนี้มีอยู่แล้วในระบบ', 409);
  return err;   // error อื่น (เช่น no such table) ปล่อยผ่าน → errorHandler ตอบ 500
}

export async function loadSeed() {
  if (db?.isOpen) db.close();
  db = new DatabaseSync(dbFile());
  db.exec('PRAGMA foreign_keys = ON');   // ⚠ ไม่เปิด = Foreign Key เงียบไม่ทำงาน

  const ready = db.prepare(
    "SELECT COUNT(*) c FROM sqlite_master WHERE type='table' AND name='requests'"
  ).get().c;
  if (!ready && existsSync(SCHEMA_FILE)) {
    db.exec(readFileSync(SCHEMA_FILE, 'utf8'));
  }
}

export function findAll({ status } = {}) {
  return status
    ? db.prepare(`${SELECT_SHAPE} WHERE r.status = ? ORDER BY r.id`).all(status)
    : db.prepare(`${SELECT_SHAPE} ORDER BY r.id`).all();
}

export function findById(id) {
  return db.prepare(`${SELECT_SHAPE} WHERE r.id = ?`).get(id) ?? null;
}

/** ชื่อ → users.id · ถ้ายังไม่มีชื่อนี้ในระบบ สร้างผู้ใช้ใหม่ให้อัตโนมัติ */
function resolveUserId(name) {
  const found = db.prepare('SELECT id FROM users WHERE name = ?').get(name);
  if (found) return found.id;

  const slug = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return db
    .prepare('INSERT INTO users (name, department, email) VALUES (?, ?, ?)')
    .run(name, 'ไม่ระบุ', `user-${slug}@rmutl.ac.th`)
    .lastInsertRowid;
}

function nextId() {
  // เรียงด้วยเลขจริง ไม่ใช่ข้อความ — REQ-1000 ต้องมากกว่า REQ-999
  const row = db.prepare(
    "SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) n FROM requests WHERE id LIKE 'REQ-%'"
  ).get();
  return `REQ-${String((row?.n ?? 0) + 1).padStart(3, '0')}`;
}

export function create(input) {
  const id = nextId();
  // ⭐ transaction — ถ้า INSERT คำร้องล้มเหลว ผู้ใช้ใหม่ที่เพิ่งสร้างต้องถูกยกเลิกด้วย
  db.exec('BEGIN');
  try {
    const requesterId = resolveUserId(input.requesterName.trim());
    db.prepare(
      `INSERT INTO requests (id, requester_id, request_type, location, details, priority)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, requesterId, input.requestType, input.location.trim(),
          input.details.trim(), input.priority ?? 'normal');
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw toAppError(err);
  }
  return findById(id);
}

export function updateStatus(id, status) {
  try {
    const result = db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(status, id);
    return result.changes ? findById(id) : null;
  } catch (err) {
    throw toAppError(err);
  }
}

export function remove(id) {
  const target = findById(id);
  if (!target) return null;
  db.prepare('DELETE FROM requests WHERE id = ?').run(id);
  return target;
}

// ── ⭐ users ──
export function findAllUsers() {
  return db.prepare(
    `SELECT u.id, u.name, u.department, COUNT(r.id) AS requestCount
     FROM users u LEFT JOIN requests r ON r.requester_id = u.id
     GROUP BY u.id ORDER BY u.id`
  ).all();
}

export function findUserById(id) {
  return db.prepare('SELECT id, name, department FROM users WHERE id = ?').get(id) ?? null;
}

export function findByRequester(userId) {
  return db.prepare(`${SELECT_SHAPE} WHERE r.requester_id = ? ORDER BY r.id`).all(userId);
}
