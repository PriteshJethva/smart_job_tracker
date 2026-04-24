import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";
const API_ERROR = "Cannot connect to API. Make sure backend is running on port 5000.";

const STATUSES = ["Applied", "Interview", "Offer", "Rejected"];
const PRIORITIES = ["High", "Medium", "Low"];

const EMPTY_FORM = {
  company: "",
  role: "",
  location: "",
  salary: "",
  appliedDate: new Date().toISOString().split("T")[0],
  status: "Applied",
  priority: "Medium",
  notes: "",
};

async function getJson(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

async function sendRequest(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
}

async function fetchJobsData({ search, filterStatus, filterPriority }) {
  const params = new URLSearchParams();

  if (filterStatus) {
    params.set("status", filterStatus);
  }

  if (filterPriority) {
    params.set("priority", filterPriority);
  }

  if (search) {
    params.set("search", search);
  }

  const query = params.toString();
  const url = query ? `${API}/jobs?${query}` : `${API}/jobs`;
  const data = await getJson(url);

  return Array.isArray(data.data) ? data.data : [];
}

async function fetchStatsData() {
  const data = await getJson(`${API}/jobs/stats`);
  return data.data || {};
}

function getTone(label) {
  return String(label || "").toLowerCase();
}

function getValidDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, options = {}) {
  const date = getValidDate(value);

  if (!date) {
    return value || "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

function Badge({ label, type = "status" }) {
  return <span className={`badge badge-${type} tone-${getTone(label)}`}>{label}</span>;
}

function MetricCard({ label, value, detail, tone }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <p className="metric-label">{label}</p>
      <strong className="metric-value">{value}</strong>
      <p className="metric-detail">{detail}</p>
    </article>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="meta-item">
      <span className="meta-label">{label}</span>
      <strong className="meta-value">{value}</strong>
    </div>
  );
}

function StateCard({ eyebrow, title, description, action }) {
  return (
    <div className="state-card">
      <span className="state-eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function JobCard({ job, onEdit, onDelete, onStatusChange }) {
  return (
    <article className={`job-card tone-${getTone(job.status)}`}>
      <div className="job-card-header">
        <div className="job-title-group">
          <span className="job-company">{job.company}</span>
          <h3 className="job-role">{job.role}</h3>
        </div>

        <div className="job-badges">
          <Badge label={job.status} />
          <Badge label={job.priority} type="priority" />
        </div>
      </div>

      <div className="job-meta-grid">
        <MetaItem label="Location" value={job.location || "Not provided"} />
        <MetaItem label="Salary" value={job.salary || "Not shared"} />
        <MetaItem label="Applied" value={formatDate(job.appliedDate)} />
        <MetaItem label="Next step" value={job.status === "Applied" ? "Awaiting reply" : job.status} />
      </div>

      {job.notes ? (
        <div className="job-notes">
          <span>Notes</span>
          <p>{job.notes}</p>
        </div>
      ) : null}

      <div className="job-actions">
        <label className="job-action-field">
          <span className="field-label">Move stage</span>
          <select
            className="select-control"
            value={job.status}
            onChange={(event) => onStatusChange(job.id, event.target.value)}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(job)}>
          Edit
        </button>

        <button className="btn btn-danger btn-sm" onClick={() => onDelete(job.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}

function Modal({ isEditing, form, setForm, onSave, onClose }) {
  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <span className="section-kicker">{isEditing ? "Edit application" : "New application"}</span>
            <h2>{isEditing ? "Update this opportunity" : "Add a role to your pipeline"}</h2>
            <p className="modal-copy">
              Keep the essentials here now. You can always return and update the stage later.
            </p>
          </div>

          <button className="modal-close" aria-label="Close dialog" onClick={onClose}>
            x
          </button>
        </div>

        <div className="form-layout">
          <label className="form-field">
            <span className="field-label">Company *</span>
            <input
              className="input-control"
              value={form.company}
              onChange={(event) => setForm({ ...form, company: event.target.value })}
              placeholder="Google"
            />
          </label>

          <label className="form-field">
            <span className="field-label">Role *</span>
            <input
              className="input-control"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
              placeholder="Frontend Developer"
            />
          </label>

          <div className="form-grid">
            <label className="form-field">
              <span className="field-label">Location</span>
              <input
                className="input-control"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                placeholder="Remote"
              />
            </label>

            <label className="form-field">
              <span className="field-label">Salary</span>
              <input
                className="input-control"
                value={form.salary}
                onChange={(event) => setForm({ ...form, salary: event.target.value })}
                placeholder="INR 18,00,000"
              />
            </label>
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span className="field-label">Status</span>
              <select
                className="select-control"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="field-label">Priority</span>
              <select
                className="select-control"
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value })}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="form-field">
            <span className="field-label">Applied date</span>
            <input
              type="date"
              className="input-control"
              value={form.appliedDate}
              onChange={(event) => setForm({ ...form, appliedDate: event.target.value })}
            />
          </label>

          <label className="form-field">
            <span className="field-label">Notes</span>
            <textarea
              className="textarea-control"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Anything worth remembering about the role, recruiter, or next step."
            />
          </label>
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <button className="btn btn-primary" onClick={onSave}>
            {isEditing ? "Save changes" : "Add application"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalTracked = stats.total ?? jobs.length;
  const appliedCount = stats.applied ?? 0;
  const interviewCount = stats.interview ?? 0;
  const offerCount = stats.offer ?? 0;
  const rejectedCount = stats.rejected ?? 0;
  const activePipeline = appliedCount + interviewCount + offerCount;
  const responseRate = totalTracked ? Math.round(((interviewCount + offerCount) / totalTracked) * 100) : 0;
  const urgentCount = jobs.filter(
    (job) => job.priority === "High" && job.status !== "Offer" && job.status !== "Rejected"
  ).length;
  const recentApplications = jobs.filter((job) => {
    const appliedDate = getValidDate(job.appliedDate);

    if (!appliedDate) {
      return false;
    }

    const age = Date.now() - appliedDate.getTime();
    return age >= 0 && age <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const latestJob = jobs.reduce((latest, current) => {
    const latestTime = getValidDate(latest?.appliedDate)?.getTime() ?? -1;
    const currentTime = getValidDate(current.appliedDate)?.getTime() ?? -1;
    return currentTime > latestTime ? current : latest;
  }, null);
  const activeFilters = [search, filterStatus, filterPriority].filter(Boolean).length;

  const refreshJobs = async () => {
    setLoading(true);

    try {
      const nextJobs = await fetchJobsData({ search, filterStatus, filterPriority });
      setJobs(nextJobs);
      setError("");
    } catch {
      setError(API_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      const nextStats = await fetchStatsData();
      setStats(nextStats);
    } catch {}
  };

  const refreshDashboard = async () => {
    await Promise.all([refreshJobs(), refreshStats()]);
  };

  useEffect(() => {
    let ignore = false;

    const loadJobs = async () => {
      setLoading(true);

      try {
        const nextJobs = await fetchJobsData({ search, filterStatus, filterPriority });

        if (ignore) {
          return;
        }

        setJobs(nextJobs);
        setError("");
      } catch {
        if (!ignore) {
          setError(API_ERROR);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadJobs();

    return () => {
      ignore = true;
    };
  }, [search, filterStatus, filterPriority]);

  useEffect(() => {
    let ignore = false;

    const loadStats = async () => {
      try {
        const nextStats = await fetchStatsData();

        if (!ignore) {
          setStats(nextStats);
        }
      } catch {}
    };

    loadStats();

    return () => {
      ignore = true;
    };
  }, []);

  const openModal = (job = null) => {
    setEditingJob(job);
    setForm(job ? { ...job } : { ...EMPTY_FORM });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingJob(null);
  };

  const saveJob = async () => {
    if (!form.company.trim() || !form.role.trim()) {
      setError("Company and role are required before saving.");
      return;
    }

    try {
      const url = editingJob ? `${API}/jobs/${editingJob.id}` : `${API}/jobs`;
      const method = editingJob ? "PUT" : "POST";

      await sendRequest(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      closeModal();
      await refreshDashboard();
    } catch {
      setError("Unable to save changes right now. Please check the backend connection and try again.");
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm("Delete this job application?")) {
      return;
    }

    try {
      await sendRequest(`${API}/jobs/${id}`, { method: "DELETE" });
      await refreshDashboard();
    } catch {
      setError("Unable to delete that application right now.");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await sendRequest(`${API}/jobs/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      await refreshDashboard();
    } catch {
      setError("Unable to update the application stage right now.");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("");
    setFilterPriority("");
  };

  return (
    <div className="app-shell">
      <main className="app-frame">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="hero-eyebrow">Application dashboard</span>
            <h1>Make your job search feel calm, visible, and in motion.</h1>
            <p>
              Track every application, keep the pipeline readable, and spot where follow-up work is
              needed before opportunities go cold.
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => openModal()}>
                + Add application
              </button>

              <button className="btn btn-secondary" onClick={clearFilters} disabled={!activeFilters}>
                Clear filters
              </button>
            </div>
          </div>

          <div className="hero-aside">
            <div className="hero-score">
              <span className="hero-score-label">Response rate</span>
              <strong>{responseRate}%</strong>
              <p>
                {interviewCount + offerCount} positive updates across {totalTracked} tracked roles
              </p>
            </div>

            <div className="hero-mini-grid">
              <div className="hero-mini-card">
                <span>Urgent follow-ups</span>
                <strong>{urgentCount}</strong>
              </div>

              <div className="hero-mini-card">
                <span>Added this week</span>
                <strong>{recentApplications}</strong>
              </div>
            </div>

            <div className="hero-note">
              {latestJob
                ? `Latest application: ${latestJob.company} on ${formatDate(latestJob.appliedDate)}`
                : "Your newest application will show here once the list fills up."}
            </div>
          </div>
        </section>

        <section className="metrics-grid">
          <MetricCard label="Total tracked" value={totalTracked} detail="Every role in your system" tone="neutral" />
          <MetricCard label="Applied" value={appliedCount} detail="Waiting for responses" tone="applied" />
          <MetricCard
            label="Interview"
            value={interviewCount}
            detail="Roles currently in motion"
            tone="interview"
          />
          <MetricCard label="Offer" value={offerCount} detail="Opportunities with momentum" tone="offer" />
          <MetricCard label="Rejected" value={rejectedCount} detail="Closed loops and learnings" tone="rejected" />
        </section>

        <section className="workspace-panel">
          <div className="workspace-header">
            <div>
              <span className="section-kicker">Pipeline board</span>
              <h2>Search, filter, and move every application forward.</h2>
            </div>

            <div className="workspace-summary">
              <span>{loading ? "Refreshing data" : `${jobs.length} visible roles`}</span>
              <span>{activePipeline} active in pipeline</span>
            </div>
          </div>

          <div className="toolbar">
            <label className="toolbar-field toolbar-search">
              <span className="field-label">Search</span>
              <input
                className="input-control"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Company, role, or location"
              />
            </label>

            <label className="toolbar-field">
              <span className="field-label">Status</span>
              <select
                className="select-control"
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
              >
                <option value="">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="toolbar-field">
              <span className="field-label">Priority</span>
              <select
                className="select-control"
                value={filterPriority}
                onChange={(event) => setFilterPriority(event.target.value)}
              >
                <option value="">All priorities</option>
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? <div className="error-banner">{error}</div> : null}

          {loading ? (
            <StateCard
              eyebrow="Loading"
              title="Syncing your dashboard"
              description="Pulling the latest applications from the local API."
            />
          ) : jobs.length === 0 ? (
            <StateCard
              eyebrow="No results"
              title={activeFilters ? "No applications match this view" : "Start with your first application"}
              description={
                activeFilters
                  ? "Try clearing one of the filters or widening the search terms."
                  : "Once you add a role, the board will turn into a clean pipeline view."
              }
              action={
                activeFilters ? (
                  <button className="btn btn-ghost" onClick={clearFilters}>
                    Reset filters
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={() => openModal()}>
                    Add application
                  </button>
                )
              }
            />
          ) : (
            <div className="jobs-list">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onEdit={openModal}
                  onDelete={deleteJob}
                  onStatusChange={updateStatus}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {showModal ? (
        <Modal
          isEditing={Boolean(editingJob)}
          form={form}
          setForm={setForm}
          onSave={saveJob}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
}
