const jobsContainer = document.getElementById("jobsContainer");
const errorBanner = document.getElementById("errorBanner");
const createJobBtn = document.getElementById("createJobBtn");

const jobNameInput = document.getElementById("jobName");
const cronInput = document.getElementById("cron");
const methodInput = document.getElementById("method");
const urlInput = document.getElementById("url");

const showError = (msg) => {
  errorBanner.textContent = msg;
  errorBanner.classList.remove("hidden");
};

const hideError = () => {
  errorBanner.textContent = "";
  errorBanner.classList.add("hidden");
};

const escHtml = (str) => {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

const authFetch = (url, options = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });
};

/* ---------------- LOAD JOBS ---------------- */

const loadJobs = async () => {
  hideError();

  try {
    const res = await authFetch("/jobs");

    if (!res.ok) throw new Error("Failed to load jobs");

    const jobs = await res.json();

    jobsContainer.innerHTML = "";

    if (!jobs.length) {
      jobsContainer.innerHTML =
        '<p class="empty-state">No jobs yet. Create one using the form →</p>';
      return;
    }

    jobs.forEach((job) => {
      const card = buildJobCard(job);
      jobsContainer.appendChild(card);
    });
  } catch (err) {
    jobsContainer.innerHTML = "";
    showError(err.message);
  }
};

/* ---------------- CREATE JOB ---------------- */

async function createJob(){

  const name = jobNameInput.value.trim();
  const cronExpression = cronInput.value.trim();
  const httpMethod = methodInput.value;
  const targetUrl = urlInput.value.trim();

  if(!name || !cronExpression || !targetUrl){
    showError("Name, cron and URL are required");
    return;
  }

  try{

    const res = await authFetch("/jobs",{
      method:"POST",
      body:JSON.stringify({
        name,
        cronExpression,
        targetUrl,
        httpMethod
      })
    });

    const data = await res.json();

    if(!res.ok){
      throw new Error(data.error || "Failed to create job");
    }

    await loadJobs();

  }catch(err){
    showError(err.message);
  }
}
/* ---------------- JOB CARD ---------------- */

const buildJobCard = (job) => {
  const card = document.createElement("div");
  card.className = "job-card";

  const isPaused = job.status === "paused";

  card.innerHTML = `
    <div class="job-card-top">
      <span class="job-name">${escHtml(job.name)}</span>
      <span class="badge">${escHtml(job.status)}</span>
    </div>

    <div class="job-meta">
      <div>🔗 ${escHtml(job.targetUrl)}</div>
      <div>⏱ ${escHtml(job.cronExpression)}</div>
    </div>

    <div class="job-actions">
      <button data-action="toggle">
        ${isPaused ? "▶ Resume" : "⏸ Pause"}
      </button>

      <button data-action="delete">Delete</button>
    </div>
  `;

  card
    .querySelector('[data-action="toggle"]')
    .addEventListener("click", () => toggleJob(job._id, job.status));

  card
    .querySelector('[data-action="delete"]')
    .addEventListener("click", () => deleteJob(job._id));

  return card;
};

/* ---------------- PAUSE / RESUME ---------------- */

const toggleJob = async (id, status) => {
  const action = status === "paused" ? "resume" : "pause";

  try {
    const res = await authFetch(`/jobs/${id}/${action}`, {
      method: "PATCH",
    });

    if (!res.ok) throw new Error("Failed to update job");

    await loadJobs();
  } catch (err) {
    showError(err.message);
  }
};

/* ---------------- DELETE ---------------- */

const deleteJob = async (id) => {
  if (!confirm("Delete this job?")) return;

  try {
    const res = await authFetch(`/jobs/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete job");

    await loadJobs();
  } catch (err) {
    showError(err.message);
  }
};

/* ---------------- EVENT LISTENERS ---------------- */

if (createJobBtn) {
  createJobBtn.addEventListener("click", createJob);
}

/* ---------------- AUTH GUARD ---------------- */

if (!localStorage.getItem("token")) {
  window.location.href = "/login.html";
} else {
  loadJobs();
}