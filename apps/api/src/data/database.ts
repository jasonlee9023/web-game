import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { env } from '../config/env';

type DatabaseRow = {
  value: string;
};

class SQLiteJsonDatabase {
  private readonly db: DatabaseSync;

  constructor(filePath: string) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    this.db = new DatabaseSync(filePath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  get<T>(key: string, fallback: T): T {
    const row = this.db.prepare('SELECT value FROM app_state WHERE key = ?').get(key) as DatabaseRow | undefined;
    if (!row) {
      const initial = structuredClone(fallback);
      this.set(key, initial);
      return initial;
    }

    try {
      return JSON.parse(row.value) as T;
    } catch {
      const initial = structuredClone(fallback);
      this.set(key, initial);
      return initial;
    }
  }

  set<T>(key: string, value: T) {
    this.db
      .prepare(
        `
          INSERT INTO app_state (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = CURRENT_TIMESTAMP
        `,
      )
      .run(key, JSON.stringify(value));
  }
}

const databaseBaseDir = process.env.INIT_CWD ?? process.cwd();
const databasePath = path.isAbsolute(env.databasePath) ? env.databasePath : path.resolve(databaseBaseDir, env.databasePath);

export const database = new SQLiteJsonDatabase(databasePath);
