const jobsContainer = document.getElementById("jobsContainer");
const errorBanner = document.getElementById("errorBanner");

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

const badgeClass = (status) => {
  if (status === "active") return "badge-active";
  if (status === "paused") return "badge-paused";
  return "badge-pending";
};

const showSkeleton = () => {
  jobsContainer.innerHTML = `
    <div class="skeleton-wrap">
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    </div>`;
};

const loadJobs = async () => {
  showSkeleton();
  hideError();

  try {
    const res = await fetch("/jobs");
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

const buildJobCard = (job) => {
  const card = document.createElement("div");
  card.className = "job-card";
  card.dataset.id = job._id;

  const isPaused = job.status === "paused";

  card.innerHTML = `
    <div class="job-card-top">
      <span class="job-name">${escHtml(job.name)}</span>
      <span class="badge ${badgeClass(job.status)}">${escHtml(job.status)}</span>
    </div>

    <div class="job-meta">
      <div class="job-meta-row">
        <span>🔗</span>
        <span class="job-url">${escHtml(job.triggerUrl || job.url || "—")}</span>
      </div>
      <div class="job-meta-row">
        <span>⏱</span>
        <span style="font-family:var(--font-mono);font-size:0.78rem">
          ${escHtml(job.schedule || job.cronExpression || job.cron || "—")}
        </span>
      </div>
    </div>

    <div class="job-actions">
      <button class="btn btn-ghost btn-sm" data-action="toggle">
        ${isPaused ? "▶ Resume" : "⏸ Pause"}
      </button>
      <span class="spacer"></span>
      <button class="btn btn-danger btn-sm" data-action="delete">🗑 Delete</button>
    </div>
  `;

  card
    .querySelector('[data-action="toggle"]')
    .addEventListener("click", () => toggleJob(job._id, job.status));

  card
    .querySelector('[data-action="delete"]')
    .addEventListener("click", () => deleteJob(job._id, job.name));

  return card;
};

const toggleJob = async (id, currentStatus) => {
  const action = currentStatus === "paused" ? "resume" : "pause";

  try {
    const res = await fetch(`/jobs/${id}/${action}`, { method: "PATCH" });
    if (!res.ok) throw new Error(`Failed to ${action} job`);
    await loadJobs();
  } catch (err) {
    showError(err.message);
  }
};

const deleteJob = async (id, name) => {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`/jobs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to delete job");
    }
    await loadJobs();
  } catch (err) {
    showError(err.message);
  }
};
const aiPromptInput = document.getElementById("aiPromptInput");
const aiGenerateBtn = document.getElementById("aiGenerateBtn");
const aiErrorBanner = document.getElementById("aiErrorBanner");
const aiResultContainer = document.getElementById("aiResultContainer");
const aiSafetyBadge = document.getElementById("aiSafetyBadge");
const aiConfidence = document.getElementById("aiConfidence");
const aiCronExpression = document.getElementById("aiCronExpression");
const aiCopyBtn = document.getElementById("aiCopyBtn");
const aiExplanation = document.getElementById("aiExplanation");
const aiNextRunTimes = document.getElementById("aiNextRunTimes");
const aiWarningsContainer = document.getElementById("aiWarningsContainer");
const aiUseCronBtn = document.getElementById("aiUseCronBtn");
const aiRegenerateBtn = document.getElementById("aiRegenerateBtn");
const cronField = document.getElementById("cron");

let currentAICron = null;

const showAILoading = () => {
  aiGenerateBtn.disabled = true;
  aiGenerateBtn.querySelector(".btn-text").classList.add("hidden");
  aiGenerateBtn.querySelector(".btn-loader").classList.remove("hidden");
  aiErrorBanner.classList.add("hidden");
  aiResultContainer.classList.add("hidden");
};

const hideAILoading = () => {
  aiGenerateBtn.disabled = false;
  aiGenerateBtn.querySelector(".btn-text").classList.remove("hidden");
  aiGenerateBtn.querySelector(".btn-loader").classList.add("hidden");
};

const showAIError = (msg) => {
  aiErrorBanner.textContent = msg;
  aiErrorBanner.classList.remove("hidden");
};

const hideAIError = () => {
  aiErrorBanner.textContent = "";
  aiErrorBanner.classList.add("hidden");
};

const formatDateTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const generateCron = async () => {
  const prompt = aiPromptInput.value.trim();

  if (!prompt) {
    showAIError("Please enter a schedule description");
    return;
  }

  if (prompt.length < 5) {
    showAIError("Description too short. Please provide more detail");
    return;
  }

  showAILoading();
  hideAIError();

  try {
    const res = await fetch("/ai/generate-cron", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to generate cron expression");
    }

    displayAIResult(data.data);
  } catch (err) {
    showAIError(err.message);
  } finally {
    hideAILoading();
  }
};

const displayAIResult = (result) => {
  currentAICron = result.cronExpression;

  aiCronExpression.textContent = result.cronExpression;

  const badgeClass =
    result.safetyRating === "safe"
      ? "ai-badge-success"
      : result.safetyRating === "caution"
        ? "ai-badge-caution"
        : "ai-badge-unsafe";

  aiSafetyBadge.className = `ai-badge ${badgeClass}`;
  aiSafetyBadge.textContent =
    result.safetyRating === "safe"
      ? "Safe"
      : result.safetyRating === "caution"
        ? "Caution"
        : "Unsafe";

  aiConfidence.textContent = `Confidence: ${Math.round(result.confidence * 100)}%`;

  aiExplanation.textContent = result.explanation;

  if (result.nextRunTimes && result.nextRunTimes.length > 0) {
    aiNextRunTimes.innerHTML = result.nextRunTimes
      .map((t) => `<div>- ${formatDateTime(t)}</div>`)
      .join("");
  }

  if (result.warnings && result.warnings.length > 0) {
    aiWarningsContainer.innerHTML = result.warnings
      .map((w) => `<div>${escHtml(w)}</div>`)
      .join("");
    aiWarningsContainer.classList.remove("hidden");
  } else {
    aiWarningsContainer.classList.add("hidden");
  }

  aiResultContainer.classList.remove("hidden");
};

const useCronExpression = () => {
  if (currentAICron) {
    cronField.value = currentAICron;
    cronField.focus();
    aiResultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
};

const copyToClipboard = async () => {
  if (!currentAICron) return;

  try {
    await navigator.clipboard.writeText(currentAICron);
    const originalText = aiCopyBtn.textContent;
    aiCopyBtn.textContent = "Copied";
    setTimeout(() => {
      aiCopyBtn.textContent = "Copy";
    }, 2000);
  } catch {
    aiCopyBtn.textContent = "Failed";
    setTimeout(() => {
      aiCopyBtn.textContent = "Copy";
    }, 2000);
  }
};

aiGenerateBtn.addEventListener("click", generateCron);

aiPromptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    generateCron();
  }
});

aiUseCronBtn.addEventListener("click", useCronExpression);
aiCopyBtn.addEventListener("click", copyToClipboard);
aiRegenerateBtn.addEventListener("click", () => {
  if (aiPromptInput.value.trim()) {
    generateCron();
  }
});

const placeholders = [
  "e.g., Run every day at 3am",
  "e.g., Execute every Monday at 9:30 AM",
  "e.g., Run at midnight on the 1st of every month",
  "e.g., Execute every weekday at 2:30 PM",
  "e.g., Run every 15 minutes",
];

let placeholderIndex = 0;
setInterval(() => {
  placeholderIndex = (placeholderIndex + 1) % placeholders.length;
  aiPromptInput.placeholder = placeholders[placeholderIndex];
}, 4000);

loadJobs();
