// routes/apply.js
// Public-facing API for the "Join the Team" employee application widget.

const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db/database');
const { sendApplicationNotification } = require('../lib/mailer');

const router = express.Router();

// 5 applications per hour per IP keeps spam down without bothering real applicants.
const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many submissions. Please try again later, or call (207) 329-9788.' },
});

const POSITIONS = new Set(['lawn-crew', 'hardscape-crew', 'snow-plow-driver', 'seasonal', 'other']);
const EXPERIENCE = new Set(['none', 'under-1', '1-3', '3-plus']);
const LICENSE = new Set(['yes', 'no']);

const isBlank = (v) => typeof v !== 'string' || v.trim().length === 0;
const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

router.post('/apply', applyLimiter, (req, res) => {
  const body = req.body || {};

  // Honeypot: hidden from real users, bots fill it in.
  if (!isBlank(body.company_website)) return res.json({ ok: true });

  const app = {
    name: clean(body.name, 120),
    phone: clean(body.phone, 40),
    email: clean(body.email, 160),
    town: clean(body.town, 120),
    position: clean(body.position, 40),
    experience: clean(body.experience, 20),
    drivers_license: clean(body.drivers_license, 5),
    start_date: clean(body.start_date, 80),
    about: clean(body.about, 2000),
  };

  const errors = [];
  if (isBlank(app.name)) errors.push('Please enter your name.');
  if (app.phone.replace(/\D/g, '').length < 7) errors.push('Please enter a valid phone number.');
  if (app.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(app.email)) errors.push("That email address doesn't look right.");
  if (app.position && !POSITIONS.has(app.position)) errors.push('Unrecognized position selected.');
  if (app.experience && !EXPERIENCE.has(app.experience)) errors.push('Unrecognized experience level.');
  if (app.drivers_license && !LICENSE.has(app.drivers_license)) errors.push('Unrecognized license answer.');
  if (errors.length) return res.status(400).json({ ok: false, error: errors[0], errors });

  const result = db.prepare(`
    INSERT INTO applications (name, phone, email, town, position, experience, drivers_license, start_date, about, ip_address)
    VALUES (@name, @phone, @email, @town, @position, @experience, @drivers_license, @start_date, @about, @ip)
  `).run({
    ...app,
    email: app.email || null,
    town: app.town || null,
    position: app.position || null,
    experience: app.experience || null,
    drivers_license: app.drivers_license || null,
    start_date: app.start_date || null,
    about: app.about || null,
    ip: req.ip || null,
  });

  const saved = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid);

  // Never let a slow mail server block the applicant's confirmation.
  sendApplicationNotification(saved).catch((err) => {
    console.error('Failed to send application notification email:', err.message);
  });

  return res.status(201).json({ ok: true, message: "Thanks for applying! We'll be in touch soon." });
});

module.exports = router;
