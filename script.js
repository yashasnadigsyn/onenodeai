const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const chapters = [...document.querySelectorAll('.chapter')];
const railLinks = [...document.querySelectorAll('.chapter-rail a')];
const progressBar = document.getElementById('scrollProgress');
const chapterFill = document.getElementById('chapterFill');
const coreVisual = document.getElementById('coreVisual');
const automatedPreview = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
const previewTarget = new URLSearchParams(window.location.search).get('preview');

// Screenshot crawlers should capture the page itself, not the brief opening calibration.
if (automatedPreview) {
  document.querySelector('.loader')?.remove();
  document.body.classList.add('is-loaded', 'is-automated');
  if (previewTarget) {
    document.body.classList.add('has-preview');
    document.getElementById(previewTarget)?.classList.add('preview-visible');
  }
}

function positionAutomatedPreview() {
  if (!automatedPreview || !previewTarget) return;
  const target = document.getElementById(previewTarget);
  if (!target) return;
  const previousBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, target.offsetTop);
  window.requestAnimationFrame(() => {
    document.documentElement.style.scrollBehavior = previousBehavior;
    updateScrollState();
  });
}

/* Opening sequence waits briefly for display fonts, then gets out of the way. */
const readyFallback = new Promise((resolve) => window.setTimeout(resolve, 900));
const fontsReady = document.fonts?.ready || Promise.resolve();
Promise.race([fontsReady, readyFallback]).then(() => {
  window.requestAnimationFrame(() => {
    document.body.classList.add('is-loaded');
    window.setTimeout(() => document.querySelector('.loader')?.remove(), 950);
    positionAutomatedPreview();
  });
});

window.addEventListener('load', () => window.requestAnimationFrame(positionAutomatedPreview), { once: true });

/* Mobile navigation. */
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');

function closeMenu() {
  document.body.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Open menu');
  mobileMenu?.setAttribute('aria-hidden', 'true');
}

menuToggle?.addEventListener('click', () => {
  const willOpen = !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', willOpen);
  menuToggle.setAttribute('aria-expanded', String(willOpen));
  menuToggle.setAttribute('aria-label', willOpen ? 'Close menu' : 'Open menu');
  mobileMenu?.setAttribute('aria-hidden', String(!willOpen));
});

document.querySelectorAll('.mobile-menu a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

/* Reusable in-view reveals and demo lifecycle. */
if (reduceMotion) {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-revealed'));
  document.querySelectorAll('.system-card').forEach((element) => element.classList.add('is-inview'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
  document.querySelectorAll('.reveal').forEach((element) => {
    if (element.getBoundingClientRect().top < window.innerHeight * 0.96) {
      element.classList.add('is-revealed');
      revealObserver.unobserve(element);
    }
  });

  const demoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-inview', entry.isIntersecting);
    });
  }, { threshold: 0.35, rootMargin: '-8% 0px -8% 0px' });

  document.querySelectorAll('.system-card').forEach((card) => demoObserver.observe(card));
}

/* Chapter state and continuous scroll values share one animation frame. */
let ticking = false;
let activeChapter = 'intro';
let pointerX = 0;
let pointerY = 0;

function setActiveChapter(chapter) {
  if (!chapter || chapter.id === activeChapter) return;
  activeChapter = chapter.id;
  document.body.dataset.active = activeChapter;

  const index = chapters.indexOf(chapter);
  railLinks.forEach((link) => {
    const selected = link.dataset.target === activeChapter;
    link.classList.toggle('is-active', selected);
    if (selected) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });

  if (chapterFill) {
    const ratio = chapters.length > 1 ? index / (chapters.length - 1) : 0;
    chapterFill.style.transform = `scaleY(${ratio})`;
  }
}

function getCenteredChapter() {
  const focus = window.innerHeight * 0.46;
  let nearest = chapters[0];
  let nearestDistance = Infinity;

  chapters.forEach((chapter) => {
    const rect = chapter.getBoundingClientRect();
    const inside = rect.top <= focus && rect.bottom >= focus;
    const distance = inside ? 0 : Math.min(Math.abs(rect.top - focus), Math.abs(rect.bottom - focus));
    if (distance < nearestDistance) {
      nearest = chapter;
      nearestDistance = distance;
    }
  });

  return nearest;
}

function updateScrollState() {
  const root = document.documentElement;
  const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
  const pageProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  if (progressBar) progressBar.style.transform = `scaleX(${pageProgress})`;

  setActiveChapter(getCenteredChapter());

  if (coreVisual) {
    const heroHeight = Math.max(1, document.getElementById('intro')?.offsetHeight || window.innerHeight);
    const heroProgress = Math.min(1, Math.max(0, window.scrollY / heroHeight));
    const scrollDrift = heroProgress * -34;
    coreVisual.style.setProperty('--mx', `${pointerX * 11}px`);
    coreVisual.style.setProperty('--my', `${pointerY * 9 + scrollDrift}px`);
    coreVisual.style.opacity = String(Math.max(0, 1 - heroProgress * 1.3));
  }

  ticking = false;
}

function requestScrollUpdate() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateScrollState);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });
updateScrollState();

/* Core visual reacts gently to intent without chasing the pointer. */
if (finePointer && !reduceMotion) {
  document.getElementById('intro')?.addEventListener('pointermove', (event) => {
    pointerX = event.clientX / window.innerWidth - 0.5;
    pointerY = event.clientY / window.innerHeight - 0.5;
    requestScrollUpdate();
  }, { passive: true });
}

/* Product card focus follows hover while keyboard focus remains native. */
document.querySelectorAll('.system-card').forEach((card) => {
  card.addEventListener('pointerenter', () => {
    document.querySelectorAll('.system-card').forEach((item) => item.classList.toggle('is-selected', item === card));
  });
});

/* Demo buttons give immediate feedback, but never pretend to perform a real booking. */
document.querySelectorAll('.bot-actions button').forEach((button) => {
  button.addEventListener('click', () => {
    const footer = button.closest('.system-demo')?.querySelector('.demo-footer span:first-child');
    if (!footer) return;
    const previous = footer.textContent;
    footer.textContent = button.textContent === 'CHECK DATE' ? 'HANDOFF PREPARED' : 'GUIDE READY';
    window.setTimeout(() => { footer.textContent = previous; }, 1800);
  });
});

/* Contact form uses the current no-backend mail handoff with clearer context. */
const leadForm = document.getElementById('leadForm');
const workflowField = document.getElementById('workflow');

workflowField?.addEventListener('input', () => {
  workflowField.style.height = 'auto';
  workflowField.style.height = `${Math.min(workflowField.scrollHeight, 150)}px`;
});

leadForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(leadForm);
  const name = String(data.get('name') || '').trim();
  const studio = String(data.get('studio') || '').trim();
  const email = String(data.get('email') || '').trim();
  const workflow = String(data.get('workflow') || '').trim();
  const output = document.getElementById('formMsg');
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !validEmail || !workflow) {
    if (output) output.textContent = 'ADD YOUR NAME, A VALID EMAIL, AND THE BOTTLENECK.';
    return;
  }

  const subject = encodeURIComponent(`48h pilot signal — ${studio || name}`);
  const body = encodeURIComponent(
    `Name: ${name}\nStudio: ${studio || '—'}\nEmail: ${email}\n\nWorkflow bottleneck:\n${workflow}\n\n— sent via onenodeai.com`
  );

  if (output) output.textContent = 'OPENING YOUR MAIL CLIENT…';
  window.location.href = `mailto:hello@onenodeai.com?subject=${subject}&body=${body}`;
});

/* Precision cursor and low-amplitude magnetic controls. */
if (finePointer && !reduceMotion) {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('pointermove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    document.body.classList.add('cursor-ready', 'cursor-enabled');
    if (dot) dot.style.transform = `translate3d(${mouseX}px,${mouseY}px,0)`;
  }, { passive: true });

  function drawCursor() {
    ringX += (mouseX - ringX) * 0.14;
    ringY += (mouseY - ringY) * 0.14;
    if (ring) ring.style.transform = `translate3d(${ringX}px,${ringY}px,0)`;
    window.requestAnimationFrame(drawCursor);
  }
  drawCursor();

  document.querySelectorAll('a, button, input, textarea').forEach((element) => {
    element.addEventListener('pointerenter', () => ring?.classList.add('is-hover'));
    element.addEventListener('pointerleave', () => ring?.classList.remove('is-hover'));
  });

  document.querySelectorAll('.system-demo').forEach((element) => {
    element.addEventListener('pointerenter', () => ring?.classList.add('is-demo'));
    element.addEventListener('pointerleave', () => ring?.classList.remove('is-demo'));
  });

  document.querySelectorAll('.magnetic').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * 0.055}px,${y * 0.09}px)`;
    });
    element.addEventListener('pointerleave', () => {
      element.style.transform = '';
    });
  });
}

/* A sparse, deterministic node field gives the brand motif depth without video weight. */
const canvas = document.getElementById('nodeField');

if (canvas && !reduceMotion) {
  const context = canvas.getContext('2d');
  let canvasWidth = 0;
  let canvasHeight = 0;
  let pixelRatio = 1;
  let nodes = [];
  let fieldMouseX = -1000;
  let fieldMouseY = -1000;
  let fieldFrame = 0;

  function seeded(index, salt) {
    const value = Math.sin(index * 91.731 + salt * 17.193) * 43758.5453;
    return value - Math.floor(value);
  }

  function buildNodes() {
    const count = window.innerWidth < 760 ? 14 : Math.min(34, Math.floor(window.innerWidth / 42));
    nodes = Array.from({ length: count }, (_, index) => ({
      x: seeded(index, 1) * canvasWidth,
      y: seeded(index, 2) * canvasHeight,
      baseX: seeded(index, 1) * canvasWidth,
      baseY: seeded(index, 2) * canvasHeight,
      radius: seeded(index, 3) * 1.1 + 0.35,
      drift: seeded(index, 4) * Math.PI * 2,
      speed: seeded(index, 5) * 0.004 + 0.0015
    }));
  }

  function resizeField() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = Math.round(canvasWidth * pixelRatio);
    canvas.height = Math.round(canvasHeight * pixelRatio);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    buildNodes();
  }

  function drawField() {
    fieldFrame += 1;
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    nodes.forEach((node, index) => {
      const motion = fieldFrame * node.speed;
      node.x = node.baseX + Math.cos(node.drift + motion) * 11;
      node.y = node.baseY + Math.sin(node.drift + motion * 1.2) * 9;

      for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
        const next = nodes[nextIndex];
        const dx = node.x - next.x;
        const dy = node.y - next.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 145) continue;
        context.beginPath();
        context.moveTo(node.x, node.y);
        context.lineTo(next.x, next.y);
        context.strokeStyle = `rgba(240,238,232,${(1 - distance / 145) * 0.055})`;
        context.lineWidth = 0.6;
        context.stroke();
      }

      const mouseDistance = Math.hypot(node.x - fieldMouseX, node.y - fieldMouseY);
      if (mouseDistance < 165) {
        context.beginPath();
        context.moveTo(node.x, node.y);
        context.lineTo(fieldMouseX, fieldMouseY);
        context.strokeStyle = `rgba(240,238,232,${(1 - mouseDistance / 165) * 0.13})`;
        context.lineWidth = 0.7;
        context.stroke();
      }

      context.beginPath();
      context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      context.fillStyle = 'rgba(240,238,232,.24)';
      context.fill();
    });

    window.requestAnimationFrame(drawField);
  }

  window.addEventListener('pointermove', (event) => {
    fieldMouseX = event.clientX;
    fieldMouseY = event.clientY;
  }, { passive: true });
  document.addEventListener('mouseleave', () => {
    fieldMouseX = -1000;
    fieldMouseY = -1000;
  });
  window.addEventListener('resize', resizeField, { passive: true });

  resizeField();
  drawField();
}
