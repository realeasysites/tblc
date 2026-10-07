// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Quote form submission
  const form = document.getElementById('quoteForm');
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('quoteSubmit');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      statusEl.className = 'form-status';
      statusEl.textContent = '';

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const res = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (res.ok && data.ok) {
          statusEl.textContent = data.message || 'Thanks! We\u2019ll be in touch shortly.';
          statusEl.classList.add('show', 'ok');
          form.reset();
        } else {
          statusEl.textContent = data.error || 'Something went wrong. Please call us instead.';
          statusEl.classList.add('show', 'err');
        }
      } catch (err) {
        statusEl.textContent = 'Network error. Please call or text (207) 329-9788.';
        statusEl.classList.add('show', 'err');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request My Quote';
      }
    });
  }

  // ---- Generic JSON form submit (used by the application widget) ----
  const applyForm = document.getElementById('applyForm');
  if (applyForm) {
    const applyStatus = document.getElementById('applyStatus');
    const applyBtn = document.getElementById('applySubmit');
    applyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      applyStatus.className = 'form-status';
      applyStatus.textContent = '';
      applyBtn.disabled = true;
      applyBtn.textContent = 'Sending...';
      try {
        const res = await fetch('/api/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(applyForm).entries())),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          applyStatus.textContent = data.message || 'Thanks for applying!';
          applyStatus.classList.add('show', 'ok');
          applyForm.reset();
        } else {
          applyStatus.textContent = data.error || 'Something went wrong. Please call us instead.';
          applyStatus.classList.add('show', 'err');
        }
      } catch (err) {
        applyStatus.textContent = 'Network error. Please call or text (207) 329-9788.';
        applyStatus.classList.add('show', 'err');
      } finally {
        applyBtn.disabled = false;
        applyBtn.textContent = 'Submit Application';
      }
    });
  }

  // ---- Photo gallery: filter chips + lightbox ----
  const gGrid = document.getElementById('galleryGrid');
  if (gGrid) {
    const items = Array.from(gGrid.querySelectorAll('.g-item'));
    const chips = document.querySelectorAll('.g-chip');
    chips.forEach((chip) => chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const f = chip.dataset.filter;
      items.forEach((it) => { it.hidden = !(f === 'all' || it.dataset.cat === f); });
    }));

    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lbImg');
    let current = -1;
    const visible = () => items.filter((it) => !it.hidden);
    const show = (i) => {
      const list = visible();
      if (!list.length) return;
      current = (i + list.length) % list.length;
      const img = list[current].querySelector('img');
      lbImg.src = img.src; lbImg.alt = img.alt;
    };
    const open = (it) => { lb.hidden = false; document.body.style.overflow = 'hidden'; show(visible().indexOf(it)); };
    const close = () => { lb.hidden = true; document.body.style.overflow = ''; lbImg.src = ''; };
    items.forEach((it) => it.addEventListener('click', () => open(it)));
    document.getElementById('lbClose').addEventListener('click', close);
    document.getElementById('lbPrev').addEventListener('click', () => show(current - 1));
    document.getElementById('lbNext').addEventListener('click', () => show(current + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }
});
