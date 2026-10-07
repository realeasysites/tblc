// lib/mailer.js
// Optional email notification whenever a new lead comes in.
// If SMTP settings aren't configured in .env, this quietly does nothing —
// leads are always saved to the database regardless of email.

const nodemailer = require('nodemailer');

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendLeadNotification(lead) {
  const transporter = getTransporter();
  const to = process.env.NOTIFY_EMAIL;
  if (!transporter || !to) return;

  const subject = `New quote request: ${lead.name} (${lead.service || 'general'})`;
  const text = [
    `New lead from the TBLC website`,
    ``,
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email || '-'}`,
    `Address: ${lead.address || '-'}`,
    `Service: ${lead.service || '-'}`,
    `Property size: ${lead.property_size || '-'}`,
    `Message: ${lead.message || '-'}`,
    ``,
    `Submitted: ${lead.created_at}`,
  ].join('\n');

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
}

async function sendApplicationNotification(a) {
  const transporter = getTransporter();
  const to = process.env.NOTIFY_EMAIL;
  if (!transporter || !to) return;

  const text = [
    `New job application from the TBLC website`,
    ``,
    `Name: ${a.name}`,
    `Phone: ${a.phone}`,
    `Email: ${a.email || '-'}`,
    `Town: ${a.town || '-'}`,
    `Position: ${a.position || '-'}`,
    `Experience: ${a.experience || '-'}`,
    `Valid driver's license: ${a.drivers_license || '-'}`,
    `Available to start: ${a.start_date || '-'}`,
    `About: ${a.about || '-'}`,
    ``,
    `Submitted: ${a.created_at}`,
  ].join('\n');

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `New job application: ${a.name} (${a.position || 'general'})`,
    text,
  });
}

module.exports = { sendLeadNotification, sendApplicationNotification };
