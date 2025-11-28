# OOP Class Diagram - Classroom Management System

## 1. CORE ENTITY CLASSES

### User Class Hierarchy
```
┌─────────────────────────────────────┐
│          << abstract >>              │
│            USER                      │
├─────────────────────────────────────┤
│ - id: string (UUID)                 │
│ - name: string                      │
│ - email: string (unique)            │
│ - passwordHash: string              │
│ - role: UserRole (enum)             │
├─────────────────────────────────────┤
│ + authenticate(): boolean           │
│ + validateEmail(): boolean          │
│ + hasPermission(action): boolean    │
│ + toJSON(): UserDTO                 │
└─────────────────────────────────────┘
        △               △
        │               │
   ┌────┘               └────┐
   │                         │
┌──────────────┐      ┌──────────────┐
│   TEACHER    │      │   STUDENT    │
├──────────────┤      ├──────────────┤
│ + groups[]   │      │ + groups[]   │
│ + tasks[]    │      │ + submissions│
├──────────────┤      ├──────────────┤
│ + createGroup│      │ + joinGroup()│
│ + createTask │      │ + submit()   │
│ + gradeWork()│      │ + viewGrades │
└──────────────┘      └──────────────┘
```

### Group Class
```
┌──────────────────────────────────────┐
│            GROUP                     │
├──────────────────────────────────────┤
│ - id: string (UUID)                  │
│ - name: string                       │
│ - ownerId: string (FK to User)       │
│ - joinCode: string (unique, 6 chars) │
│ - createdAt: Date                    │
│ - updatedAt: Date                    │
├──────────────────────────────────────┤
│ + addMember(student: Student): void  │
│ + removeMember(userId: string): void │
│ + getMembers(): Student[]            │
│ + generateJoinCode(): string         │
│ + getTasks(): Task[]                 │
│ + getStats(): GroupStats             │
└──────────────────────────────────────┘
     1
     │
     ├─────────────────────┐
     │ "owns"              │
     │                     │
   TEACHER              has many
     │                     │
     │                     │
     │                  ┌──────────────────┐
     │                  │  GROUP_MEMBER    │
     │                  ├──────────────────┤
     │                  │ - id: string     │
     │                  │ - groupId: FK    │
     │                  │ - userId: FK     │
     │                  │ - joinedAt: Date │
     │                  └──────────────────┘
     │                     △
     │                     │ contains
     │                     │
     └─────────────────────┘
     STUDENT
```

### Task Class
```
┌──────────────────────────────────────┐
│             TASK                     │
├──────────────────────────────────────┤
│ - id: string (UUID)                  │
│ - groupId: string (FK to Group)      │
│ - title: string                      │
│ - description: string                │
│ - dueDate: DateTime                  │
│ - fileUrl: string | null             │
│ - createdAt: Date                    │
│ - updatedAt: Date                    │
├──────────────────────────────────────┤
│ + getSubmissions(): Submission[]     │
│ + isDue(): boolean                   │
│ + isOverdue(): boolean               │
│ + getSubmissionCount(): number       │
│ + getGradingStats(): Stats           │
│ + calculateCompletionRate(): number  │
└──────────────────────────────────────┘
     △
     │ belongs to
     │ 1 Group -> many Tasks
     │
     ├─── has many ───┐
     │                │
     │            ┌────────────────────────┐
     │            │   SUBMISSION           │
     │            ├────────────────────────┤
     │            │ - id: string (UUID)    │
     │            │ - taskId: string (FK)  │
     │            │ - studentId: FK        │
     │            │ - textContent: string  │
     │            │ - fileUrl: string|null │
     │            │ - submittedAt: Date    │
     │            │ - score: number | null │
     │            ├────────────────────────┤
     │            │ + getStatus(): Status  │
     │            │ + isLate(): boolean    │
     │            │ + isGraded(): boolean  │
     │            │ + setGrade(score): void│
     │            │ + toJSON(): DTO        │
     │            └────────────────────────┘
     │                    △
     │                    │ submitted by
     │                    │
     └──────────────────STUDENT
```

## 2. COMPLETE CLASS RELATIONSHIPS

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLASSROOM SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐                                                  │
│  │  USER    │─────┐                                            │
│  └──────────┘     │                                            │
│       △ △         │                                            │
│       │ │         │                                            │
│    T  S │         │                                            │
│    E  T │         │                                            │
│    A  U │         │                                            │
│    C  D │         │                                            │
│    H  E │         │                                            │
│    E  N │         │                                            │
│    R  T │         │                                            │
│       │ │         │                                            │
│       └─┴─────────┘                                            │
│         │                                                      │
│         ├─ "owns/teaches" ──────┐                             │
│         │                        │                             │
│         ▼                    ┌────────┐                        │
│    ┌─────────┐              │ GROUP  │◄───┐                  │
│    │ GROUP   │──members─────├────────┤    │                  │
│    │ MEMBER  │              │        │    │                  │
│    └─────────┘              └────────┘    │                  │
│         △                        │        │                  │
│         │                        │        │                  │
│         │                      has many  "updates"           │
│         │                        │        │                  │
│         │                        ▼        │                  │
│         │                    ┌────────┐   │                  │
│         └────────────────────┤ TASK   │───┘                  │
│                              └────────┘                       │
│                                  │                            │
│                              has many                         │
│                                  │                            │
│                                  ▼                            │
│                         ┌──────────────┐                      │
│                         │ SUBMISSION   │                      │
│                         ├──────────────┤                      │
│                         │ - score      │                      │
│                         │ - feedback   │                      │
│                         │ - status     │                      │
│                         └──────────────┘                      │
│                              △                               │
│                              │                               │
│                         submitted by                          │
│                              │                               │
│                          STUDENT                              │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 3. CLASS PROPERTIES & METHODS

### User Base Class
```typescript
abstract class User {
  // Properties
  id: string
  name: string
  email: string
  passwordHash: string
  role: 'teacher' | 'student'
  createdAt: Date

  // Methods
  authenticate(password: string): boolean
  validateEmail(): boolean
  updateProfile(name: string, email: string): void
  abstract getPermissions(): Permission[]
  abstract getDashboardData(): Dashboard
}

class Teacher extends User {
  // Properties
  ownedGroups: Group[]
  createdTasks: Task[]

  // Methods
  createGroup(name: string): Group
  deleteGroup(groupId: string): void
  createTask(groupId: string, taskData: TaskInput): Task
  gradeSubmission(submissionId: string, score: number, feedback: string): void
  viewAnalytics(groupId: string): Analytics
  getPermissions(): Permission[] // Returns ['create_group', 'create_task', 'grade']
}

class Student extends User {
  // Properties
  enrolledGroups: Group[]
  submissions: Submission[]

  // Methods
  joinGroup(joinCode: string): void
  viewTasks(groupId: string): Task[]
  submitTask(taskId: string, content: string, file?: File): Submission
  viewGrades(): Submission[]
  getPermissions(): Permission[] // Returns ['view_tasks', 'submit', 'view_grades']
}
```

### Group Class
```typescript
class Group {
  // Properties
  id: string
  name: string
  owner: Teacher
  ownerId: string
  joinCode: string (unique, 6-char code)
  members: Student[]
  tasks: Task[]
  createdAt: Date
  updatedAt: Date

  // Methods
  addMember(student: Student): GroupMember
  removeMember(studentId: string): void
  getMembers(): Student[]
  getTaskCount(): number
  getStats(): {
    totalMembers: number
    totalTasks: number
    avgSubmissionRate: number
    avgScore: number
  }
  regenerateJoinCode(): string
}
```

### Task Class
```typescript
class Task {
  // Properties
  id: string
  group: Group
  groupId: string
  title: string
  description: string
  dueDate: DateTime
  fileUrl: string | null
  submissions: Submission[]
  createdAt: Date
  updatedAt: Date

  // Methods
  isDue(): boolean
  isOverdue(): boolean
  daysUntilDue(): number
  getSubmissions(): Submission[]
  getSubmissionCount(): number
  getTotalStudents(): number
  getCompletionRate(): percentage
  getAverageScore(): number
  getGradingStats(): {
    submitted: number
    graded: number
    pending: number
    average: number
  }
}
```

### Submission Class
```typescript
class Submission {
  // Properties
  id: string
  task: Task
  taskId: string
  student: Student
  studentId: string
  textContent: string | null
  fileUrl: string | null
  submittedAt: Date
  score: number | null
  feedback: string | null
  gradedAt: Date | null

  // Computed Properties
  isSubmitted: boolean (submittedAt != null)
  isGraded: boolean (score != null)
  isLate: boolean (submittedAt > task.dueDate)
  status: 'not_submitted' | 'submitted' | 'graded'

  // Methods
  setGrade(score: number, feedback: string): void
  getStatus(): Status
  isOverdue(): boolean
  daysLate(): number
}
```

## 4. INHERITANCE & POLYMORPHISM

### Authorization Pattern
```typescript
interface Authorizable {
  canCreate(resource: string): boolean
  canRead(resource: string): boolean
  canUpdate(resource: string): boolean
  canDelete(resource: string): boolean
}

class TeacherPermissions implements Authorizable {
  canCreate(resource: 'group' | 'task' | 'feedback'): boolean {
    return ['group', 'task', 'feedback'].includes(resource)
  }
  canRead(resource: string): boolean {
    return true // Can read all resources in their groups
  }
  canDelete(resource: 'group' | 'task'): boolean {
    return ['group', 'task'].includes(resource)
  }
}

class StudentPermissions implements Authorizable {
  canCreate(resource: 'submission'): boolean {
    return resource === 'submission'
  }
  canRead(resource: 'task' | 'submission' | 'grade'): boolean {
    return ['task', 'submission', 'grade'].includes(resource)
  }
  canDelete(resource: string): boolean {
    return false
  }
}
```

## 5. RELATIONSHIPS SUMMARY

| From | To | Type | Cardinality | Notes |
|------|----|----|-------------|-------|
| Teacher | Group | owns | 1 : Many | One teacher can own many groups |
| Student | Group | member | Many : Many | Students join multiple groups (via GroupMember) |
| Group | Task | contains | 1 : Many | One group has many tasks |
| Task | Submission | receives | 1 : Many | One task receives many submissions |
| Student | Submission | makes | 1 : Many | One student makes many submissions |
| Task | Student | assigned_to | Many : Many | Multiple students per task (implicit) |

## 6. COMPOSITION vs AGGREGATION

```
Composition (strong ownership):
  User "is-a" (composition)
  ├─ Teacher role
  └─ Student role
  
  Task "contains" (composition)
  └─ Submissions (tight coupling, exists only in context of task)

Aggregation (loose ownership):
  Group "has" (aggregation)
  └─ Members (Students can exist without the group)
  
  Group "contains" (aggregation)
  └─ Tasks (Tasks reference the group but can be queried independently)
```

## 7. DESIGN PATTERNS USED

### 1. **Inheritance Pattern**
```typescript
// Base abstract class
abstract class User { ... }

// Concrete implementations
class Teacher extends User { ... }
class Student extends User { ... }
```

### 2. **Composition Pattern**
```typescript
class Group {
  owner: Teacher  // Teacher composed within Group
  members: Student[]
  tasks: Task[]
}
```

### 3. **Role-Based Access Control (RBAC)**
```typescript
interface Permissionable {
  role: 'teacher' | 'student'
  hasPermission(action: string): boolean
}

class AuthMiddleware {
  authorize(user: Permissionable, action: string) {
    if (!user.hasPermission(action)) {
      throw new ForbiddenError()
    }
  }
}
```

### 4. **Factory Pattern** (for User creation)
```typescript
class UserFactory {
  static createUser(role: 'teacher' | 'student', data: UserInput): User {
    if (role === 'teacher') return new Teacher(data)
    if (role === 'student') return new Student(data)
  }
}
```

### 5. **Data Transfer Object (DTO) Pattern**
```typescript
class SubmissionDTO {
  id: string
  taskTitle: string
  studentName: string
  status: string
  score: number | null
  submittedAt: string
  
  static fromEntity(submission: Submission): SubmissionDTO {
    return {
      id: submission.id,
      taskTitle: submission.task.title,
      studentName: submission.student.name,
      // ... etc
    }
  }
}
```

## 8. VALIDATION & CONSTRAINTS

```typescript
// User Validation
insertUserSchema = {
  name: string (2-100 chars)
  email: string (valid email, unique)
  password: string (min 6 chars)
  role: enum ['teacher', 'student']
}

// Task Validation
insertTaskSchema = {
  groupId: string (must exist)
  title: string (2-200 chars)
  description: string (min 1 char)
  dueDate: Date (must be in future)
  fileUrl: optional (max 10MB)
}

// Submission Validation
insertSubmissionSchema = {
  taskId: string (must exist, not past deadline)
  studentId: string (must be group member)
  textContent: optional string
  fileUrl: optional (max 10MB)
}
```

---

## Summary

**This OOP design provides:**
- ✅ Clear separation of concerns (User → Teacher/Student)
- ✅ Type safety with TypeScript interfaces
- ✅ Role-based permissions management
- ✅ Scalable entity relationships
- ✅ Composition for tight coupling where needed
- ✅ Inheritance for code reuse
- ✅ Validation at entity level
