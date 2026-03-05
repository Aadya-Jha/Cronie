# Cronie — Development Timeline

## Roles

- **Member 1** — Scheduler & Execution Engine  
- **Member 2** — Data Model & Job Lifecycle  
- **Member 3** — Reliability & Misuse Analysis  
- **Member 4** — Execution Tracking & Recovery  

---

# Phase 1 — Data Model & Lifecycle (Member 2 Leads)

This phase **must start first** because the entire system depends on the data model.

## Member 2 (Primary Owner)

Design MongoDB schemas:

- Job schema
- Execution metadata fields (basic)

Define job lifecycle rules.

Implement APIs:

- Create job
- Update job
- Pause / Resume job
- Delete job

Ensure jobs persist across server restarts.

### Deliverables

- Stable MongoDB schemas
- Working job CRUD APIs
- Clearly defined job lifecycle states

---

## Member 1

Review schema from a scheduler perspective.

Ensure required fields exist:

- cron expression
- job status
- next run time

**Do NOT start scheduler implementation yet.**

---

## Member 3 (Design Support)

Identify misuse cases such as:

- Invalid cron expressions
- Extremely frequent schedules
- Potential abuse scenarios

---

## Member 4 (Design Support)

Define execution status model:

- pending
- running
- completed
- failed

---

# Phase 2 — Scheduling & Execution Core (Member 1 Leads)

This phase begins once **Phase 1 schemas are stable**.

## Member 1 (Primary Owner)

Implement cron expression handling.

Build scheduler engine:

- Scheduler loop
- Time-based job detection

Detect when jobs should run.

Trigger execution only for:

- Active jobs

Execute HTTP API calls.

Handle:

- Success
- Failure

Update job metadata:

- lastRunTime
- nextRunTime

### Deliverables

- Jobs execute at correct times
- Scheduler triggers executions reliably

---

## Member 2 (Support)

Help update job lifecycle state after execution.

Ensure lifecycle rules are respected.

---

## Member 4

Implement execution tracking storage.

Store:

- executionId
- jobId
- startTime
- endTime
- status
- error (if any)

---

## Member 3

Observe scheduler behavior.

Identify possible failure scenarios:

- Overlapping executions
- Missed runs
- Very frequent jobs

---

# Phase 3 — Execution Orchestration & Safety (Members 3 & 4 Lead)

At this point the system works, but needs **reliability and safety controls**.

## Member 4 (Primary Owner)

Implement execution state transitions:

```
pending → running → completed / failed
```

Prevent duplicate executions:

- Ensure same job cannot run twice simultaneously

Add basic retry logic:

- Retry failed executions once

Mark interrupted executions correctly.

### Deliverables

- Clean execution records
- Predictable execution behavior

---

## Member 3 (Primary Owner)

Define execution constraints:

- Maximum schedule frequency
- Invalid cron detection

Identify abuse scenarios.

Propose safeguards:

- Block extremely frequent jobs
- Add audit logging fields

### Deliverables

- Reliability and safety rules
- Integrated validation checks

---

## Member 1 (Reviewer)

Ensure scheduler respects:

- Execution locks
- Constraint checks

Minimal scheduler changes only.

---

# Phase 4 — Hardening & Integration (All Members)

Final phase focuses on **stability, testing, and documentation**.

## Team Tasks

Test the full job lifecycle:

```
create → schedule → execute → log → retry
```

Simulate failure scenarios:

- API timeouts
- Invalid cron expressions

Fix race conditions.

Add structured logging (Winston).

Prepare documentation:

- README
- Architecture diagrams

---

# Final Deliverables

- Fully integrated Cronie MVP
- Reliable scheduler & execution engine
- Execution tracking & logging
- Documentation and system diagrams