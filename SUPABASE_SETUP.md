# Supabase Setup Guide

Your Supabase project URL: `https://fafdexkeiskssrklqhyr.supabase.co`

## Step 1: Create Database Tables

1. Go to: https://app.supabase.com → Your Project → SQL Editor
2. Click "New Query"
3. Copy and paste the SQL from `supabase-schema.sql` below
4. Click "Run"

## Step 2: Create Storage Buckets

1. Go to: https://app.supabase.com → Your Project → Storage
2. Create new bucket named: `task-attachments` (set to Public)
3. Create new bucket named: `submission-files` (set to Public)

## Step 3: Start the App

Once tables and buckets are created, the app will start automatically!

---

## SQL to Run in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('teacher', 'student'))
);

CREATE TABLE IF NOT EXISTS public.groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  join_code TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES public.groups(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'text_file' CHECK(task_type IN ('text_file')),
  due_date TEXT NOT NULL,
  file_url TEXT
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text_content TEXT,
  file_url TEXT,
  submitted_at TEXT NOT NULL,
  score INTEGER,
  UNIQUE(task_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id TEXT PRIMARY KEY,
  announcement_id TEXT NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  UNIQUE(announcement_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.reminder_dismissals (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dismissed_at TEXT NOT NULL,
  UNIQUE(task_id, student_id)
);
```

---

**Test Credentials (auto-created after setup):**
- Teacher: `teprathna@gmail.com` / `teacher123`
- Student: `rathna@gmail.com` / `student123`
