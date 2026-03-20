# Cronie — Tech Stack

## Backend
- **Node.js** — Runtime for building the scheduler and execution engine
- **Express.js** — REST API framework for job lifecycle management
- **MongoDB** — Database for storing jobs, execution history, and metadata
- **Mongoose** — ODM for schema design and database interactions

## Frontend
- **React.js** — Interactive dashboard for job management
- **JavaScript (ES6+)** — Core language for frontend logic
- **CSS / Tailwind CSS** — Styling and responsive UI design

## Scheduling & Core Logic
- **Cron Parser Libraries (e.g., node-cron / cron-parser)** — Cron expression parsing and validation
- **Custom Scheduler Loop** — Continuous job detection and execution system
- **Axios / Fetch API** — HTTP requests for triggering external endpoints

## DevOps & Deployment
- **Render** — Cloud deployment platform
- **GitHub Actions** — CI/CD pipeline for automated builds and deployments
- **Git & GitHub** — Version control and collaboration

## System Features & Architecture
- **RESTful API Architecture** — Structured endpoints for job operations
- **Modular Backend Design** — Separation of scheduler, execution, and API layers
- **Rate Limiting & Safety Controls** — Prevent abuse and ensure stability
- **Logging & Monitoring** — Execution tracking and system observability

## Future Scope (Planned Enhancements)
- **Retry & Failure Handling Policies**
- **Role-Based Access Control (RBAC)**
- **Advanced Monitoring Dashboard**