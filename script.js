// OneNodeAI scroll stages: black theme, 5 short chapters.
// Chapters update rail (right), dots, counters, top progress + rail fill.
const stages = [...document.querySelectorAll('.stage')];
const railItems = [...document.querySelectorAll('.rail-item')];
const dots = [...document.querySelectorAll('.dots button')];
const curNum = document.getElementById('curNum');
const topNum = document.getElementById('topNum');
const progressBar = document.getElementById('progressBar');
const railFill = document.getElementById('railFill');

function setActive(id, num) {
  document.body.dataset.active = num;
  if (curNum) curNum.textContent = num;
  if (topNum) topNum.textContent = num;
  stages.forEach((s) => s.classList.toggle('is-active', s.id === id));
  railItems.forEach((r) => r.classList.toggle('is-active', r.dataset.target === id));
  dots.forEach((d) => d.classList.toggle('is-active', d.dataset.target === id));
  // rail fill: fraction through 01..05
  if (railFill) {
    const idx = stages.findIndex((s) => s.id === id);
    const frac = stages.length > 1 ? idx / (stages.length - 1) : 0;
    railFill.style.height = `calc(${(frac * 100).toFixed(1)}% * 0.60)`;
    // rail spans 20%..80% of height (60% total) — scale fill to that band
  }
}

let currentId = null;

const stageObs = new IntersectionObserver((entries) => {
  // pick the most-visible stage (smoothest during crossfade, no flicker)
  let best = null;
  let bestRatio = 0;
  entries.forEach((en) => {
    if (en.intersectionRatio > bestRatio) { bestRatio = en.intersectionRatio; best = en.target; }
  });
  if (best && bestRatio > 0.35 && best.id !== currentId) {
    currentId = best.id;
    setActive(best.id, best.dataset.num);
  }
}, { threshold: [0, 0.2, 0.35, 0.5, 0.65, 0.8], rootMargin: '-10% 0px -10% 0px' });
stages.forEach((s) => stageObs.observe(s));

function goTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// rail + dots + logo click: smooth scroll (native smooth via CSS)
railItems.forEach((r) => {
  r.addEventListener('click', (e) => {
    e.preventDefault();
    goTo(r.dataset.target);
  });
});
dots.forEach((d) => {
  d.addEventListener('click', () => goTo(d.dataset.target));
});
document.querySelector('.pill')?.addEventListener('click', (e) => {
  e.preventDefault();
  goTo('s01');
});

// subtle parallax: drift active headline against scroll + top progress
let ticking = false;
function updateProgress() {
  if (!progressBar) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  progressBar.style.transform = `scaleX(${p.toFixed(4)})`;
}
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    stages.forEach((s) => {
      if (!s.classList.contains('is-active')) return;
      const r = s.getBoundingClientRect();
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -0.5..0.5
      const inner = s.querySelector('.stage-inner');
      if (inner) inner.style.translate = `0 ${p * -18}px`;
    });
    updateProgress();
    ticking = false;
  });
}, { passive: true });
updateProgress();

// minimal signal form -> mailto
document.getElementById('leadForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const name = (f.get('name') || '').toString().trim();
  const email = (f.get('email') || '').toString().trim();
  const msg = (f.get('message') || '').toString().trim();
  const out = document.getElementById('formMsg');
  if (!name || !email.includes('@') || !msg) { out.textContent = 'FILL ALL THREE FIELDS.'; return; }
  const subject = encodeURIComponent(`OneNodeAI signal: ${name}`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${msg}\n\n— via onenodeai.com`);
  window.location.href = `mailto:hello@onenodeai.com?subject=${subject}&body=${body}`;
  out.textContent = 'SIGNAL SENT — REPLY WITHIN 24H.';
  e.target.reset();
});

// white custom cursor: instant dot + lerped trailing ring (fine pointers only)
if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  }, { passive: true });
  (function loop() {
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a, button, input, .rail-item').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
  });
  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
}
