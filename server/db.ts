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
