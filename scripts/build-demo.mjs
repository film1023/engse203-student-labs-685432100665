#!/usr/bin/env node
/**
 * build-demo.mjs — build หน้า React ของ LAB full-stack ใส่ labs/<week>/publish/ ให้เปิดบน GitHub Pages ได้
 *
 * GitHub Pages รันได้แค่ไฟล์ static — Express API + SQLite รันบนนั้นไม่ได้ จึงมี 2 โหมด
 *
 *   node scripts/build-demo.mjs                     โหมดเดโม: จำลอง API ในเบราว์เซอร์ (localStorage)
 *   node scripts/build-demo.mjs week-07 week-11     เฉพาะบาง LAB
 *   node scripts/build-demo.mjs --api https://campus-service-xxxx.onrender.com
 *                                                   ต่อ API จริงที่ deploy ไว้ (API ต้องตั้ง CORS_ORIGIN=https://film1023.github.io)
 *
 * ⚠ ไม่แก้โค้ดของ LAB — คัดลอก frontend ไปโฟลเดอร์ชั่วคราว สลับ apiClient.js เฉพาะในสำเนา แล้ว build
 * เสร็จแล้วรัน: npm run build:pages
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { ROOT, readJson } from './common.mjs';

const LABS = {
  'week-07': { app: 'labs/week-07/source', seed: 'json' },
  'week-10': { app: 'labs/week-10/source', seed: 'db' },
  'week-11': { app: 'labs/week-11/source', seed: 'db' },
  'week-12': { app: 'labs/week-12/lab12/source', seed: 'db' },
  'week-13': { app: 'labs/week-13/lab13/starter', seed: 'db' },
};

const args = process.argv.slice(2);
const apiIdx = args.indexOf('--api');
const apiUrl = apiIdx >= 0 ? String(args[apiIdx + 1] ?? '').replace(/\/+$/, '') : '';
if (apiIdx >= 0 && !/^https:\/\//.test(apiUrl)) throw new Error('--api ต้องเป็น URL https://...');
const weeks = args.filter((a, i) => /^week-\d{2}$/.test(a) && (apiIdx < 0 || i !== apiIdx + 1));
const selected = weeks.length ? weeks : Object.keys(LABS);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(cmd, cmdArgs, cwd, env = {}) {
  const r = spawnSync(cmd, cmdArgs, { cwd, stdio: 'inherit', env: { ...process.env, ...env }, shell: process.platform === 'win32' });
  if (r.status !== 0) throw new Error(`${cmd} ${cmdArgs.join(' ')} ล้มเหลว (${cwd})`);
}

/** ข้อมูลตั้งต้น — อ่านจากฐานข้อมูลจริงของ LAB ด้วย query เดียวกับ service */
function loadSeed(appDir, kind) {
  if (kind === 'json') return JSON.parse(fs.readFileSync(path.join(appDir, 'api/data/initialRequests.json'), 'utf8'));
  const db = new DatabaseSync(path.join(appDir, 'api/data/campus.db'), { readOnly: true });
  const rows = db.prepare(`SELECT r.id, u.name AS requesterName, r.request_type AS requestType,
      r.location, r.details, r.priority, r.status
    FROM requests r JOIN users u ON u.id = r.requester_id ORDER BY r.id`).all();
  db.close();
  return rows.map((r) => ({ ...r }));
}

/** กฎตรวจข้อมูล — อ่านรายการประเภทจาก validator ของ LAB นั้น ให้เดโมตอบเหมือน API จริง */
function loadRequestTypes(appDir) {
  for (const f of ['api/src/validators/requestValidator.js', 'api/src/middleware/validateRequest.js']) {
    const p = path.join(appDir, f);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, 'utf8').match(/REQUEST_TYPES\s*=\s*\[([^\]]+)\]/);
    if (m) return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  }
  return ['แจ้งซ่อม', 'บริการบัญชีผู้ใช้', 'ขอใช้อุปกรณ์', 'อื่น ๆ'];
}

function demoApiClient(week, seed, types) {
  return `/**
 * apiClient.js — เวอร์ชันเดโมสำหรับ GitHub Pages (สร้างโดย scripts/build-demo.mjs · ไม่ใช่โค้ดของ LAB)
 * จำลอง Express API ในเบราว์เซอร์ · ข้อมูลเก็บใน localStorage ของผู้เปิด · ตอบรูปแบบเดียวกับ API จริง
 */
export class ApiError extends Error {
  constructor(message, status) { super(message); this.name = 'ApiError'; this.status = status; }
}
export function getAuthToken() { return null; }
export function setAuthToken() {}
export function clearAuthToken() {}

const KEY = 'campus-demo-${week}';
const SEED = ${JSON.stringify(seed)};
const TYPES = ${JSON.stringify(types)};
const STATUSES = ['pending', 'in-progress', 'completed'];

function load() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(v)) return v; } catch { /* ใช้ seed */ }
  return structuredClone(SEED);
}
function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* private mode */ } }
const text = (v) => (typeof v === 'string' ? v.trim() : '');

function validate(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return ['ต้องส่งข้อมูลคำร้องมาด้วย'];
  const e = [];
  if (text(b.requesterName).length < 2) e.push('ชื่อผู้แจ้งต้องมีอย่างน้อย 2 ตัวอักษร');
  if (!TYPES.includes(b.requestType)) e.push('ประเภทคำร้องไม่ถูกต้อง');
  if (!text(b.location)) e.push('กรุณาระบุสถานที่');
  if (text(b.details).length < 10) e.push('รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร');
  if (!['normal', 'urgent'].includes(b.priority)) e.push('ความเร่งด่วนต้องเป็น normal หรือ urgent');
  return e;
}
function nextId(list) {
  const max = Math.max(0, ...list.map((r) => Number(String(r.id).replace(/^REQ-/, '')) || 0));
  return 'REQ-' + String(max + 1).padStart(3, '0');
}

export async function apiFetch(apiPath, options = {}) {
  await new Promise((r) => setTimeout(r, 150));   // ให้เห็นสถานะ loading เหมือนเรียกผ่านเครือข่าย
  const method = (options.method ?? 'GET').toUpperCase();
  const url = new URL(apiPath, 'http://demo.local');
  const parts = url.pathname.split('/').filter(Boolean);   // ['api','requests',':id']
  const body = options.body ? JSON.parse(options.body) : undefined;
  const list = load();

  if (parts[1] === 'health') return { status: 'ok', env: 'demo', database: { connected: true, driver: 'localStorage' } };
  if (parts[0] !== 'api' || parts[1] !== 'requests') throw new ApiError('ไม่พบเส้นทาง ' + method + ' ' + url.pathname, 404);
  const id = parts[2] ? decodeURIComponent(parts[2]) : null;

  if (!id && method === 'GET') {
    const s = url.searchParams.get('status');
    return structuredClone(s ? list.filter((r) => r.status === s) : list);
  }
  if (!id && method === 'POST') {
    const errors = validate(body);
    if (errors.length) { const err = new ApiError('ข้อมูลคำร้องไม่ถูกต้อง', 400); err.details = errors; throw err; }
    const created = { id: nextId(list), requesterName: text(body.requesterName), requestType: body.requestType,
      location: text(body.location), details: text(body.details), priority: body.priority, status: 'pending' };
    list.push(created); save(list); return structuredClone(created);
  }
  const found = list.find((r) => r.id === id);
  if (method === 'GET') { if (!found) throw new ApiError('ไม่พบคำร้องรหัส ' + id, 404); return structuredClone(found); }
  if (method === 'PUT') {
    if (!STATUSES.includes(body?.status)) throw new ApiError('สถานะต้องเป็น pending, in-progress หรือ completed', 400);
    if (!found) throw new ApiError('ไม่พบคำร้องรหัส ' + id, 404);
    found.status = body.status; save(list); return structuredClone(found);
  }
  if (method === 'DELETE') {
    if (!found) throw new ApiError('ไม่พบคำร้องรหัส ' + id, 404);
    save(list.filter((r) => r.id !== id)); return null;
  }
  throw new ApiError('ไม่รองรับ ' + method, 405);
}

/** ล้างข้อมูลเดโมกลับเป็นค่าตั้งต้น */
if (typeof window !== 'undefined') window.resetCampusDemo = () => { localStorage.removeItem(KEY); location.reload(); };
`;
}

for (const week of selected) {
  const cfg = LABS[week];
  if (!cfg) { console.log(`ข้าม ${week} — ไม่มีหน้าเว็บ (ใช้ evidence report)`); continue; }
  const appDir = path.join(ROOT, cfg.app);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `demo-${week}-`));
  console.log(`\n▶ ${week} → ${apiUrl ? 'API ' + apiUrl : 'โหมดเดโม'}`);

  fs.cpSync(path.join(appDir, 'frontend'), tmp, {
    recursive: true,
    filter: (src) => !/[\\/](node_modules|dist)([\\/]|$)/.test(path.relative(appDir, src)) && !/\.env(\.local)?$/.test(src),
  });
  if (!apiUrl) {
    fs.writeFileSync(path.join(tmp, 'src/services/apiClient.js'),
      demoApiClient(week, loadSeed(appDir, cfg.seed), loadRequestTypes(appDir)), 'utf8');
  }
  fs.writeFileSync(path.join(tmp, '.env.production'), `VITE_API_BASE_URL=${apiUrl}\n`, 'utf8');

  run(npm, ['ci', '--no-audit', '--no-fund', '--loglevel=error'], tmp);
  run(process.execPath, [path.join(tmp, 'node_modules/vite/bin/vite.js'), 'build', '--logLevel', 'warn'], tmp, { NODE_ENV: 'production' });

  const target = path.join(ROOT, 'labs', week, 'publish');
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(path.join(tmp, 'dist'), target, { recursive: true });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`✓ ${week} → ${path.relative(ROOT, target)}/`);
}
console.log('\nต่อไป: npm run build:pages');
