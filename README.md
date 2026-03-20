# Cronie 🕐

A cron job management platform that lets you create, schedule, and monitor automated tasks through a REST API — no server cron file editing required.

---

## Features

- **Dynamic Job Scheduling** — create and manage cron jobs via API with standard cron expressions
- **Scheduler Engine** — continuous loop that detects and triggers due jobs at precise times
- **Automated HTTP Execution** — execute scheduled tasks as HTTP API calls with success/failure handling
- **Execution Tracking** — full history of every job run with status, timestamps, and error logs
- **Rate Limiting & Safety Controls** — prevents duplicate executions, enforces minimum cron intervals, and caps concurrent executions
- **Structured Logging** — visibility into scheduler behavior and job execution results

---

## Tech Stack

- **Runtime:** Node.js (ESM)
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Scheduler:** cron-parser
- **HTTP Client:** Axios
- **CI:** GitHub Actions

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account

### Installation

```bash
git clone https://github.com/Aadya-Jha/Cronie.git
cd backend
npm install
```

### Environment Setup

Create a `.env` file in the `backend/` folder:

```
PORT=3000
MONGO_URI=your_mongodb_uri_here
```


### Run the server

```bash
npm run dev
```

---

## API Reference

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/jobs` | Create a new job |
| `PUT` | `/jobs/:id` | Update a job |
| `PATCH` | `/jobs/:id/pause` | Pause a job |
| `PATCH` | `/jobs/:id/resume` | Resume a job |
| `DELETE` | `/jobs/:id` | Delete a job |

### Create Job — Request Body

```json
{
  "name": "My Job",
  "cronExpression": "*/5 * * * *",
  "targetUrl": "https://your-api.com/endpoint",
  "httpMethod": "GET",
  "description": "Runs every 5 minutes"
}
```


## Scheduler Behavior

- Scheduler loop runs every **30 seconds**
- Only picks up jobs with `status = active` and `nextRunAt <= now`
- Updates `lastRunAt`, `lastRunStatus`, and `nextRunAt` after every execution
- Skips jobs that violate rate limits or safety constraints

---

