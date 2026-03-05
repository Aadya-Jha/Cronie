# Tech Stack

## Backend

**Node.js + Express.js**  
Primary backend framework used to build the API server, handle GitHub webhooks, and process dependency scanning logic.

**Axios**  
Used for making HTTP requests to external services such as the GitHub API and vulnerability data sources.

---

## Frontend

**React**  
Used to build the interactive dashboard for visualizing repository risk, vulnerabilities, and dependency insights.

**Chart.js**  
Provides visualizations such as risk graphs, version-gap charts, and historical dependency risk trends.

**Tailwind CSS**  
Utility-first CSS framework used to build responsive and clean UI components for the dashboard.

---

## AI / Risk Analysis

The platform uses **embedding-based similarity search combined with LLM reasoning** to analyze vulnerabilities in context.

### Embedding + Vector Database

- Vulnerability data is preprocessed into vector embeddings.
- Embeddings are stored in a vector database such as **Pinecone, Weaviate, or Milvus**.
- Enables fast similarity search across thousands of vulnerability records.

### AI Query Flow

1. A developer opens the dashboard or triggers a repository scan.
2. The system extracts repository dependencies.
3. Dependency data is compared against vulnerability embeddings in the vector database.
4. Relevant context is sent to an LLM to generate:
   - Risk explanations
   - Dependency prioritization
   - Suggested upgrade paths.

### Advantages

- Scales efficiently across large vulnerability datasets.
- Enables contextual reasoning instead of simple severity matching.
- Helps developers understand *why* a dependency is risky and how to fix it.

---

## Database

**PostgreSQL**  
Stores structured application data including:

- Dependency states
- Risk scores
- Scan history
- Repository metadata

**Vector Database**

Stores vulnerability embeddings used for AI-driven similarity search and contextual analysis.

**Redis (Optional)**

Used for caching:

- Dependency lookup results
- Webhook events
- Frequently accessed vulnerability data

---

## Notifications & Integrations

**GitHub API**

- Fetch repository metadata
- Create automated GitHub issues for critical vulnerabilities
- Post comments on pull requests

**Slack API / Microsoft Teams Webhooks**

- Send alerts when high-risk vulnerabilities are detected
- Notify development teams about important security updates