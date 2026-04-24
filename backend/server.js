// server.js - Smart Job Tracker API
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── In-Memory Database ───────────────────────────────────────
// (Replace with MongoDB/PostgreSQL in production)
let jobs = [
  {
    id: uuidv4(),
    company: "Google",
    role: "Frontend Developer",
    status: "Applied",
    salary: "₹18,00,000",
    location: "Bangalore",
    appliedDate: "2024-04-01",
    notes: "Applied via LinkedIn. Waiting for HR response.",
    priority: "High",
  },
  {
    id: uuidv4(),
    company: "Flipkart",
    role: "Full Stack Engineer",
    status: "Interview",
    salary: "₹14,00,000",
    location: "Remote",
    appliedDate: "2024-04-05",
    notes: "First round scheduled for next week.",
    priority: "Medium",
  },
  {
    id: uuidv4(),
    company: "Infosys",
    role: "React Developer",
    status: "Rejected",
    salary: "₹8,00,000",
    location: "Pune",
    appliedDate: "2024-03-20",
    notes: "Rejected after technical round.",
    priority: "Low",
  },
  {
    id: uuidv4(),
    company: "Razorpay",
    role: "Backend Engineer",
    status: "Offer",
    salary: "₹22,00,000",
    location: "Bangalore",
    appliedDate: "2024-03-15",
    notes: "Offer received! Negotiating salary.",
    priority: "High",
  },
];

// ─── Helper: Stats Calculator ─────────────────────────────────
const getStats = () => ({
  total: jobs.length,
  applied: jobs.filter((j) => j.status === "Applied").length,
  interview: jobs.filter((j) => j.status === "Interview").length,
  offer: jobs.filter((j) => j.status === "Offer").length,
  rejected: jobs.filter((j) => j.status === "Rejected").length,
});

// ─── Routes ───────────────────────────────────────────────────

// GET /api/jobs — Get all jobs (with optional filters)
app.get("/api/jobs", (req, res) => {
  let result = [...jobs];
  const { status, priority, search } = req.query;

  if (status) result = result.filter((j) => j.status === status);
  if (priority) result = result.filter((j) => j.priority === priority);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (j) =>
        j.company.toLowerCase().includes(q) ||
        j.role.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: result.length, data: result });
});

// GET /api/jobs/stats — Dashboard statistics
app.get("/api/jobs/stats", (req, res) => {
  res.json({ success: true, data: getStats() });
});

// GET /api/jobs/:id — Get a single job
app.get("/api/jobs/:id", (req, res) => {
  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Job not found" });
  res.json({ success: true, data: job });
});

// POST /api/jobs — Create a new job
app.post("/api/jobs", (req, res) => {
  const { company, role, status, salary, location, appliedDate, notes, priority } = req.body;

  // Validation
  if (!company || !role) {
    return res.status(400).json({ success: false, message: "Company and role are required" });
  }

  const validStatuses = ["Applied", "Interview", "Offer", "Rejected"];
  const validPriorities = ["High", "Medium", "Low"];

  const newJob = {
    id: uuidv4(),
    company: company.trim(),
    role: role.trim(),
    status: validStatuses.includes(status) ? status : "Applied",
    salary: salary || "Not specified",
    location: location || "Not specified",
    appliedDate: appliedDate || new Date().toISOString().split("T")[0],
    notes: notes || "",
    priority: validPriorities.includes(priority) ? priority : "Medium",
  };

  jobs.unshift(newJob);
  res.status(201).json({ success: true, message: "Job added successfully", data: newJob });
});

// PUT /api/jobs/:id — Update a job
app.put("/api/jobs/:id", (req, res) => {
  const index = jobs.findIndex((j) => j.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Job not found" });

  jobs[index] = { ...jobs[index], ...req.body, id: jobs[index].id };
  res.json({ success: true, message: "Job updated successfully", data: jobs[index] });
});

// PATCH /api/jobs/:id/status — Update just the status
app.patch("/api/jobs/:id/status", (req, res) => {
  const { status } = req.body;
  const validStatuses = ["Applied", "Interview", "Offer", "Rejected"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const index = jobs.findIndex((j) => j.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Job not found" });

  jobs[index].status = status;
  res.json({ success: true, message: "Status updated", data: jobs[index] });
});

// DELETE /api/jobs/:id — Delete a job
app.delete("/api/jobs/:id", (req, res) => {
  const index = jobs.findIndex((j) => j.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Job not found" });

  const deleted = jobs.splice(index, 1)[0];
  res.json({ success: true, message: "Job deleted successfully", data: deleted });
});

// DELETE /api/jobs — Delete all jobs
app.delete("/api/jobs", (req, res) => {
  jobs = [];
  res.json({ success: true, message: "All jobs deleted" });
});

// ─── Health Check ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Smart Job Tracker API is running!",
    version: "1.0.0",
    endpoints: {
      "GET /api/jobs": "Get all jobs (supports ?status=, ?priority=, ?search=)",
      "GET /api/jobs/stats": "Get dashboard statistics",
      "GET /api/jobs/:id": "Get single job",
      "POST /api/jobs": "Create new job",
      "PUT /api/jobs/:id": "Update full job",
      "PATCH /api/jobs/:id/status": "Update job status only",
      "DELETE /api/jobs/:id": "Delete a job",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Job Tracker API running at: http://localhost:${PORT}`);
  console.log(`📋 API Docs:              http://localhost:${PORT}/`);
  console.log(`📊 Jobs endpoint:         http://localhost:${PORT}/api/jobs`);
  console.log(`📈 Stats endpoint:        http://localhost:${PORT}/api/jobs/stats\n`);
});