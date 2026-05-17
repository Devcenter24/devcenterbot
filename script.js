const CONFIG = {
  inviteUrl: 'https://discord.com/oauth2/authorize?client_id=1486398705551806636',
  supportUrl: 'https://discord.gg/FEJn9MfZUk',
  apiUrl: '/api/stats',
  refreshMs: 30_000,
};

const header = document.getElementById('header');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

document.querySelectorAll('.link-invite').forEach((el) => {
  el.href = CONFIG.inviteUrl;
});
document.querySelectorAll('.link-support').forEach((el) => {
  el.href = CONFIG.supportUrl;
});

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
});

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.classList.toggle('active', open);
  navToggle.setAttribute('aria-expanded', open);
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

function animateCount(el, target) {
  const num = Number(target);
  if (!Number.isFinite(num)) return;
  const start = performance.now();
  const duration = 1400;
  const update = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - p) ** 3;
    el.textContent = Math.floor(eased * num).toLocaleString('fr-FR');
    if (p < 1) requestAnimationFrame(update);
    else el.textContent = num.toLocaleString('fr-FR');
  };
  requestAnimationFrame(update);
}

function setStatEl(el, val, animate) {
  const num = Number(val);
  if (!Number.isFinite(num)) return;
  if (animate) animateCount(el, num);
  else el.textContent = num.toLocaleString('fr-FR');
}

function applyStats(data, animate) {
  if (!data) return;

  document.querySelectorAll('[data-live]').forEach((el) => {
    setStatEl(el, data.live?.[el.dataset.live], animate);
  });

  document.querySelectorAll('[data-total]').forEach((el) => {
    setStatEl(el, data.totals?.[el.dataset.total], animate);
  });
}

async function fetchStats() {
  const urls =
    window.location.protocol === 'file:'
      ? [`http://127.0.0.1:3000${CONFIG.apiUrl}`, './api/stats.json']
      : [`${CONFIG.apiUrl}`, '/api/stats.json', './api/stats.json'];

  let lastErr;
  for (const path of urls) {
    try {
      const url = path.includes('://') ? path : `${path}?t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

let firstLoad = true;

function setStatsStatus(ok, msg) {
  const el = document.getElementById('statsStatus');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('stats-status--ok', ok);
  el.classList.toggle('stats-status--err', !ok);
}

async function loadStats() {
  try {
    const data = await fetchStats();
    applyStats(data, firstLoad);
    firstLoad = false;
    const g = data.live?.guilds ?? 0;
    const u = data.live?.users ?? 0;
    const when = data.updatedAt
      ? new Date(data.updatedAt).toLocaleString('fr-FR')
      : '';
    setStatsStatus(
      true,
      when
        ? `Stats live · ${g} serveurs · ${u} utilisateurs · ${when}`
        : `Stats chargées · ${g} serveurs · ${u} utilisateurs`
    );
  } catch (err) {
    console.warn('[DevCenterBot] API stats:', err);
    setStatsStatus(
      false,
      'Ouvre le site via http://127.0.0.1:3000 (npm start) — pas index.html seul'
    );
  }
}

function initReveal() {
  const cards = document.querySelectorAll('.module-card');
  const features = document.querySelectorAll('.feature-item');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = (entry.target.dataset.index ?? 0) * 60;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  cards.forEach((card, i) => {
    card.dataset.index = i;
    observer.observe(card);
  });
  features.forEach((item, i) => {
    item.style.transitionDelay = `${i * 80}ms`;
    observer.observe(item);
  });
}

loadStats();
setInterval(loadStats, CONFIG.refreshMs);
initReveal();
