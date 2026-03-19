const jobsContainer = document.getElementById('jobsContainer');
const errorBanner   = document.getElementById('errorBanner');

const showError = (msg) => {
  errorBanner.textContent = msg;
  errorBanner.classList.remove('hidden');
};
const hideError = () => {
  errorBanner.textContent = '';
  errorBanner.classList.add('hidden');
};

const escHtml = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const badgeClass = (status) => {
  if (status === 'active') return 'badge-active';
  if (status === 'paused') return 'badge-paused';
  return 'badge-pending';
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
    const res = await fetch('/jobs');
    if (!res.ok) throw new Error('Failed to load jobs');
    const jobs = await res.json();

    jobsContainer.innerHTML = '';

    if (!jobs.length) {
      jobsContainer.innerHTML = '<p class="empty-state">No jobs yet. Create one using the form →</p>';
      return;
    }

    jobs.forEach((job) => {
      const card = buildJobCard(job);
      jobsContainer.appendChild(card);
    });

  } catch (err) {
    jobsContainer.innerHTML = '';
    showError(err.message);
  }
};

const buildJobCard = (job) => {
  const card = document.createElement('div');
  card.className = 'job-card';
  card.dataset.id = job._id;

  const isPaused = job.status === 'paused';

  card.innerHTML = `
    <div class="job-card-top">
      <span class="job-name">${escHtml(job.name)}</span>
      <span class="badge ${badgeClass(job.status)}">${escHtml(job.status)}</span>
    </div>

    <div class="job-meta">
      <div class="job-meta-row">
        <span>🔗</span>
        <span class="job-url">${escHtml(job.triggerUrl || job.url || '—')}</span>
      </div>
      <div class="job-meta-row">
        <span>⏱</span>
        <span style="font-family:var(--font-mono);font-size:0.78rem">
          ${escHtml(job.schedule || job.cronExpression || job.cron || '—')}
        </span>
      </div>
    </div>

    <div class="job-actions">
      <button class="btn btn-ghost btn-sm" data-action="toggle">
        ${isPaused ? '▶ Resume' : '⏸ Pause'}
      </button>
      <span class="spacer"></span>
      <button class="btn btn-danger btn-sm" data-action="delete">🗑 Delete</button>
    </div>
  `;

  card.querySelector('[data-action="toggle"]')
    .addEventListener('click', () => toggleJob(job._id, job.status));

  card.querySelector('[data-action="delete"]')
    .addEventListener('click', () => deleteJob(job._id, job.name));

  return card;
};

const toggleJob = async (id, currentStatus) => {
  const action = currentStatus === 'paused' ? 'resume' : 'pause';

  try {
    const res = await fetch(`/jobs/${id}/${action}`, { method: 'PATCH' });
    if (!res.ok) throw new Error(`Failed to ${action} job`);
    await loadJobs(); 
  } catch (err) {
    showError(err.message);
  }
};

const deleteJob = async (id, name) => {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`/jobs/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete job');
    }
    await loadJobs();
  } catch (err) {
    showError(err.message);
  }
};

loadJobs();