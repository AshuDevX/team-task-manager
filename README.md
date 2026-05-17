# TaskFlow — Team Task Manager

A full-stack web application where users can create projects, assign tasks, and track progress with role-based access control (Admin/Member).

**Live URL:** https://team-task-manager11.up.railway.app  
**GitHub:** https://github.com/AshuDevX/team-task-manager

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (JSON Web Tokens) |
| Deployment | Railway |

---

## Features

- **Authentication** — Signup and Login with JWT-based session management
- **Role Selection** — Choose Admin or Member role at registration
- **Project Management** — Admins can create, update, and delete projects
- **Team Management** — Admins can add or remove members from projects
- **Task Tracking** — Create tasks with title, description, status, priority, due date, and assignee
- **Role-Based Access Control** — Admins manage everything; Members can only update task status
- **Dashboard** — Personal task overview showing total tasks, in-progress, overdue count, and project count
- **Overdue Alerts** — Visual warning when tasks are past their due date

---

## Role-Based Access Control

| Action | Admin | Member |
|--------|-------|--------|
| Create/delete project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create/delete tasks | ✅ | ❌ |
| Assign tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ |
| View project & tasks | ✅ | ✅ |

---

## Local Setup

### Prerequisites
```
Node.js v18+
PostgreSQL
```

### 1. Clone the repository
```bash
git clone https://github.com/AshuDevX/team-task-manager.git
cd team-task-manager
```

### 2. Create PostgreSQL database
```bash
psql postgres
```
```sql
CREATE DATABASE taskmanager;
CREATE USER taskuser WITH ENCRYPTED PASSWORD 'taskpass';
GRANT ALL PRIVILEGES ON DATABASE taskmanager TO taskuser;
\q
```

### 3. Setup Backend
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://taskuser:taskpass@localhost:5432/taskmanager"
JWT_SECRET="your-secret-key"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

```bash
npm install
npx prisma generate
npx prisma db push
node src/prisma/seed.js
```

### 4. Setup Frontend
```bash
cd ../frontend
cp .env.example .env
npm install
```

`.env` should contain:
```
VITE_API_URL=http://localhost:3001
```

### 5. Run the App

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
# Server running on port 3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
# App running at http://localhost:5173
```

### Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | Admin |
| member@example.com | member123 | Member |

---

## API Endpoints

### Auth
```
POST /api/auth/register   — Create account
POST /api/auth/login      — Login
GET  /api/auth/me         — Get current user
```

### Projects
```
GET    /api/projects                        — List my projects
POST   /api/projects                        — Create project (Admin)
GET    /api/projects/:id                    — Get project with tasks
PUT    /api/projects/:id                    — Update project (Admin)
DELETE /api/projects/:id                    — Delete project (Admin)
POST   /api/projects/:id/members            — Add member (Admin)
DELETE /api/projects/:id/members/:userId    — Remove member (Admin)
```

### Tasks
```
GET    /api/tasks/dashboard                         — Dashboard stats
GET    /api/tasks/project/:projectId                — List project tasks
POST   /api/tasks/project/:projectId                — Create task
PUT    /api/tasks/project/:projectId/:taskId        — Update task
DELETE /api/tasks/project/:projectId/:taskId        — Delete task
```

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # User, Project, Task, ProjectMember models
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js  # Register, Login, GetMe
│   │   │   ├── projectController.js
│   │   │   └── taskController.js
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT auth + role checks
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── projects.js
│   │   │   ├── tasks.js
│   │   │   └── users.js
│   │   ├── prisma/
│   │   │   ├── client.js
│   │   │   └── seed.js
│   │   └── index.js               # Express entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Sidebar navigation
│   │   │   └── TaskModal.jsx      # Create/edit task modal
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Global auth state
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   └── ProjectDetailPage.jsx
│   │   ├── api.js                 # Axios instance with JWT interceptor
│   │   └── App.jsx                # Routes
│   └── package.json
└── README.md
```

---

## Database Schema

```
User          — id, name, email, password, role
Project       — id, name, description, ownerId
ProjectMember — userId, projectId, role (ADMIN/MEMBER)
Task          — id, title, description, status, priority, dueDate, projectId, assigneeId, creatorId
```

---

## Deployment (Railway)

- **Backend** deployed as a Railway service with root directory set to `backend`
- **Frontend** deployed as a separate Railway service with root directory set to `frontend`
- **PostgreSQL** provisioned as a Railway database service
- Environment variables configured per service on Railway dashboard
