# 🚀 TaskFlow — Team Task Manager

A full-stack team task management app with role-based access control (Admin/Member).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (JSON Web Tokens) |
| Deployment | Railway |

## Features

- 🔐 **Authentication** — Signup/Login with JWT
- 📁 **Project Management** — Create, update, delete projects
- 👥 **Team Management** — Add/remove members with Admin or Member roles
- ✅ **Task Tracking** — Create tasks with title, description, status, priority, due date, assignee
- 📊 **Dashboard** — Personal task overview with overdue alerts
- 🔒 **Role-Based Access** — Admins manage everything; members update task status only

---

## 🖥️ Local Setup (macOS + VS Code)

### Prerequisites
Make sure you have these installed:
```bash
node --version      # Should be v18+
npm --version       # Should be v9+
psql --version      # PostgreSQL
```

### Install Node.js (if needed)
```bash
# Using Homebrew
brew install node
```

### Install PostgreSQL (if needed)
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Step 1 — Clone / Download the project
```bash
cd ~/Desktop
# If git repo:
git clone <your-repo-url> team-task-manager
cd team-task-manager

# Or just open the folder in VS Code:
code .
```

### Step 2 — Create the database
```bash
psql postgres
```
Inside psql:
```sql
CREATE DATABASE taskmanager;
CREATE USER taskuser WITH ENCRYPTED PASSWORD 'taskpass';
GRANT ALL PRIVILEGES ON DATABASE taskmanager TO taskuser;
\q
```

### Step 3 — Setup Backend
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
DATABASE_URL="postgresql://taskuser:taskpass@localhost:5432/taskmanager"
JWT_SECRET="your-random-secret-string-here"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Then install and setup:
```bash
npm install
npx prisma generate
npx prisma db push
node src/prisma/seed.js
```

### Step 4 — Setup Frontend
```bash
cd ../frontend
cp .env.example .env
# The default VITE_API_URL=http://localhost:5000 is correct for local dev
npm install
```

### Step 5 — Run the App

Open **two terminal tabs** in VS Code (`Ctrl+Shift+`` `):

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → Server running on port 5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → App running at http://localhost:5173
```

Open http://localhost:5173 in your browser.

### Demo Accounts (after seed)
| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | Admin |
| member@example.com | member123 | Member |

---

## 🌐 Railway Deployment

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/team-task-manager.git
git push -u origin main
```

### Step 2 — Create Railway Account
Go to [railway.app](https://railway.app) and sign up with GitHub.

### Step 3 — Deploy Backend

1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Select your repository
3. Click **"Add service"** → select the `backend` folder (or set root directory to `backend`)
4. Click **"Add service"** → **"Database"** → **"PostgreSQL"**
5. In your backend service, go to **Variables** tab and add:
   ```
   JWT_SECRET=your-random-long-secret-here
   NODE_ENV=production
   FRONTEND_URL=https://YOUR-FRONTEND-URL.railway.app
   ```
6. Railway auto-injects `DATABASE_URL` from the PostgreSQL service.
7. The `railway.json` config runs migrations automatically on deploy.

### Step 4 — Deploy Frontend

1. In the same Railway project, click **"New Service"** → **"GitHub Repo"**
2. Set root directory to `frontend`
3. Add variable:
   ```
   VITE_API_URL=https://YOUR-BACKEND-URL.railway.app
   ```
4. Deploy — Railway builds with `npm run build` and serves the `dist/` folder.

### Step 5 — Run Seeds on Railway (optional demo data)
In Railway backend service → **"Shell"** tab:
```bash
node src/prisma/seed.js
```

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
GET    /api/projects                          — List my projects
POST   /api/projects                          — Create project
GET    /api/projects/:id                      — Get project details
PUT    /api/projects/:id                      — Update project (Admin)
DELETE /api/projects/:id                      — Delete project (Admin)
POST   /api/projects/:id/members              — Add member (Admin)
DELETE /api/projects/:id/members/:userId      — Remove member (Admin)
```

### Tasks
```
GET    /api/tasks/dashboard                   — My dashboard stats
GET    /api/tasks/project/:projectId          — List project tasks
POST   /api/tasks/project/:projectId          — Create task
PUT    /api/tasks/project/:projectId/:taskId  — Update task
DELETE /api/tasks/project/:projectId/:taskId  — Delete task
```

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database models
│   ├── src/
│   │   ├── controllers/        # Business logic
│   │   ├── middleware/         # Auth + role checks
│   │   ├── routes/             # API routes
│   │   ├── prisma/             # DB client + seed
│   │   └── index.js            # Express app entry
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI
│   │   ├── context/            # Auth context
│   │   ├── pages/              # Route pages
│   │   ├── api.js              # Axios client
│   │   └── App.jsx             # Routes
│   └── package.json
└── README.md
```
