# Two Brothers Lawn Care LLC — Website

A website + lead-capture backend for Two Brothers Lawn Care LLC (Saco, ME).

## What's included

- **Public site** (`public/`) — homepage with hero, services, service area,
  reviews, social links, and a "Get a Free Quote" form.
- **Backend API** (`server.js`, `routes/`, `db/`) — Node.js + Express +
  SQLite. Every quote-form submission is saved as a **lead** in a real
  database, not just emailed and forgotten.
- **Admin dashboard** (`/admin`) — password-protected page to view, filter,
  update, and export every lead that comes in, plus a CSV export button.
- Optional **email notifications** whenever a new lead comes in (off by
  default until you add SMTP details).
- Basic spam protection: a honeypot field + rate limiting on the form.

## Quick start (local)

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
cd tblc-website
npm install
cp .env.example .env
```

Open `.env` and set:
- `ADMIN_USER` / `ADMIN_PASSWORD` — the login for `/admin`.
- (Optional) SMTP settings if you want an email every time someone submits
  the quote form. Leave blank to skip — leads are always saved either way.

Then run it:

```bash
npm start
```

- Website: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin (browser will prompt for the
  username/password you set in `.env`)

The database is a single file at `db/tblc.db`, created automatically the
first time the server runs. Back this file up occasionally (or export leads
to CSV from the admin dashboard).

## Editing the content

- **Text, phone number, services, service-area towns**: edit
  `public/index.html` directly — it's plain HTML, all content is inline and
  easy to find.
- **Colors, fonts, spacing**: `public/css/style.css`. Color variables are
  defined once at the top under `:root`.
- **Photos**: the site now uses real photos supplied directly by the
  business (not AI-generated) — see `public/images/`:
  - `logo-real.jpg` — cropped from a trailer photo; the real "TB" logo
    (header + footer). Worth replacing with a clean vector/PNG version
    of the logo if one exists — a cropped photo works but a proper
    export will look sharper at small sizes.
  - `hero-lawn.jpg` — aerial shot of a finished lawn (hero background)
  - `crew-photo.jpg` — the crew in front of the branded trailer (About
    section)
  - `mow-pattern.jpg` / `hardscape-work.jpg` — job-site photos (Recent
    Work gallery)
  - `equipment-shop.jpg` — shop/equipment photo, saved but not currently
    placed on the page; drop it into the About or Recent Work section if
    you'd like it used
  
  Instagram and Facebook both block automated access to their pages, so
  none of this came from scraping — it's only here because the photos
  were uploaded directly. Swap any of these for better shots any time by
  replacing the file at the same path and filename.
- **Reviews**: the testimonials section is placeholder content marked with
  an HTML comment. Replace with real quotes from Google/Facebook reviews
  before launch (with permission from the reviewer, ideally using their
  first name and town as shown).

## Deploying it live

⚠️ This project pins Node to version 20 (via `.node-version` and
`package.json`'s `engines` field) on purpose — `better-sqlite3` (the
database) ships pre-built binaries for stable/LTS Node versions, but not
for very new ones. If a host ignores the pin and builds on a newer Node
anyway, `npm install` will fail trying to compile `better-sqlite3` from
source. If you ever see a wall of `npm error` output mentioning
`node-gyp`, `make`, or `v8::`, this is almost always the cause — on
Render, you can force it by also setting an environment variable
`NODE_VERSION` to `20.18.1` in the dashboard.

Any Node.js host works. Two straightforward, inexpensive options:

**Render.com** (recommended if you want simplicity)
1. Push this folder to a GitHub repo.
2. Create a new "Web Service" on Render, connect the repo.
3. Build command: `npm install` — Start command: `npm start`.
4. Add the same environment variables from `.env` in Render's dashboard.
5. Render gives you a free `.onrender.com` URL immediately; connect your own
   domain (e.g. `twobrotherslawncare.com`) under Settings → Custom Domain.

**Railway.app** — same idea: connect the repo, set env vars, deploy.

⚠️ Important: `db/tblc.db` lives on disk. Most hosts' free tiers reset the
disk on redeploy. Once you're live and depending on leads, either (a) use a
host with a persistent disk/volume (Render's paid tier supports this), or
(b) ask to upgrade this to a hosted database (e.g. Postgres) — a small
change from SQLite.

## Buying a domain

Pick something simple and memorable, e.g. `twobrotherslawncareme.com`. Any
registrar works (Namecheap, Google Domains successor Squarespace Domains,
Cloudflare Registrar). Point its DNS at whichever host you deploy to —
they'll each give you exact instructions once your site is live.

## Security notes

- Change `ADMIN_PASSWORD` from the default before going live.
- Always deploy behind HTTPS (Render/Railway do this automatically) so the
  admin login and customer data aren't sent in plain text.
- The `.env` file and `db/tblc.db` are already excluded via `.gitignore` —
  never commit either one.

## Project structure

```
tblc-website/
├── server.js              # Express app entry point
├── package.json
├── .env.example            # copy to .env and fill in
├── db/
│   └── database.js         # SQLite schema + connection
├── lib/
│   ├── adminAuth.js         # HTTP Basic Auth for /admin
│   └── mailer.js            # optional email-on-new-lead
├── routes/
│   ├── quotes.js            # POST /api/quote (public)
│   └── admin.js              # /admin/api/* (protected)
└── public/
    ├── index.html
    ├── css/style.css
    ├── js/main.js
    ├── admin/index.html      # dashboard UI
    └── 404.html
```
