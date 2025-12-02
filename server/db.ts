import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlite = new Database(path.join(__dirname, "..", "classroom.db"));
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Initialize schema - run each CREATE TABLE statement separately
const createTableStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    join_code TEXT NOT NULL UNIQUE
  )`,
  `CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    UNIQUE(group_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    group_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    task_type TEXT NOT NULL DEFAULT 'text_file',
    due_date TEXT NOT NULL,
    file_url TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    text_content TEXT,
    file_url TEXT,
    submitted_at TEXT NOT NULL,
    score INTEGER,
    UNIQUE(task_id, student_id)
  )`,
  `CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS announcement_reads (
    id TEXT PRIMARY KEY,
    announcement_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    UNIQUE(announcement_id, student_id)
  )`,
  `CREATE TABLE IF NOT EXISTS reminder_dismissals (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    dismissed_at TEXT NOT NULL,
    UNIQUE(task_id, student_id)
  )`,
];

for (const statement of createTableStatements) {
  sqlite.exec(statement);
}
