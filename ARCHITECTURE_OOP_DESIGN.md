# 🏗️ CLASSROOM MANAGEMENT SYSTEM - OOP CLASS DESIGN

## 📌 Complete Class Hierarchy

```
                        ┌─────────────────────────┐
                        │   SystemController     │
                        │  (API Server/Express)   │
                        └──────────┬──────────────┘
                                   │
                  ┌────────────────┼────────────────┐
                  │                │                │
            ┌─────▼────┐      ┌────▼─────┐    ┌───▼──────┐
            │ AuthMgr  │      │GroupMgr  │    │TaskMgr   │
            └─────┬────┘      └────┬─────┘    └───┬──────┘
                  │                │              │
        ┌─────────┼────────────────┼──────────────┼─────────┐
        │         │                │              │         │
    ┌───▼───┐ ┌──▼────┐ ┌────────▼─┐ ┌──────┐ ┌─▼────┐ ┌──▼──────┐
    │ User  │ │ Group │ │GroupMbr │ │Task  │ │Subm. │ │ Grade  │
    └───────┘ └───────┘ └─────────┘ └──────┘ └──────┘ └────────┘
```

---

## 🎯 CORE CLASSES

### 1️⃣ **User Class**
```
┌────────────────────────────────────┐
│            User                     │
├────────────────────────────────────┤
│ Properties:                         │
│  - id: string (UUID)               │
│  - name: string                    │
│  - email: string (unique)          │
│  - passwordHash: string            │
│  - role: UserRole (enum)           │
│    └─ "teacher" | "student"        │
├────────────────────────────────────┤
│ Methods:                           │
│  + authenticate(pwd: string)       │
│  + getRole(): UserRole             │
│  + isTeacher(): boolean            │
│  + isStudent(): boolean            │
│  + getProfile(): UserProfile       │
├────────────────────────────────────┤
│ API Endpoints:                     │
│  POST   /api/auth/register         │
│  POST   /api/auth/login            │
│  GET    /api/auth/me               │
│  POST   /api/auth/logout           │
└────────────────────────────────────┘
```

**TypeScript Interface:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

type UserRole = "teacher" | "student";

interface AuthResponse {
  user: Omit<User, "passwordHash">;
  token: string;
}
```

**Validation Schema (Zod):**
```typescript
const insertUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["teacher", "student"]),
});
```

---

### 2️⃣ **Group Class**
```
┌────────────────────────────────────┐
│           Group                    │
├────────────────────────────────────┤
│ Properties:                        │
│  - id: string (UUID)              │
│  - name: string                   │
│  - ownerId: string (FK to User)   │
│  - joinCode: string (6 chars)     │
├────────────────────────────────────┤
│ Methods:                          │
│  + create(name): Group            │
│  + generateJoinCode(): string     │
│  + addMember(userId): void        │
│  + removeMember(userId): void     │
│  + getMembers(): GroupMember[]    │
│  + getTasks(): Task[]             │
│  + getStudents(): User[]          │
├────────────────────────────────────┤
│ API Endpoints:                    │
│  GET    /api/groups               │
│  POST   /api/groups               │
│  GET    /api/groups/:id           │
│  DELETE /api/groups/:id           │
│  POST   /api/groups/join          │
│  DELETE /api/groups/:id/members   │
└────────────────────────────────────┘
```

**TypeScript Interface:**
```typescript
interface Group {
  id: string;
  name: string;
  ownerId: string;
  joinCode: string;
}

interface GroupWithMembers extends Group {
  memberCount: number;
  ownerName: string;
}
```

**Relationships:**
```
Group (1) ────────────────────────── (N) GroupMember
   │
   └──────────────────────────────── (N) Task
```

---

### 3️⃣ **GroupMember Class**
```
┌────────────────────────────────────┐
│        GroupMember                 │
├────────────────────────────────────┤
│ Properties:                        │
│  - id: string (UUID)              │
│  - groupId: string (FK)           │
│  - userId: string (FK)            │
│  - joinedAt: Date                 │
├────────────────────────────────────┤
│ Methods:                          │
│  + create(groupId, userId)        │
│  + remove(): void                 │
│  + getUser(): User                │
│  + getGroup(): Group              │
├────────────────────────────────────┤
│ Notes:                            │
│  - Join table between User/Group  │
│  - Tracks group membership        │
│  - Enables many-to-many relation  │
└────────────────────────────────────┘
```

**Relationships:**
```
GroupMember (N) ─────────── (1) User
GroupMember (N) ─────────── (1) Group
```

---

### 4️⃣ **Task Class**
```
┌────────────────────────────────────┐
│            Task                    │
├────────────────────────────────────┤
│ Properties:                        │
│  - id: string (UUID)              │
│  - groupId: string (FK)           │
│  - title: string                  │
│  - description: string            │
│  - dueDate: DateTime              │
│  - fileUrl: string | null         │
│    (attachment from teacher)      │
├────────────────────────────────────┤
│ Methods:                          │
│  + create(groupId, title, ...): Task
│  + update(data): Task             │
│  + delete(): void                 │
│  + getSubmissions(): Submission[] │
│  + isOverdue(): boolean           │
│  + getDaysUntilDue(): number      │
│  + getSubmissionStats(): Stats    │
├────────────────────────────────────┤
│ API Endpoints:                    │
│  GET    /api/tasks                │
│  POST   /api/tasks                │
│  GET    /api/tasks/:id            │
│  PATCH  /api/tasks/:id            │
│  DELETE /api/tasks/:id            │
│  GET    /api/tasks/upcoming       │
└────────────────────────────────────┘
```

**TypeScript Interface:**
```typescript
interface Task {
  id: string;
  groupId: string;
  title: string;
  description: string;
  dueDate: string;
  fileUrl: string | null;
}

interface TaskWithSubmissionStatus extends Task {
  submissionStatus?: "not_submitted" | "submitted" | "graded";
  submissionCount?: number;
  totalStudents?: number;
  score?: number | null;
}
```

**Relationships:**
```
Task (1) ──────────────────── (N) Submission
Task (N) ──────────────────── (1) Group
```

---

### 5️⃣ **Submission Class**
```
┌────────────────────────────────────┐
│         Submission                 │
├────────────────────────────────────┤
│ Properties:                        │
│  - id: string (UUID)              │
│  - taskId: string (FK)            │
│  - studentId: string (FK)         │
│  - textContent: string | null     │
│  - fileUrl: string | null         │
│    (student work attachment)      │
│  - submittedAt: DateTime          │
│  - score: number | null           │
├────────────────────────────────────┤
│ Methods:                          │
│  + submit(task, content, file)    │
│  + getStudent(): User             │
│  + getTask(): Task                │
│  + isSubmitted(): boolean         │
│  + isGraded(): boolean            │
│  + submitFile(file): void         │
│  + updateScore(score): void       │
├────────────────────────────────────┤
│ API Endpoints:                    │
│  GET    /api/submissions          │
│  POST   /api/submissions          │
│  GET    /api/tasks/:id/submissions│
│  PATCH  /api/submissions/:id/grade│
│  DELETE /api/submissions/:id      │
└────────────────────────────────────┘
```

**TypeScript Interface:**
```typescript
interface Submission {
  id: string;
  taskId: string;
  studentId: string;
  textContent: string | null;
  fileUrl: string | null;
  submittedAt: string;
  score: number | null;
}

interface SubmissionWithStudent extends Submission {
  studentName: string;
  studentEmail: string;
}
```

**Relationships:**
```
Submission (N) ────────────── (1) Task
Submission (N) ────────────── (1) User (Student)
Submission (1) ────────────── (1) Grade
```

---

### 6️⃣ **Grade Class**
```
┌────────────────────────────────────┐
│           Grade                    │
├────────────────────────────────────┤
│ Properties:                        │
│  - id: string (UUID)              │
│  - submissionId: string (FK)      │
│  - score: number (0-100)          │
│  - feedback: string | null        │
│  - gradedAt: DateTime             │
│  - gradedBy: string (Teacher ID)  │
├────────────────────────────────────┤
│ Methods:                          │
│  + create(submissionId, score)    │
│  + update(score, feedback)        │
│  + getSubmission(): Submission    │
│  + getGrader(): User              │
│  + calculateGPA(): number         │
├────────────────────────────────────┤
│ API Endpoints:                    │
│  PATCH  /api/submissions/:id/grade│
│  GET    /api/grades               │
│  GET    /api/analytics            │
└────────────────────────────────────┘
```

**Stored in Submission table (score field)**

---

## 🔗 COMPLETE RELATIONSHIP DIAGRAM

```
┌──────────────────────────────────────────────────────────────┐
│                    USER                                       │
│  (id, name, email, role: teacher|student)                   │
└───────┬───────────────┬─────────────────────┬─────────────────┘
        │               │                     │
        │ (1)           │ (N)                 │ (N)
        │               │                     │
        │       ┌───────▼──────────┐   ┌──────▼──────────┐
        │       │  GROUP           │   │  SUBMISSION      │
        │       │  (ownerId FK)    │   │  (studentId FK) │
        │       └─────┬────────────┘   └──────────────────┘
        │             │                        │ (N)
        │             │ (N)                    │
        │       ┌─────▼──────────────┐         │
        │       │  GROUPMEMBER       │         │
        │       │  (userId FK)       │   ┌─────▼──────────┐
        │       │  (groupId FK)      │   │  TASK          │
        │       └────────────────────┘   │  (groupId FK) │
        │                                 └────────────────┘
        │ (1)
        │
  ┌─────▼──────────────────────┐
  │  AUTH STATE (Frontend)      │
  │  - currentUser              │
  │  - token (JWT)              │
  │  - isAuthenticated: boolean │
  └─────────────────────────────┘
```

---

## 📊 INHERITANCE & POLYMORPHISM

### User Polymorphism
```typescript
class User {
  protected role: UserRole;
  
  isTeacher(): boolean {
    return this.role === "teacher";
  }
  
  isStudent(): boolean {
    return this.role === "student";
  }
}

// Usage
if (user.isTeacher()) {
  // Teacher-specific operations
  // - Create groups
  // - Create tasks
  // - Grade submissions
} else if (user.isStudent()) {
  // Student-specific operations
  // - Join groups
  // - Submit tasks
  // - View feedback
}
```

### Access Control Pattern
```typescript
// Middleware enforcement in routes
middleware.authenticateToken()          // Check JWT
middleware.requireTeacher()             // Check role
middleware.requireStudent()             // Check role

// Examples:
POST /api/groups              → authenticateToken
POST /api/groups              → requireTeacher
POST /api/tasks               → authenticateToken + requireTeacher
POST /api/submissions         → authenticateToken + requireStudent
PATCH /submissions/:id/grade  → authenticateToken + requireTeacher
```

---

## 🎓 ENCAPSULATION & DATA HIDING

### Storage Interface (Backend)
```typescript
interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Group operations
  createGroup(group: InsertGroup, teacherId: string): Promise<Group>;
  getGroupById(id: string): Promise<Group | undefined>;
  deleteGroup(id: string): Promise<void>;
  getGroupsByTeacher(teacherId: string): Promise<Group[]>;
  getGroupsByStudent(studentId: string): Promise<Group[]>;
  
  // Task operations
  createTask(task: InsertTask, file?: Express.Multer.File): Promise<Task>;
  getTaskById(id: string): Promise<Task | undefined>;
  getTasksByGroup(groupId: string): Promise<Task[]>;
  updateTask(id: string, updates: UpdateTask, file?: Express.Multer.File): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Submission operations
  createSubmission(submission: InsertSubmission, file?: Express.Multer.File): Promise<Submission>;
  getSubmissionById(id: string): Promise<Submission | undefined>;
  getSubmissionsByTask(taskId: string): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  updateSubmissionScore(id: string, score: UpdateScore): Promise<Submission>;
  deleteSubmission(id: string): Promise<void>;
}
```

---

## 🔐 COMPOSITION OVER INHERITANCE

Instead of deep inheritance hierarchies, we use composition:

```typescript
// GroupWithMembers = Group + Member data
interface GroupWithMembers extends Group {
  memberCount: number;
  ownerName: string;
}

// TaskWithSubmissionStatus = Task + Status information
interface TaskWithSubmissionStatus extends Task {
  submissionStatus?: "not_submitted" | "submitted" | "graded";
  submissionCount?: number;
  totalStudents?: number;
  score?: number | null;
}

// SubmissionWithStudent = Submission + Student information
interface SubmissionWithStudent extends Submission {
  studentName: string;
  studentEmail: string;
}
```

---

## 🎯 KEY DESIGN PATTERNS

### 1. **Service Locator Pattern** (Storage)
```typescript
// Single source of truth for data access
const storage = new MemStorage();

// Routes use storage
router.post("/api/groups", async (req, res) => {
  const group = await storage.createGroup(req.body, req.user.id);
  res.json(group);
});
```

### 2. **Middleware Chain Pattern** (Authentication)
```typescript
app.use(authenticateToken);        // Check JWT
app.use(validateRequest);          // Validate input
app.use(errorHandler);             // Handle errors
```

### 3. **Strategy Pattern** (File Upload)
```typescript
// Different strategies for file handling
const upload = multer({
  storage: multerStorage,          // Where to save
  limits: { fileSize: 10 * 1024 * 1024 },  // Max size
  fileFilter: (req, file, cb) => { // Which files allowed
    // validation logic
  }
});
```

### 4. **Decorator Pattern** (Validation)
```typescript
// Zod schemas as decorators
const insertUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["teacher", "student"]),
});

// Applied during route processing
const validated = insertUserSchema.parse(req.body);
```

---

## 📋 DEPENDENCY INJECTION (Frontend)

```typescript
// Context provides dependencies to components
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes />
          </ToastProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Components inject dependencies via hooks
export function MyComponent() {
  const { user, token } = useAuth();           // Auth dependency
  const { data } = useQuery({ ... });          // Query dependency
  const { toast } = useToast();                // Toast dependency
}
```

---

## 🔄 OBJECT LIFECYCLE

```
1. USER LIFECYCLE
   ┌─────────────────────────────────┐
   │ Create (signup)                 │
   │ - Register with email/password  │
   │ - Hash password with bcrypt     │
   │ - Store in database             │
   ├─────────────────────────────────┤
   │ Login                           │
   │ - Verify password               │
   │ - Generate JWT token            │
   │ - Return token + user data      │
   ├─────────────────────────────────┤
   │ Active                          │
   │ - Send token in requests        │
   │ - Verify token on each request  │
   ├─────────────────────────────────┤
   │ Delete                          │
   │ - Remove user (SET NULL refs)   │
   │ - Keep submissions for audit    │
   └─────────────────────────────────┘

2. GROUP LIFECYCLE
   Create → AddMembers → CreateTasks → Submissions → Delete (Data Preserved)

3. TASK LIFECYCLE
   Create → SetDeadline → Students Submit → Grade → Archive

4. SUBMISSION LIFECYCLE
   Create → Submit → Pending → Grade → Graded → Archive
```

---

## 🎯 SOLID PRINCIPLES APPLICATION

| Principle | Application |
|-----------|-------------|
| **S**ingle Responsibility | Each class handles one concern (User, Group, Task, etc.) |
| **O**pen/Closed | Routes extensible for new endpoints without modifying existing |
| **L**iskov Substitution | Different user roles (teacher/student) are substitutable |
| **I**nterface Segregation | Separate interfaces for User, Group, Task, Submission |
| **D**ependency Inversion | Depend on IStorage interface, not implementation |

---

## 📱 FRONTEND CLASS STRUCTURE

```typescript
// Context/State Management
interface AuthContext {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login(email, password): Promise<void>;
  logout(): void;
}

// Query Hooks
interface UseGroupsQuery {
  data: Group[];
  isLoading: boolean;
  error: Error | null;
}

interface UseTasksQuery {
  data: TaskWithSubmissionStatus[];
  isLoading: boolean;
  error: Error | null;
}

// Component Props (Composition)
interface DashboardProps {
  user: User;
  stats: Stats;
  submissions: SubmissionWithStudent[];
}

interface TaskFormProps {
  groupId: string;
  initialData?: Task;
  onSubmit: (data: InsertTask) => Promise<void>;
}
```

