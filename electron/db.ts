import Database from 'better-sqlite3';
import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.join(app.getPath('userData'), 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'write-along.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

export function saveProject(id: string, title: string, data: string): void {
  const stmt = db.prepare(`
    INSERT INTO projects(id, title, data, updated_at)
    VALUES(?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET title=excluded.title, data=excluded.data, updated_at=excluded.updated_at
  `);
  stmt.run(id, title, data, new Date().toISOString());
}

export function loadProjects(): Array<{ id: string; title: string; data: string; updated_at: string }> {
  return db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all() as any;
}

export function saveSetting(key: string, value: string): void {
  db.prepare(`INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run(key, value);
}

export function loadSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}
