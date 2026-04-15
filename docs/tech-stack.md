# Tech Stack

## Backend

- Node.js + Express.js — API server, webhook handling, job scheduling logic, and execution engine.
- Axios — HTTP requests for webhook execution and external integrations.

---

## Frontend

- React — dashboard UI for managing jobs and viewing execution history.
- Chart.js — visualization of execution trends and job activity (optional).
- Tailwind CSS — responsive styling and clean UI components.

---

## AI / Smart Features

**AI-powered cron generation (user-friendly automation)**

- Converts natural language into cron expressions using LLMs (OpenAI / OpenRouter).
- API: `POST /ai/generate-cron`
- Returns:
  - cron expression  
  - human-readable explanation  

- Flow:
  1. User enters natural language (e.g., "run every day at 9 AM").
  2. AI generates cron expression.
  3. System validates it before saving.

- Pros:
  - Reduces user errors  
  - Simplifies cron configuration  
  - Improves usability for non-technical users  

---

## Database

- MongoDB — stores jobs, execution history, user data, and scheduling metadata.
- Redis (optional) — caching job states, rate limiting, and frequently accessed data.

---

## Authentication & Security

- JWT (JSON Web Tokens) — secure user authentication and session handling.
- Password hashing — secure storage of user credentials.
- Middleware-based route protection — ensures only authorized access to APIs.

---

## Notifications & Integrations

- HTTP Webhooks — execute external APIs/services as scheduled jobs.
- (Optional) Slack / Teams Webhooks — notify users about job execution status or failures.