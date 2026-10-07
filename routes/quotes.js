// routes/quotes.js
// Public-facing API for the quote-request form on the website.

const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db/database');
const { sendLeadNotification } = require('../lib/mailer');

const router = express.Router();

// Limit form submissions to reduce spam / abuse: 8 requests per 15 min per IP.
const quoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again shortly, or just call us.' },
});

const SERVICES = new Set([
  'mowing',
  'pruning',
  'seasonal-cleanup',
  'hardscape',
  'snow-removal',
  'other',
]);

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

// Very small honeypot + basic field validation. No external validation
// library needed for a form this size.
router.post('/quote', quoteLimiter, (req, res) => {
  const body = req.body || {};

  // Honeypot field: real users never fill this in (it's hidden via CSS).
  if (!isBlank(body.company_website)) {
    // Silently pretend success so bots don't learn the honeypot worked.
    return res.json({ ok: true });
  }

  const name = (body.name || '').trim();
  const phone = (body.phone || '').trim();
  const email = (body.email || '').trim();
  const address = (body.address || '').trim();
  const service = (body.service || '').trim();
  const propertySize = (body.property_size || '').trim();
  const message = (body.message || '').trim();

  const errors = [];
  if (isBlank(name) || name.length > 120) errors.push('Please enter your name.');
  if (isBlank(phone) || phone.replace(/\D/g, '').length < 7) {
    errors.push('Please enter a valid phone number.');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('That email address doesn\'t look right.');
  }
  if (service && !SERVICES.has(service)) errors.push('Unrecognized service selected.');
  if (message.length > 2000) errors.push('Message is too long.');

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, error: errors[0], errors });
  }

  const stmt = db.prepare(`
    INSERT INTO leads (name, phone, email, address, service, property_size, message, ip_address)
    VALUES (@name, @phone, @email, @address, @service, @property_size, @message, @ip_address)
  `);

  const result = stmt.run({
    name,
    phone,
    email: email || null,
    address: address || null,
    service: service || null,
    property_size: propertySize || null,
    message: message || null,
    ip_address: req.ip || null,
  });

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);

  // Fire-and-forget: never let a slow/broken mail server block the response
  // to the person on the site.
  sendLeadNotification(lead).catch((err) => {
    console.error('Failed to send lead notification email:', err.message);
  });

  return res.status(201).json({ ok: true, message: 'Thanks! We\'ll be in touch shortly.' });
});

module.exports = router;
