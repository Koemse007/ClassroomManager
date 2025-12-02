import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
});

export const groups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull(),
  joinCode: text("join_code").notNull().unique(),
});

export const groupMembers = sqliteTable("group_members", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull(),
  userId: text("user_id").notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  groupId: text("group_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  taskType: text("task_type").notNull().default("text_file"),
  dueDate: text("due_date").notNull(),
  fileUrl: text("file_url"),
});

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull(),
  studentId: text("student_id").notNull(),
  textContent: text("text_content"),
  fileUrl: text("file_url"),
  submittedAt: text("submitted_at").notNull(),
  score: integer("score"),
});

export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull(),
  teacherId: text("teacher_id").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
});

export const announcementReads = sqliteTable("announcement_reads", {
  id: text("id").primaryKey(),
  announcementId: text("announcement_id").notNull(),
  studentId: text("student_id").notNull(),
});

export const reminderDismissals = sqliteTable("reminder_dismissals", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull(),
  studentId: text("student_id").notNull(),
  dismissedAt: text("dismissed_at").notNull(),
});
