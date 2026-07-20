# TaskFlow

A collaborative task/project tracker — Trello-style boards with real-time updates.

## Stack
- **Backend**: Node.js + Express, Prisma ORM, PostgreSQL, Socket.IO (real-time), JWT auth
- **Frontend**: React (Vite), React Router, Axios, Socket.IO client

## Features
- Auth (register/login, JWT-based)
- Projects with membership (owner/member roles)
- Kanban board per project: drag-and-drop tasks across To Do / In Progress / Done
- Real-time sync across connected clients via WebSockets (task create/update/move/delete)
- Task comments
- File attachments (local disk in dev, swaps to S3 automatically when `UPLOADS_BUCKET` is set)

## Folder structure

```
taskflow/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── api/         # backend API calls
│       ├── components/  # Board, Task, Layout, common
│       ├── pages/        # route-level views
│       ├── hooks/        # useSocket
│       └── context/      # AuthContext
└── server/          # Express backend
    └── src/
        ├── routes/       # thin route → controller wiring
        ├── controllers/  # request/response + validation (zod)
        ├── services/     # business logic (DB access lives here)
        ├── middleware/   # auth guard, error handler
        ├── sockets/       # Socket.IO setup + event emitting
        └── config/        # env, prisma client
```

## Running locally

You need Node 20+ and a local PostgreSQL instance (or use the `docker-compose.yml`
from the deployment package if you have it).

### 1. Backend
```bash
cd server
cp .env.example .env      # edit DATABASE_URL if your Postgres isn't on localhost:5432
npm install
npx prisma migrate dev --name init   # creates tables
npm run dev                # starts on :4000
```

### 2. Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev                # starts on :5173
```

Open `http://localhost:5173`, register an account, create a project, and start
adding tasks. Open a second browser tab (or incognito window) logged in as a
member of the same project to see real-time sync in action.

## Environment variables

**server/.env**
| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | signing secret for auth tokens — use a long random string |
| `CLIENT_ORIGIN` | allowed CORS origin for the frontend |
| `UPLOADS_BUCKET` | leave blank for local disk uploads; set to an S3 bucket name in prod |

**client/.env**
| Var | Purpose |
|---|---|
| `VITE_API_URL` | backend base URL |
| `VITE_WS_URL` | backend WebSocket URL (usually same host as API) |

## API overview

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | create account |
| POST | `/api/auth/login` | get JWT |
| GET | `/api/auth/me` | current user |
| GET/POST | `/api/projects` | list / create projects |
| GET | `/api/projects/:id` | project detail with tasks |
| POST | `/api/projects/:id/members` | add member (owner only) |
| POST | `/api/tasks` | create task |
| PATCH | `/api/tasks/:id/status` | move task (drag-drop) |
| PATCH | `/api/tasks/:id` | edit title/description/assignee |
| DELETE | `/api/tasks/:id` | delete task |
| POST | `/api/tasks/:id/comments` | add comment |
| POST | `/api/uploads/:taskId` | upload attachment |

All routes except register/login require `Authorization: Bearer <token>`.

## Deploying to AWS

This app is designed to drop straight into the Docker + Terraform + ECS Fargate
deployment setup covered separately — the backend already reads `DATABASE_URL`,
`JWT_SECRET`, and `UPLOADS_BUCKET` from the environment (matching what the
Terraform ECS task definition injects via Secrets Manager), and the frontend
build output (`client/dist`) is what gets synced to S3/CloudFront.
