# 🗄️ CLASSROOM MANAGEMENT SYSTEM - DATABASE DESIGN

## 📊 Entity-Relationship Diagram (ERD)

```
                          ┌────────────────────────┐
                          │ users                  │
                          ├────────────────────────┤
                          │ PK id (UUID)           │
                          │ name (string)          │
                          │ email (string) UNIQUE  │
                          │ passwordHash (string)  │
                          │ role (enum)            │
                          └────────────────────────┘
                                 ▲      ▲      ▲
                    ┌────────────┘      │      └──────────────┐
                    │                   │                     │
         (1) teacher│               (N) │                  (N)│ student
                    │                   │                     │
         ┌──────────▼─────────┐  ┌──────▼────────┐  ┌────────▼──────────┐
         │ groups             │  │ groupMembers  │  │ submissions       │
         ├────────────────────┤  ├───────────────┤  ├───────────────────┤
         │ PK id (UUID)       │  │ PK id (UUID)  │  │ PK id (UUID)      │
         │ name (string)      │  │ groupId FK ───┼──┼─→ groupId         │
         │ ownerId FK ────────┼──┘ userId FK ────┼──┘ taskId FK        │
         │ joinCode (string)  │                  │ studentId FK        │
         └────────┬───────────┘                  │ textContent (text)  │
                  │                              │ fileUrl (string)    │
                  │ (1)                          │ submittedAt (date)  │
                  │                              │ score (integer)     │
                  │ (N)                          └───────────────────┘
         ┌────────▼──────────┐
         │ tasks             │
         ├───────────────────┤
         │ PK id (UUID)      │
         │ groupId FK ───────┼──→ (1) group
         │ title (string)    │
         │ description (text)│
         │ dueDate (date)    │
         │ fileUrl (string)  │
         └───────────────────┘
```

---

## 📋 DATABASE SCHEMA (Detailed)

### 🧑 TABLE: `users`

**Purpose:** Store all user accounts (teachers and students)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  createdAt TIMESTAMP DEFAULT now()
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | TEXT | NOT NULL | User's full name |
| `email` | TEXT | NOT NULL, UNIQUE | Email for login |
| `passwordHash` | TEXT | NOT NULL | Bcrypt hashed password |
| `role` | ENUM | NOT NULL, CHECK | `'teacher'` or `'student'` |
| `createdAt` | TIMESTAMP | DEFAULT now() | Account creation time |

**Indexes:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Sample Data:**
```
id: 'uuid-1', name: 'John Teacher', email: 'john@school.com', role: 'teacher'
id: 'uuid-2', name: 'Jane Student', email: 'jane@school.com', role: 'student'
```

---

### 👥 TABLE: `groups`

**Purpose:** Store classroom groups created by teachers

```sql
CREATE TABLE groups (
  id TEXT PRIMARY KEY DEFAULT uuid(),
  name TEXT NOT NULL,
  ownerId TEXT NOT NULL,
  joinCode TEXT NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT now(),
  FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE SET NULL
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique group identifier |
| `name` | TEXT | NOT NULL | Group/class name |
| `ownerId` | UUID | NOT NULL, FK | Teacher who created group |
| `joinCode` | TEXT | NOT NULL, UNIQUE | 6-char code for students to join |
| `createdAt` | TIMESTAMP | DEFAULT now() | Creation timestamp |

**Foreign Keys:**
```
ownerId → users(id) ON DELETE SET NULL
```
*(Preserves group data if teacher is deleted)*

**Indexes:**
```sql
CREATE INDEX idx_groups_ownerId ON groups(ownerId);
CREATE INDEX idx_groups_joinCode ON groups(joinCode);
```

**Sample Data:**
```
id: 'grp-1', name: 'Math 101', ownerId: 'uuid-1', joinCode: 'ABC123'
id: 'grp-2', name: 'Physics 101', ownerId: 'uuid-1', joinCode: 'XYZ789'
```

---

### 📌 TABLE: `groupMembers`

**Purpose:** Join table linking students to groups (many-to-many relationship)

```sql
CREATE TABLE groupMembers (
  id TEXT PRIMARY KEY DEFAULT uuid(),
  groupId TEXT NOT NULL,
  userId TEXT NOT NULL,
  joinedAt TIMESTAMP DEFAULT now(),
  FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(groupId, userId)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique membership record |
| `groupId` | UUID | NOT NULL, FK | Reference to group |
| `userId` | UUID | NOT NULL, FK | Reference to student user |
| `joinedAt` | TIMESTAMP | DEFAULT now() | When student joined |
| `(groupId, userId)` | - | UNIQUE | One entry per student per group |

**Foreign Keys:**
```
groupId → groups(id) ON DELETE CASCADE (Remove membership if group deleted)
userId → users(id) ON DELETE SET NULL (Preserve membership if user deleted)
```

**Indexes:**
```sql
CREATE INDEX idx_groupMembers_groupId ON groupMembers(groupId);
CREATE INDEX idx_groupMembers_userId ON groupMembers(userId);
CREATE UNIQUE INDEX idx_groupMembers_unique ON groupMembers(groupId, userId);
```

**Sample Data:**
```
id: 'mem-1', groupId: 'grp-1', userId: 'uuid-2', joinedAt: '2024-01-15'
id: 'mem-2', groupId: 'grp-1', userId: 'uuid-3', joinedAt: '2024-01-16'
```

---

### 📝 TABLE: `tasks`

**Purpose:** Store assignments created by teachers for groups

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY DEFAULT uuid(),
  groupId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  dueDate TEXT NOT NULL,
  fileUrl TEXT,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now(),
  FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE SET NULL
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique task identifier |
| `groupId` | UUID | NOT NULL, FK | Group this task belongs to |
| `title` | TEXT | NOT NULL | Task title/name |
| `description` | TEXT | NOT NULL | Full task description |
| `dueDate` | TEXT | NOT NULL | ISO 8601 deadline datetime |
| `fileUrl` | TEXT | NULLABLE | Attachment (pdf, doc, etc) |
| `createdAt` | TIMESTAMP | DEFAULT now() | Creation time |
| `updatedAt` | TIMESTAMP | ON UPDATE now() | Last modification |

**Foreign Keys:**
```
groupId → groups(id) ON DELETE SET NULL
```
*(Preserves task if group deleted - useful for archival)*

**Indexes:**
```sql
CREATE INDEX idx_tasks_groupId ON tasks(groupId);
CREATE INDEX idx_tasks_dueDate ON tasks(dueDate);
```

**Sample Data:**
```
id: 'tsk-1', groupId: 'grp-1', title: 'Chapter 1 Exercises', dueDate: '2024-02-15T23:59:59', fileUrl: 'uploads/ch1.pdf'
id: 'tsk-2', groupId: 'grp-1', title: 'Project Proposal', dueDate: '2024-02-20T23:59:59'
```

---

### 📤 TABLE: `submissions`

**Purpose:** Store student work submissions

```sql
CREATE TABLE submissions (
  id TEXT PRIMARY KEY DEFAULT uuid(),
  taskId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  textContent TEXT,
  fileUrl TEXT,
  submittedAt TIMESTAMP NOT NULL DEFAULT now(),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  gradedAt TIMESTAMP,
  gradedBy TEXT,
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (gradedBy) REFERENCES users(id) ON DELETE SET NULL
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique submission |
| `taskId` | UUID | NOT NULL, FK | Task being submitted |
| `studentId` | UUID | NOT NULL, FK | Student who submitted |
| `textContent` | TEXT | NULLABLE | Text answer/content |
| `fileUrl` | TEXT | NULLABLE | Uploaded file (pdf, doc, zip) |
| `submittedAt` | TIMESTAMP | NOT NULL, DEFAULT | Submission time |
| `score` | INTEGER | CHECK (0-100), NULLABLE | Grade (0-100) |
| `feedback` | TEXT | NULLABLE | Teacher feedback |
| `gradedAt` | TIMESTAMP | NULLABLE | When graded |
| `gradedBy` | UUID | NULLABLE, FK | Teacher who graded |

**Foreign Keys:**
```
taskId → tasks(id) ON DELETE SET NULL (Preserve submission for audit)
studentId → users(id) ON DELETE SET NULL (Preserve submission if student deleted)
gradedBy → users(id) ON DELETE SET NULL (Preserve grade if teacher deleted)
```

**Indexes:**
```sql
CREATE INDEX idx_submissions_taskId ON submissions(taskId);
CREATE INDEX idx_submissions_studentId ON submissions(studentId);
CREATE INDEX idx_submissions_score ON submissions(score);
CREATE UNIQUE INDEX idx_submissions_unique ON submissions(taskId, studentId);
```

**Sample Data:**
```
id: 'sub-1', taskId: 'tsk-1', studentId: 'uuid-2', fileUrl: 'uploads/sub-1.pdf', submittedAt: '2024-02-15T10:30:00', score: 85, gradedAt: '2024-02-16T08:00:00', gradedBy: 'uuid-1'
id: 'sub-2', taskId: 'tsk-1', studentId: 'uuid-3', textContent: '...answer text...', submittedAt: '2024-02-15T14:20:00', score: null
```

---

## 🔄 KEY RELATIONSHIPS

### 1. **User → Group (1 to N)**
- One teacher creates multiple groups
- Relationship: `groups.ownerId → users.id`
- Deletion: `ON DELETE SET NULL` (preserve group)

### 2. **User ↔ Group (N to N)**
- Many students join many groups
- Join Table: `groupMembers`
- Relationships:
  - `groupMembers.userId → users.id` (SET NULL)
  - `groupMembers.groupId → groups.id` (CASCADE)

### 3. **Group → Task (1 to N)**
- One group has many tasks
- Relationship: `tasks.groupId → groups.id`
- Deletion: `ON DELETE SET NULL`

### 4. **Task → Submission (1 to N)**
- One task has many submissions
- Relationship: `submissions.taskId → tasks.id`
- Deletion: `ON DELETE SET NULL`

### 5. **User (Student) → Submission (1 to N)**
- One student creates many submissions
- Relationship: `submissions.studentId → users.id`
- Deletion: `ON DELETE SET NULL`

### 6. **User (Teacher) → Submission (Grade) (1 to N)**
- One teacher grades many submissions
- Relationship: `submissions.gradedBy → users.id`
- Deletion: `ON DELETE SET NULL`

---

## 🔐 DATA INTEGRITY & CONSTRAINTS

### Unique Constraints
```sql
-- Email must be unique per user
UNIQUE(email) ON users

-- Join code must be unique
UNIQUE(joinCode) ON groups

-- Each student submits once per task
UNIQUE(taskId, studentId) ON submissions
```

### Check Constraints
```sql
-- Role must be teacher or student
CHECK (role IN ('teacher', 'student')) ON users

-- Score must be 0-100
CHECK (score >= 0 AND score <= 100) ON submissions
```

### Referential Integrity
- **SET NULL**: Used for most FKs to preserve audit trail
  - Teacher deleted → group.ownerId = NULL
  - Student deleted → submission.studentId = NULL
  - Task deleted → submission.taskId = NULL

- **CASCADE**: Used only for groupMembers → groups
  - When group deleted, remove all memberships

---

## 📈 QUERY PATTERNS

### Get all tasks for a student
```sql
SELECT t.* FROM tasks t
JOIN groupMembers gm ON t.groupId = gm.groupId
WHERE gm.userId = 'student-uuid'
  AND t.dueDate > NOW()
ORDER BY t.dueDate ASC;
```

### Get submission stats for a task
```sql
SELECT 
  COUNT(*) as totalSubmissions,
  SUM(CASE WHEN score IS NOT NULL THEN 1 ELSE 0 END) as gradedCount,
  AVG(score) as averageScore,
  MAX(score) as maxScore,
  MIN(score) as minScore
FROM submissions
WHERE taskId = 'task-uuid';
```

### Get pending submissions for teacher
```sql
SELECT s.*, u.name as studentName, t.title as taskTitle
FROM submissions s
JOIN users u ON s.studentId = u.id
JOIN tasks t ON s.taskId = t.id
WHERE s.score IS NULL
  AND t.groupId IN (
    SELECT id FROM groups WHERE ownerId = 'teacher-uuid'
  )
ORDER BY s.submittedAt DESC;
```

### Get student's grades in a group
```sql
SELECT 
  t.title,
  s.score,
  s.feedback,
  s.gradedAt,
  ROUND(AVG(s.score) OVER (), 2) as groupAverage
FROM submissions s
JOIN tasks t ON s.taskId = t.id
WHERE s.studentId = 'student-uuid'
  AND t.groupId = 'group-uuid'
  AND s.score IS NOT NULL
ORDER BY t.dueDate DESC;
```

---

## 🔍 INDEXING STRATEGY

### Indexes for Performance
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Group lookups
CREATE INDEX idx_groups_ownerId ON groups(ownerId);
CREATE INDEX idx_groups_joinCode ON groups(joinCode);

-- Member lookups
CREATE INDEX idx_groupMembers_groupId ON groupMembers(groupId);
CREATE INDEX idx_groupMembers_userId ON groupMembers(userId);

-- Task lookups & filtering
CREATE INDEX idx_tasks_groupId ON tasks(groupId);
CREATE INDEX idx_tasks_dueDate ON tasks(dueDate);

-- Submission lookups & filtering
CREATE INDEX idx_submissions_taskId ON submissions(taskId);
CREATE INDEX idx_submissions_studentId ON submissions(studentId);
CREATE INDEX idx_submissions_score ON submissions(score);

-- Unique constraints (also serve as indexes)
CREATE UNIQUE INDEX idx_submissions_unique ON submissions(taskId, studentId);
CREATE UNIQUE INDEX idx_groupMembers_unique ON groupMembers(groupId, userId);
```

---

## 📊 NORMALIZATION ANALYSIS

### First Normal Form (1NF)
✓ **COMPLIANT** - All columns contain atomic (indivisible) values

### Second Normal Form (2NF)
✓ **COMPLIANT** - All non-key attributes depend on entire primary key

### Third Normal Form (3NF)
✓ **COMPLIANT** - No transitive dependencies; each attribute depends only on the key

**Example**: We don't store student names in submissions; instead we FK to users table.

---

## 🔒 AUDIT TRAIL & DATA PRESERVATION

### Design Philosophy
All foreign keys use **SET NULL on DELETE**, not CASCADE. This ensures:

1. **Historical Records**: Submissions preserved when students/tasks deleted
2. **Audit Trail**: Can track who did what (gradedBy, submittedAt)
3. **Data Recovery**: Deleted data remains analyzable

### Example Flow
```
1. Teacher creates group with 5 students
2. Students submit assignments and get graded
3. Teacher decides to remove a student from group
   → groupMembers record deleted (CASCADE)
   → submission records stay with studentId = NULL
   → grades preserved for audit

4. Teacher deletes task
   → submissions.taskId = NULL
   → scores/feedback preserved
   → can still analyze student performance
```

---

## 🎯 SCHEMA EVOLUTION SCENARIOS

### Adding a Feature: Deadline Reminders
```sql
-- No schema change needed!
-- Query: SELECT * FROM tasks WHERE dueDate BETWEEN NOW() AND NOW() + '24 hours'
-- Already have dueDate indexed
```

### Adding a Feature: Late Submission Penalty
```sql
-- Add column to track late submissions
ALTER TABLE submissions ADD COLUMN isLate BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN lateByMinutes INTEGER;
```

### Adding a Feature: Attendance Tracking
```sql
-- Create new table
CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  groupId TEXT NOT NULL FK,
  studentId TEXT NOT NULL FK,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'late')),
  UNIQUE(groupId, studentId, date)
);
```

---

## 📋 MIGRATION CHECKLIST

When deploying schema changes:

```
□ Backup production database
□ Test migrations on staging
□ Review foreign key constraints
□ Check for orphaned records
□ Verify indexes are created
□ Test query performance
□ Update API documentation
□ Deploy with zero downtime
□ Monitor for errors
□ Document schema version
```

