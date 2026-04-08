# Cronie — Distributed Job Scheduler

Cronie is a production-ready cron job scheduling system that allows users to create, manage, and monitor scheduled jobs with built-in rate limiting, execution tracking, and AI-powered cron expression generation.

---

## Team Roles

- Member 1 — Scheduler & Execution Engine  
- Member 2 — Data Model, Lifecycle & Authentication  
- Member 3 — Reliability & Misuse Analysis  
- Member 4 — Execution Tracking & AI Features  

---

## Core Features

- Cron-based job scheduling  
- HTTP webhook execution  
- Persistent storage using MongoDB  
- Execution tracking and history  
- Rate limiting and safety controls  
- User authentication and access control  
- AI-powered cron expression generation  

---

## Development Timeline

---

## Phase 1 — Data Model & Lifecycle (Member 2 Leads)

### Member 2
- Design MongoDB schemas:
  - Job schema  
  - Execution metadata fields  

- Implement APIs:
  - Create job  
  - Update job  
  - Pause / Resume job  
  - Delete job  

- Ensure persistence across server restarts  

#### Deliverables
- Stable MongoDB schemas  
- Job CRUD APIs  
- Job lifecycle rules  

---

### Member 1
- Review schema to ensure presence of:
  - cron expression  
  - job status  
  - next run time  

---

### Member 3
- Identify misuse cases:
  - invalid cron expressions  
  - overly frequent schedules  

---

### Member 4
- Define execution states:
  - pending  
  - running  
  - completed  
  - failed  

---

## Phase 2 — Scheduling & Execution Core (Member 1 Leads)

### Member 1
- Implement scheduler engine:
  - cron parsing  
  - scheduler loop  
  - job execution  
  - HTTP request handling  
  - success and failure handling  

- Update job metadata:
  - lastRunTime  
  - nextRunTime  

#### Deliverables
- Accurate job execution  
- Reliable scheduler engine  

---

### Member 2
- Ensure lifecycle rules are respected after execution  

---

### Member 4
- Implement execution tracking storage:
  - executionId  
  - jobId  
  - startTime  
  - endTime  
  - status  
  - error logs  

---

### Member 3
- Observe scheduler behavior and identify:
  - overlapping executions  
  - missed runs  
  - excessive execution frequency  

---

## Phase 3 — Execution Safety & Observability

### Member 4
- Implement execution state transitions:
  - pending → running → completed / failed  

- Prevent duplicate executions  

- Implement API:
  - GET /jobs/:jobId/executions  

#### Deliverables
- Execution tracking system  
- Duplicate execution prevention  
- Execution history API  

---

### Member 1
- Implement scheduler safety controls:
  - maximum executions per minute  
  - maximum concurrent executions  
  - minimum cron interval  

#### Deliverables
- Rate limiting mechanisms  
- Scheduler safety checks  

---

### Member 3
- Support testing and identify edge cases:
  - overlapping schedules  
  - repeated failures  

---

## Phase 4 — Integration & Minimal Frontend

### Member 2
- Build Jobs Dashboard:
  - list jobs  
  - pause / resume  
  - delete jobs  

- APIs:
  - GET /jobs  
  - PATCH /jobs/:id  
  - DELETE /jobs/:id  

---

### Member 3
- Build Create Job Form:
  - job name  
  - cron expression  
  - HTTP method  
  - target URL  

- API:
  - POST /jobs  

---

### Member 4
- Build Execution History View  

- API:
  - GET /jobs/:jobId/executions  

---

### Member 1
- Assist with frontend-backend integration  
- Ensure scheduler updates are reflected correctly  

---

## Phase 5 — Security, Rate Limiting & AI

### Member 2 — Authentication & Access Control (Lead)

#### Authentication
- Design user schema:
  - name  
  - email  
  - password (hashed)  

- Implement APIs:
  - POST /auth/register  
  - POST /auth/login  

- Use JWT-based authentication  

---

#### Authorization
- Associate each job with a userId  
- Ensure users can:
  - view only their jobs  
  - update only their jobs  
  - delete only their jobs  

---

#### Route Protection
- Implement authentication middleware  
- Protect:
  - job APIs  
  - execution APIs  

---

#### Deliverables
- Secure authentication system  
- User-based access control  
- Protected endpoints  

---

### Member 1 — Advanced Rate Limiting

#### Per-User Limits
- Maximum jobs per user  
- Maximum executions per minute per user  

---

#### Global Limits
- Maximum concurrent jobs  
- System-wide throttling  

---

#### API Rate Limiting
- Limit requests for:
  - job creation  
  - login attempts  

---

#### Cron Validation Guardrails
- Reject unsafe schedules:
  - "* * * * *"  
  - extremely frequent executions  

---

#### Deliverables
- Abuse prevention mechanisms  
- Stable system under load  

---

### Member 4 — AI-Powered Cron Generator

#### API
POST /ai/generate-cron  

### Implementation
- Integrate AI model (OpenAI / OpenRouter)  
- Convert natural language to cron expression  
- Return both cron expression and explanation  

---

### Validation
- Validate generated cron expressions  
- Reject unsafe or invalid schedules  

---

### Deliverables
- Natural language to cron conversion  
- Improved user experience  
- Reduced configuration errors  