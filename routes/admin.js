// routes/admin.js
// Protected API for viewing and managing leads. Everything here sits behind
// the adminAuth middleware, mounted in server.js.

const express = require('express');
const db = require('../db/database');

const router = express.Router();

// List leads, newest first. Optional ?status=new|contacted|scheduled|closed filter.
router.get('/leads', (req, res) => {
  const { status } = req.query;
  let leads;
  if (status) {
    leads = db.prepare('SELECT * FROM leads WHERE status = ? ORDER BY id DESC').all(status);
  } else {
    leads = db.prepare('SELECT * FROM leads ORDER BY id DESC').all();
  }
  res.json({ ok: true, leads });
});

// Update a lead's status (new, contacted, scheduled, closed).
const VALID_STATUSES = new Set(['new', 'contacted', 'scheduled', 'closed']);
router.patch('/leads/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ ok: false, error: 'Invalid status.' });
  }

  const result = db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, id);
  if (result.changes === 0) {
    return res.status(404).json({ ok: false, error: 'Lead not found.' });
  }
  res.json({ ok: true });
});

// Delete a lead (e.g. spam submissions).
router.delete('/leads/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ ok: false, error: 'Lead not found.' });
  }
  res.json({ ok: true });
});

// Export all leads as CSV for spreadsheets / mail merges.
router.get('/leads.csv', (req, res) => {
  const leads = db.prepare('SELECT * FROM leads ORDER BY id DESC').all();
  const headers = ['id', 'created_at', 'name', 'phone', 'email', 'address', 'service', 'property_size', 'message', 'status'];

  const escapeCsv = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const rows = [headers.join(',')];
  for (const lead of leads) {
    rows.push(headers.map((h) => escapeCsv(lead[h])).join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="tblc-leads.csv"');
  res.send(rows.join('\n'));
});

// Simple dashboard stats.
router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS n FROM leads').get().n;
  const newCount = db.prepare("SELECT COUNT(*) AS n FROM leads WHERE status = 'new'").get().n;
  const thisWeek = db.prepare("SELECT COUNT(*) AS n FROM leads WHERE created_at >= datetime('now', '-7 days')").get().n;
  const newApps = db.prepare("SELECT COUNT(*) AS n FROM applications WHERE status = 'new'").get().n;
  res.json({ ok: true, stats: { total, new: newCount, thisWeek, newApplications: newApps } });
});

// ---- Job applications ----
router.get('/applications', (req, res) => {
  const applications = db.prepare('SELECT * FROM applications ORDER BY id DESC').all();
  res.json({ ok: true, applications });
});

const APP_STATUSES = new Set(['new', 'reviewing', 'interview', 'hired', 'passed']);
router.patch('/applications/:id', (req, res) => {
  const { status } = req.body || {};
  if (!APP_STATUSES.has(status)) return res.status(400).json({ ok: false, error: 'Invalid status.' });
  const result = db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ ok: false, error: 'Application not found.' });
  res.json({ ok: true });
});

router.delete('/applications/:id', (req, res) => {
  const result = db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ ok: false, error: 'Application not found.' });
  res.json({ ok: true });
});

module.exports = router;
