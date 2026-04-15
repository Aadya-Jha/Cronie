# Workflow

## 1. Rough Workflow (Core Features Only)

### Step 1 — User Authentication

- User registers or logs in using secure authentication.
- JWT token is issued and used for all protected API requests.
- Each job is associated with a specific user.

---

### Step 2 — Job Creation

- User creates a job from the dashboard by providing:
  - job name  
  - cron expression  
  - HTTP method  
  - target URL  
- (Optional) User can generate cron expression using AI.
- Job is stored in the database with initial metadata:
  - status (active/paused)  
  - nextRunTime  

---

### Step 3 — Scheduler Trigger

- Scheduler loop continuously runs in the backend.
- Checks all active jobs and compares current time with `nextRunTime`.
- If condition matches → job is triggered.

---

### Step 4 — Job Execution

- System sends HTTP request to the target URL (webhook execution).
- Execution result is captured:
  - success / failure  
  - response data / error logs  

---

### Step 5 — Execution Tracking

- Each execution is stored with:
  - executionId  
  - jobId  
  - startTime  
  - endTime  
  - status (pending → running → completed/failed)  
- Prevents duplicate or overlapping executions.

---

### Step 6 — Safety & Validation

- Validate cron expressions before execution.
- Apply rate limiting:
  - max executions per minute  
  - max concurrent jobs  
- Reject unsafe schedules (e.g., extremely frequent jobs).

---

### Step 7 — Dashboard Update

- Dashboard reflects:
  - job status  
  - execution history  
  - last run & next run times  
- Users can:
  - pause/resume jobs  
  - delete jobs  
  - view execution logs  

---

## 2. High-Level Architecture (Core Features Only)

User (Dashboard UI)
→ Frontend (React)
→ Backend (Node.js + Express)

### Backend Components

- Auth Manager — handles login, JWT, and user validation.  
- Job Manager — manages job lifecycle (CRUD operations).  
- Scheduler Engine — parses cron expressions and triggers jobs.  
- Execution Engine — performs HTTP requests and handles responses.  
- Execution Tracker — logs execution history and states.  
- Rate Limiter — prevents abuse and overload.  
- AI Module — generates cron expressions from natural language (optional).  

→ Database (MongoDB)

- Jobs collection  
- Execution history  
- User data  

→ External Systems

- Webhook targets (APIs being called by jobs)  
- Optional notification systems (Slack / Teams)  

---

## 3. Component Descriptions

### Backend

- Auth Manager: manages authentication and secure access.  
- Job Manager: handles job creation, updates, and lifecycle.  
- Scheduler Engine: continuously evaluates cron schedules.  
- Execution Engine: executes HTTP requests for jobs.  
- Execution Tracker: records all execution details.  
- Rate Limiter: enforces system safety and limits.  

---

### Database

- Stores:
  - job configurations  
  - execution logs  
  - user credentials  

---

### Frontend (Dashboard)

- Displays:
  - job list  
  - execution history  
  - job status and timing  
- Allows:
  - job creation  
  - manual control (pause/resume/delete)  
  - AI cron generation  

---

### External Integrations

- Webhooks: execute external APIs/services.  
- Notifications (optional): alert users on failures or important events.