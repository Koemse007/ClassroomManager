#!/bin/bash

# Color codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

print_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_file_header() {
    echo -e "${YELLOW}📄 FILE: $1${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}\n"
}

explain_section() {
    echo -e "${CYAN}📌 $1${NC}\n"
}

# START
print_section "CLASSROOM MANAGEMENT SYSTEM - COMPLETE CODE WALKTHROUGH"

# ============ SERVER CONFIG FILES ============
print_section "1️⃣  SERVER CONFIGURATION FILES"

print_file_header "shared/schema.ts"
explain_section "Database schema definition with Drizzle ORM"
cat shared/schema.ts | head -100
echo -e "\n${YELLOW}...showing first 100 lines...${NC}\n"

print_file_header "server/index.ts"
explain_section "Express server entry point with middleware and database setup"
cat server/index.ts | head -80
echo -e "\n${YELLOW}...showing first 80 lines...${NC}\n"

print_file_header "server/storage.ts"
explain_section "In-memory storage interface with CRUD operations"
cat server/storage.ts | head -120
echo -e "\n${YELLOW}...showing first 120 lines...${NC}\n"

print_file_header "server/routes.ts"
explain_section "All REST API endpoints with validation"
cat server/routes.ts | head -150
echo -e "\n${YELLOW}...showing first 150 lines of routes...${NC}\n"

# ============ FRONTEND CONFIG ============
print_section "2️⃣  FRONTEND CONFIGURATION FILES"

print_file_header "client/src/App.tsx"
explain_section "Main React app with routing and providers"
cat client/src/App.tsx | head -100
echo -e "\n${YELLOW}...showing first 100 lines...${NC}\n"

print_file_header "client/src/index.css"
explain_section "Global styles with color variables for light/dark modes"
cat client/src/index.css | head -80
echo -e "\n${YELLOW}...showing first 80 lines of CSS...${NC}\n"

print_file_header "vite.config.ts"
explain_section "Build configuration with aliases and plugins"
cat vite.config.ts
echo ""

print_file_header "tailwind.config.ts"
explain_section "Tailwind CSS configuration with custom color extensions"
cat tailwind.config.ts
echo ""

# ============ FRONTEND PAGES ============
print_section "3️⃣  FRONTEND PAGES - USER INTERFACES"

print_file_header "client/src/pages/auth-page.tsx"
explain_section "Authentication page with login and signup forms"
cat client/src/pages/auth-page.tsx | head -100
echo -e "\n${YELLOW}...showing first 100 lines...${NC}\n"

print_file_header "client/src/pages/teacher-dashboard.tsx"
explain_section "Teacher dashboard showing pending submissions and active tasks"
cat client/src/pages/teacher-dashboard.tsx | head -100
echo -e "\n${YELLOW}...showing first 100 lines...${NC}\n"

print_file_header "client/src/pages/student-dashboard.tsx"
explain_section "Student dashboard with upcoming tasks and join group dialog"
cat client/src/pages/student-dashboard.tsx | head -100
echo -e "\n${YELLOW}...showing first 100 lines...${NC}\n"

print_file_header "client/src/pages/teacher-groups.tsx"
explain_section "Teacher group management interface"
cat client/src/pages/teacher-groups.tsx | head -80
echo -e "\n${YELLOW}...showing first 80 lines...${NC}\n"

print_file_header "client/src/pages/student-groups.tsx"
explain_section "Student groups view with join code functionality"
cat client/src/pages/student-groups.tsx | head -80
echo -e "\n${YELLOW}...showing first 80 lines...${NC}\n"

print_file_header "client/src/pages/group-detail.tsx"
explain_section "Group details page showing members and tasks"
cat client/src/pages/group-detail.tsx | head -80
echo -e "\n${YELLOW}...showing first 80 lines...${NC}\n"

print_file_header "client/src/pages/task-form.tsx"
explain_section "Create/edit tasks with file attachments and deadlines"
cat client/src/pages/task-form.tsx | head -100
echo -e "\n${YELLOW}...showing first 100 lines...${NC}\n"

print_file_header "client/src/pages/all-tasks.tsx"
explain_section "All tasks for a group with filtering options"
cat client/src/pages/all-tasks.tsx | head -80
echo -e "\n${YELLOW}...showing first 80 lines...${NC}\n"

print_file_header "client/src/pages/task-submission.tsx"
explain_section "Student task submission form with file upload"
cat client/src/pages/task-submission.tsx | head -100
echo -e "\n${YELLOW}...showing first 100 lines...${NC}\n"

print_file_header "client/src/pages/all-submissions.tsx"
explain_section "Teacher view of all submissions for a task"
cat client/src/pages/all-submissions.tsx | head -80
echo -e "\n${YELLOW}...showing first 80 lines...${NC}\n"

print_file_header "client/src/pages/submission-review.tsx"
explain_section "Grade individual student submissions"
cat client/src/pages/submission-review.tsx | head -100
echo -e "\n${YELLOW}...showing first 100 lines...${NC}\n"

print_file_header "client/src/pages/analytics-dashboard.tsx"
explain_section "Analytics and statistics dashboard"
cat client/src/pages/analytics-dashboard.tsx | head -80
echo -e "\n${YELLOW}...showing first 80 lines...${NC}\n"

# ============ FRONTEND COMPONENTS ============
print_section "4️⃣  FRONTEND COMPONENTS - REUSABLE UI"

print_file_header "client/src/components/deadline-reminder.tsx"
explain_section "Deadline reminder component showing overdue and due-soon tasks"
cat client/src/components/deadline-reminder.tsx
echo ""

print_file_header "client/src/lib/auth.ts"
explain_section "Authentication context and user state management"
cat client/src/lib/auth.ts | head -80
echo -e "\n${YELLOW}...showing first 80 lines...${NC}\n"

print_file_header "client/src/lib/queryClient.ts"
explain_section "TanStack Query setup with API request helper"
cat client/src/lib/queryClient.ts
echo ""

print_file_header "client/src/hooks/use-toast.ts"
explain_section "Toast notification hook"
cat client/src/hooks/use-toast.ts | head -50
echo ""

# ============ SUMMARY ============
print_section "📊 CODE ARCHITECTURE SUMMARY"

echo -e "${GREEN}BACKEND STRUCTURE:${NC}"
echo "  ├─ server/index.ts     : Express app with middleware & database"
echo "  ├─ server/routes.ts    : All API endpoints"
echo "  ├─ server/storage.ts   : Data storage interface"
echo "  └─ shared/schema.ts    : Data models & validation\n"

echo -e "${GREEN}FRONTEND STRUCTURE:${NC}"
echo "  ├─ client/src/App.tsx           : Main app routing"
echo "  ├─ client/src/index.css         : Global styles & colors"
echo "  ├─ client/src/pages/            : Page components (auth, dashboard, etc)"
echo "  ├─ client/src/components/       : Reusable UI components"
echo "  ├─ client/src/lib/              : Utilities (auth, queries)"
echo "  └─ client/src/hooks/            : Custom hooks\n"

echo -e "${GREEN}KEY FILES EXPLAINED:${NC}"
echo "  • shared/schema.ts     : Database entities (users, groups, tasks, submissions)"
echo "  • server/routes.ts     : REST endpoints (/api/auth, /api/groups, /api/tasks)"
echo "  • client/src/App.tsx   : Routing with protected routes based on role"
echo "  • dashboard pages      : Different UI for teachers vs students"
echo "  • task-form.tsx        : Create tasks with file attachments"
echo "  • task-submission.tsx  : Students submit work"
echo "  • submission-review    : Teachers grade submissions\n"

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Complete code walkthrough finished!${NC}"
echo -e "${CYAN}Tip: Use 'less' for detailed reading: less client/src/pages/teacher-dashboard.tsx${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"
