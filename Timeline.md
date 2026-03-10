# Cronie — Development Timeline

## Roles
- **Member 1 — Scheduler & Execution Engine**
- **Member 2 — Data Model & Job Lifecycle**
- **Member 3 — Reliability & Misuse Analysis**
- **Member 4 — Execution Tracking & Recovery**

---

# Phase 1 — Data Model & Lifecycle (Member 2 Leads)

## Member 2
Design MongoDB schemas:
- Job schema
- Execution metadata fields

Implement APIs:
- Create job
- Update job
- Pause / Resume job
- Delete job

Ensure jobs persist across server restarts.

### Deliverables
- Stable MongoDB schemas
- Job CRUD APIs
- Job lifecycle rules

---

## Member 1
Review schema and ensure fields exist:
- cron expression
- job status
- next run time

**Do NOT start scheduler yet.**

---

## Member 3
Identify misuse cases:
- invalid cron expressions
- extremely frequent schedules

---

## Member 4
Define execution status model:
- pending
- running
- completed
- failed

---

# Phase 2 — Scheduling & Execution Core (Member 1 Leads)

## Member 1
Implement scheduler engine:
- cron expression handling
- scheduler loop
- detect jobs to run
- execute HTTP API calls
- handle success / failure

Update job metadata:
- lastRunTime
- nextRunTime

### Deliverables
- Jobs execute at correct times
- Reliable scheduler execution

---

## Member 2
Ensure lifecycle rules are respected after execution.

---

## Member 4
Implement execution tracking storage:

Store:
- executionId
- jobId
- startTime
- endTime
- status
- error

---

## Member 3
Observe scheduler behavior and identify:
- overlapping executions
- missed runs
- frequent jobs

---

# Phase 3 — Execution Safety & Observability

## Member 4
Implement execution state transitions:

pending → running → completed / failed

Prevent duplicate executions:
- skip execution if the same job is already running

Implement execution history API:

GET /jobs/:jobId/executions

### Deliverables
- execution tracking
- duplicate execution protection
- execution history retrieval

---

## Member 1
Implement scheduler safety controls and **rate limiting**.

Examples:
- max executions per minute
- max concurrent executions
- minimum cron interval

Scheduler should skip jobs that violate limits.

### Deliverables
- rate limiting
- scheduler safety checks

---

## Member 3
Support testing and identify edge cases:
- overlapping schedules
- repeated failures

---

# Phase 4 — Integration & Minimal Frontend

## Member 2
Build **Jobs Dashboard**
- list jobs
- pause / resume / delete

APIs:
GET /jobs  
PATCH /jobs/:id  
DELETE /jobs/:id

---

## Member 3
Build **Create Job Form**

Fields:
- job name
- cron expression
- HTTP method
- target URL

API:
POST /jobs

---

## Member 4
Build **Execution History View**

Show past job runs.

API:
GET /jobs/:jobId/executions

---

## Member 1
Assist with **frontend ↔ backend integration**
and ensure scheduler updates are reflected correctly.

---

# Final Deliverables
- Cron job scheduler
- Webhook/API execution
- MongoDB persistence
- Execution tracking
- Rate limiting
- Execution history API
- Minimal frontend dashboard