import { db } from "./db";
import { users, groups, groupMembers, tasks, submissions, announcements } from "./schema";
import { eq, and, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import type { User, InsertUser, Group, InsertGroup, Task, InsertTextTask, Submission, InsertSubmission, Announcement, InsertAnnouncement } from "@shared/schema";

export class Storage {
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      id: randomUUID(),
      name: data.name,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 10),
      role: data.role,
    }).returning();
    return user as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user as User | undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user as User | undefined;
  }

  async createGroup(ownerId: string, data: InsertGroup): Promise<Group> {
    const [group] = await db.insert(groups).values({
      id: randomUUID(),
      name: data.name,
      ownerId,
      joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    }).returning();
    return group as Group;
  }

  async getGroupById(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
    return group as Group | undefined;
  }

  async getGroupByJoinCode(joinCode: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.joinCode, joinCode)).limit(1);
    return group as Group | undefined;
  }

  async getGroupsForUser(userId: string, role: string): Promise<Group[]> {
    if (role === "teacher") {
      return await db.select().from(groups).where(eq(groups.ownerId, userId));
    }
    const memberGroups = await db.select({ groupId: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.userId, userId));
    if (memberGroups.length === 0) return [];
    return await db.select().from(groups).where(inArray(groups.id, memberGroups.map(m => m.groupId)));
  }

  async getGroupMembers(groupId: string): Promise<User[]> {
    const memberIds = await db.select({ userId: groupMembers.userId }).from(groupMembers).where(eq(groupMembers.groupId, groupId));
    const users_list: User[] = [];
    for (const { userId } of memberIds) {
      const user = await this.getUserById(userId);
      if (user) users_list.push(user);
    }
    return users_list;
  }

  async isMemberOfGroup(groupId: string, userId: string): Promise<boolean> {
    const [member] = await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))).limit(1);
    return !!member;
  }

  async addMemberToGroup(groupId: string, userId: string): Promise<void> {
    if (!(await this.isMemberOfGroup(groupId, userId))) {
      await db.insert(groupMembers).values({ id: randomUUID(), groupId, userId });
    }
  }

  async removeMemberFromGroup(groupId: string, userId: string): Promise<void> {
    await db.delete(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  }

  async deleteGroup(groupId: string): Promise<void> {
    await db.delete(groups).where(eq(groups.id, groupId));
  }

  async createTask(groupId: string, data: InsertTextTask, fileUrl?: string): Promise<Task> {
    const [task] = await db.insert(tasks).values({
      id: randomUUID(),
      groupId: data.groupId,
      title: data.title,
      description: data.description,
      taskType: data.taskType,
      dueDate: data.dueDate,
      fileUrl: fileUrl || null,
    }).returning();
    return task as Task;
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return task as Task | undefined;
  }

  async getTasksForGroup(groupId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.groupId, groupId));
  }

  async getTasksForStudent(studentId: string): Promise<Task[]> {
    const memberGroups = await db.select({ groupId: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.userId, studentId));
    if (memberGroups.length === 0) return [];
    return await db.select().from(tasks).where(inArray(tasks.groupId, memberGroups.map(m => m.groupId)));
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async createSubmission(data: InsertSubmission, studentId: string, fileUrl?: string): Promise<Submission> {
    const [submission] = await db.insert(submissions).values({
      id: randomUUID(),
      taskId: data.taskId,
      studentId,
      textContent: data.textContent || null,
      fileUrl: fileUrl || null,
      submittedAt: new Date().toISOString(),
      score: null,
    }).returning();
    return submission as Submission;
  }

  async getSubmissionForTask(taskId: string, studentId: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(and(eq(submissions.taskId, taskId), eq(submissions.studentId, studentId))).limit(1);
    return submission as Submission | undefined;
  }

  async getSubmissionById(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
    return submission as Submission | undefined;
  }

  async getSubmissionsForTask(taskId: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.taskId, taskId));
  }

  async getSubmissionsForGroup(groupId: string): Promise<Submission[]> {
    const groupTasks = await this.getTasksForGroup(groupId);
    if (groupTasks.length === 0) return [];
    return await db.select().from(submissions).where(inArray(submissions.taskId, groupTasks.map(t => t.id)));
  }

  async getAllSubmissionsForTeacher(teacherId: string): Promise<Submission[]> {
    const teacherGroups = await db.select().from(groups).where(eq(groups.ownerId, teacherId));
    if (teacherGroups.length === 0) return [];
    const groupTasks = await db.select().from(tasks).where(inArray(tasks.groupId, teacherGroups.map(g => g.id)));
    if (groupTasks.length === 0) return [];
    return await db.select().from(submissions).where(inArray(submissions.taskId, groupTasks.map(t => t.id)));
  }

  async updateSubmissionScore(submissionId: string, score: number): Promise<Submission> {
    await db.update(submissions).set({ score }).where(eq(submissions.id, submissionId));
    return (await this.getSubmissionById(submissionId))!;
  }

  async createAnnouncement(data: InsertAnnouncement, teacherId: string): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values({
      id: randomUUID(),
      groupId: data.groupId,
      teacherId,
      message: data.message,
      createdAt: new Date().toISOString(),
    }).returning();
    return announcement as Announcement;
  }

  async getAnnouncementsForGroup(groupId: string): Promise<Announcement[]> {
    return await db.select().from(announcements).where(eq(announcements.groupId, groupId));
  }

  async getAnalyticsForTeacher(teacherId: string): Promise<any> {
    const teacherGroups = await db.select().from(groups).where(eq(groups.ownerId, teacherId));
    if (teacherGroups.length === 0) return { totalGroups: 0, totalTasks: 0, totalSubmissions: 0, averageScore: 0, submissionRate: 0, groupStats: [] };

    const groupIds = teacherGroups.map(g => g.id);
    const groupTasks = await db.select().from(tasks).where(inArray(tasks.groupId, groupIds));
    if (groupTasks.length === 0) return { totalGroups: teacherGroups.length, totalTasks: 0, totalSubmissions: 0, averageScore: 0, submissionRate: 0, groupStats: [] };

    const taskIds = groupTasks.map(t => t.id);
    const allSubs = await db.select().from(submissions).where(inArray(submissions.taskId, taskIds));
    
    let totalScore = 0, gradedCount = 0;
    allSubs.forEach(sub => {
      if (sub.score !== null) { totalScore += sub.score; gradedCount++; }
    });

    const groupStats = teacherGroups.map(group => {
      const groupTaskList = groupTasks.filter(t => t.groupId === group.id);
      const groupTaskIds = groupTaskList.map(t => t.id);
      let groupScore = 0, groupGradedCount = 0, groupSubmissions = 0;
      
      if (groupTaskIds.length > 0) {
        const groupSubs = allSubs.filter(s => groupTaskIds.includes(s.taskId));
        groupSubmissions = groupSubs.length;
        groupSubs.forEach(sub => {
          if (sub.score !== null) { groupScore += sub.score; groupGradedCount++; }
        });
      }

      return {
        groupName: group.name,
        submissionRate: groupTaskList.length > 0 ? Math.round((groupSubmissions / (groupTaskList.length * 3)) * 100) : 0,
        averageScore: groupGradedCount > 0 ? Math.round(groupScore / groupGradedCount) : 0,
        taskCount: groupTaskList.length,
      };
    });

    return {
      totalGroups: teacherGroups.length,
      totalTasks: groupTasks.length,
      totalSubmissions: allSubs.length,
      averageScore: gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0,
      submissionRate: groupTasks.length > 0 ? Math.round((allSubs.length / (groupTasks.length * 3)) * 100) : 0,
      groupStats,
    };
  }

  async getAnalyticsForStudent(studentId: string): Promise<any> {
    const tasks_list = await this.getTasksForStudent(studentId);
    if (tasks_list.length === 0) return { totalGroups: 0, totalTasks: 0, totalSubmissions: 0, averageScore: 0, submissionRate: 0, groupStats: [] };

    const taskIds = tasks_list.map(t => t.id);
    const subs = await db.select().from(submissions).where(inArray(submissions.taskId, taskIds));
    const studentSubs = subs.filter(s => s.studentId === studentId);

    let totalScore = 0, gradedCount = 0;
    studentSubs.forEach(sub => {
      if (sub.score !== null) { totalScore += sub.score; gradedCount++; }
    });

    return {
      totalGroups: 0,
      totalTasks: tasks_list.length,
      totalSubmissions: studentSubs.length,
      averageScore: gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0,
      submissionRate: tasks_list.length > 0 ? Math.round((studentSubs.length / tasks_list.length) * 100) : 0,
      groupStats: [],
    };
  }

  async getTeacherStats(teacherId: string): Promise<any> {
    const teacherGroups = await db.select().from(groups).where(eq(groups.ownerId, teacherId));
    if (teacherGroups.length === 0) return { pendingSubmissions: 0, totalTasks: 0 };

    const groupIds = teacherGroups.map(g => g.id);
    const groupTasks = await db.select().from(tasks).where(inArray(tasks.groupId, groupIds));
    if (groupTasks.length === 0) return { pendingSubmissions: 0, totalTasks: 0 };

    const taskIds = groupTasks.map(t => t.id);
    const allSubs = await db.select().from(submissions).where(inArray(submissions.taskId, taskIds));
    
    return {
      pendingSubmissions: allSubs.filter(s => s.score === null).length,
      totalTasks: groupTasks.length,
    };
  }
}

export const storage = new Storage();
