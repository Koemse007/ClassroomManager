import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { insertUserSchema, loginSchema, insertGroupSchema, joinGroupSchema, insertTextTaskSchema, insertSubmissionSchema, insertAnnouncementSchema, updateScoreSchema } from "@shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");
const JWT_SECRET = process.env.SESSION_SECRET || "classroom-management-secret-key";

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => cb(null, `${randomUUID()}-${file.originalname}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
    const valid = allowed.test(file.originalname.split(".").pop()?.toLowerCase() || "") || allowed.test(file.mimetype);
    cb(valid ? null : new Error("Invalid file type"), valid);
  },
});

const uploadErrorHandler = (err: any, _req: any, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File size exceeds 10MB limit" });
  }
  if (err) return res.status(400).json({ message: err.message || "File upload failed" });
  next();
};

interface AuthReq extends Request {
  user?: { id: string; email: string; role: string; name: string };
}

const auth = (req: AuthReq, res: Response, next: NextFunction) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Authentication required" });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = decoded as any;
    next();
  });
};

const requireTeacher = (req: AuthReq, res: Response, next: NextFunction) => {
  if (req.user?.role !== "teacher") return res.status(403).json({ message: "Teacher access required" });
  next();
};

const createToken = (user: any) => jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use("/uploads", express.static(uploadsDir));

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      if (await storage.getUserByEmail(data.email)) return res.status(400).json({ message: "Email already registered" });
      
      const user = await storage.createUser(data);
      const { passwordHash, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token: createToken(user) });
    } catch (error: any) {
      res.status(400).json({ message: error.errors?.[0]?.message || error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(data.email);
      if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token: createToken(user) });
    } catch (error: any) {
      res.status(400).json({ message: error.errors?.[0]?.message || error.message || "Login failed" });
    }
  });

  app.get("/api/stats", auth, async (req: AuthReq, res: Response) => {
    try {
      const stats = req.user?.role === "teacher" ? await storage.getTeacherStats(req.user.id) : { pendingSubmissions: 0, totalTasks: 0 };
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/unread-counts", auth, async (req: AuthReq, res: Response) => {
    res.json({ unreadCount: 0 });
  });

  app.get("/api/groups", auth, async (req: AuthReq, res: Response) => {
    try {
      const groups = await storage.getGroupsForUser(req.user!.id, req.user!.role);
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/groups", auth, requireTeacher, async (req: AuthReq, res: Response) => {
    try {
      const data = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(req.user!.id, data);
      res.status(201).json(group);
    } catch (error: any) {
      res.status(400).json({ message: error.errors?.[0]?.message || error.message });
    }
  });

  app.get("/api/groups/:id", auth, async (req: AuthReq, res: Response) => {
    try {
      const group = await storage.getGroupById(req.params.id);
      if (!group) return res.status(404).json({ message: "Group not found" });
      
      const isOwner = group.ownerId === req.user!.id;
      const isMember = await storage.isMemberOfGroup(group.id, req.user!.id);
      if (!isOwner && !isMember) return res.status(403).json({ message: "Access denied" });
      
      const owner = await storage.getUserById(group.ownerId);
      res.json({ ...group, ownerName: owner?.name || "Unknown" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/groups/:id", auth, requireTeacher, async (req: AuthReq, res: Response) => {
    try {
      const group = await storage.getGroupById(req.params.id);
      if (!group || group.ownerId !== req.user!.id) return res.status(403).json({ message: "Not authorized" });
      await storage.deleteGroup(req.params.id);
      res.json({ message: "Group deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/groups/:id/members/:memberId", auth, requireTeacher, async (req: AuthReq, res: Response) => {
    try {
      const group = await storage.getGroupById(req.params.id);
      if (!group || group.ownerId !== req.user!.id) return res.status(403).json({ message: "Not authorized" });
      await storage.removeMemberFromGroup(req.params.id, req.params.memberId);
      res.json({ message: "Student removed" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/groups/join", auth, async (req: AuthReq, res: Response) => {
    try {
      const data = joinGroupSchema.parse(req.body);
      const group = await storage.getGroupByJoinCode(data.joinCode);
      if (!group) return res.status(404).json({ message: "Invalid join code" });
      
      if (await storage.isMemberOfGroup(group.id, req.user!.id)) return res.status(400).json({ message: "Already a member" });
      
      await storage.addMemberToGroup(group.id, req.user!.id);
      res.json({ message: "Joined group successfully", group });
    } catch (error: any) {
      res.status(400).json({ message: error.errors?.[0]?.message || error.message });
    }
  });

  app.post("/api/groups/:id/leave", auth, async (req: AuthReq, res: Response) => {
    try {
      const group = await storage.getGroupById(req.params.id);
      if (!group) return res.status(404).json({ message: "Group not found" });
      await storage.removeMemberFromGroup(req.params.id, req.user!.id);
      res.json({ message: "Left group successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/groups/:id/members", auth, async (req: AuthReq, res: Response) => {
    try {
      const group = await storage.getGroupById(req.params.id);
      if (!group) return res.status(404).json({ message: "Group not found" });
      
      const isMember = await storage.isMemberOfGroup(group.id, req.user!.id);
      if (group.ownerId !== req.user!.id && !isMember) return res.status(403).json({ message: "Access denied" });
      
      const members = await storage.getGroupMembers(req.params.id);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/groups/:id/tasks", auth, async (req: AuthReq, res: Response) => {
    try {
      const group = await storage.getGroupById(req.params.id);
      if (!group) return res.status(404).json({ message: "Group not found" });
      
      const isMember = await storage.isMemberOfGroup(group.id, req.user!.id);
      if (group.ownerId !== req.user!.id && !isMember) return res.status(403).json({ message: "Access denied" });
      
      const tasks = await storage.getTasksForGroup(req.params.id);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/groups/:groupId/tasks", auth, requireTeacher, upload.single("file"), uploadErrorHandler, async (req: AuthReq, res: Response) => {
    try {
      const group = await storage.getGroupById(req.params.groupId);
      if (!group || group.ownerId !== req.user!.id) return res.status(403).json({ message: "Not authorized" });
      
      const taskData = { groupId: req.params.groupId, title: req.body.title, description: req.body.description, dueDate: req.body.dueDate, taskType: "text_file" as const };
      insertTextTaskSchema.parse(taskData);
      
      const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      const task = await storage.createTask(req.params.groupId, taskData, fileUrl);
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ message: error.errors?.[0]?.message || error.message });
    }
  });

  app.get("/api/tasks/upcoming", auth, async (req: AuthReq, res: Response) => {
    try {
      if (req.user?.role !== "student") return res.json([]);
      const tasks = await storage.getTasksForStudent(req.user.id);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tasks/urgent", auth, async (req: AuthReq, res: Response) => {
    try {
      if (req.user?.role !== "student") return res.json([]);
      const tasks = await storage.getTasksForStudent(req.user.id);
      const now = new Date();
      const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const urgent = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate > now && dueDate <= twelveHoursFromNow;
      });
      res.json(urgent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tasks/all", auth, async (req: AuthReq, res: Response) => {
    try {
      if (req.user?.role !== "student") return res.status(403).json({ message: "Students only" });
      const tasks = await storage.getTasksForStudent(req.user!.id);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tasks/:id", auth, async (req: AuthReq, res: Response) => {
    try {
      const task = await storage.getTaskById(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tasks/:id/details", auth, async (req: AuthReq, res: Response) => {
    try {
      const task = await storage.getTaskById(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      
      const group = await storage.getGroupById(task.groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });
      
      const teacher = await storage.getUserById(group.ownerId);
      res.json({ ...task, groupName: group.name, teacherName: teacher?.name || "Unknown" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/tasks/:id", auth, requireTeacher, async (req: AuthReq, res: Response) => {
    try {
      const task = await storage.getTaskById(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      
      const group = await storage.getGroupById(task.groupId);
      if (!group || group.ownerId !== req.user!.id) return res.status(403).json({ message: "Not authorized" });
      
      await storage.deleteTask(req.params.id);
      res.json({ message: "Task deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tasks/:taskId/submit", auth, upload.single("file"), uploadErrorHandler, async (req: AuthReq, res: Response) => {
    try {
      const task = await storage.getTaskById(req.params.taskId);
      if (!task) return res.status(404).json({ message: "Task not found" });
      
      if (!(await storage.isMemberOfGroup(task.groupId, req.user!.id))) return res.status(403).json({ message: "Not a member" });
      if (await storage.getSubmissionForTask(req.params.taskId, req.user!.id)) return res.status(400).json({ message: "Already submitted" });
      
      const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      const submission = await storage.createSubmission({ taskId: req.params.taskId, textContent: req.body.textContent }, req.user!.id, fileUrl);
      res.status(201).json(submission);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tasks/:taskId/my-submission", auth, async (req: AuthReq, res: Response) => {
    try {
      const submission = await storage.getSubmissionForTask(req.params.taskId, req.user!.id);
      res.json(submission || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tasks/:taskId/submissions", auth, requireTeacher, async (req: AuthReq, res: Response) => {
    try {
      const task = await storage.getTaskById(req.params.taskId);
      if (!task) return res.status(404).json({ message: "Task not found" });
      
      const group = await storage.getGroupById(task.groupId);
      if (!group || group.ownerId !== req.user!.id) return res.status(403).json({ message: "Not authorized" });
      
      const submissions = await storage.getSubmissionsForTask(req.params.taskId);
      res.json(submissions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/submissions/all", auth, requireTeacher, async (req: AuthReq, res: Response) => {
    try {
      const submissions = await storage.getAllSubmissionsForTeacher(req.user!.id);
      res.json(submissions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/submissions/pending", auth, requireTeacher, async (req: AuthReq, res: Response) => {
    try {
      const submissions = await storage.getAllSubmissionsForTeacher(req.user!.id);
      res.json(submissions.filter(s => s.score === null));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/submissions/:id/score", auth, requireTeacher, async (req: AuthReq, res: Response) => {
    try {
      const data = updateScoreSchema.parse(req.body);
      const submission = await storage.getSubmissionById(req.params.id);
      if (!submission) return res.status(404).json({ message: "Submission not found" });
      
      const task = await storage.getTaskById(submission.taskId);
      if (!task) return res.status(404).json({ message: "Task not found" });
      
      const group = await storage.getGroupById(task.groupId);
      if (!group || group.ownerId !== req.user!.id) return res.status(403).json({ message: "Not authorized" });
      
      const updated = await storage.updateSubmissionScore(req.params.id, data.score);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.errors?.[0]?.message || error.message });
    }
  });

  app.get("/api/analytics", auth, async (req: AuthReq, res: Response) => {
    try {
      const analytics = req.user!.role === "teacher" ? await storage.getAnalyticsForTeacher(req.user!.id) : await storage.getAnalyticsForStudent(req.user!.id);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analytics/export-csv", auth, requireTeacher, async (req: AuthReq, res: Response) => {
    try {
      const groupId = req.query.groupId as string;
      if (!groupId) return res.status(400).json({ message: "Group ID is required" });
      
      const group = await storage.getGroupById(groupId);
      if (!group || group.ownerId !== req.user!.id) return res.status(403).json({ message: "Not authorized" });
      
      const submissions = await storage.getSubmissionsForGroup(groupId);
      let csv = "Task,Student Name,Student Email,Submitted At,Score\n";
      submissions.forEach((sub) => {
        const score = sub.score !== null ? sub.score : "Not Graded";
        const submitted = new Date(sub.submittedAt).toLocaleString();
        csv += `"${sub.taskId}","Unknown","Unknown","${submitted}","${score}"\n`;
      });
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${group.name}-grades.csv"`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/announcements", auth, requireTeacher, async (req: AuthReq, res: Response) => {
    try {
      const data = insertAnnouncementSchema.parse(req.body);
      const group = await storage.getGroupById(data.groupId);
      if (!group || group.ownerId !== req.user!.id) return res.status(403).json({ message: "Not authorized" });
      
      const announcement = await storage.createAnnouncement(data, req.user!.id);
      res.status(201).json(announcement);
    } catch (error: any) {
      res.status(400).json({ message: error.errors?.[0]?.message || error.message });
    }
  });

  app.get("/api/announcements/:groupId", auth, async (req: AuthReq, res: Response) => {
    try {
      const group = await storage.getGroupById(req.params.groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });
      
      const announcements = await storage.getAnnouncementsForGroup(req.params.groupId);
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/announcements/:announcementId/read", auth, async (req: AuthReq, res: Response) => {
    res.json({ message: "Marked as read" });
  });

  return httpServer;
}
