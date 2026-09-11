// Contacts — updated
const CONFIG = {
  email: "hello@onenodeai.com",
  phoneDisplay: "+91 90710 92615",
  phoneTel: "+919071092615",
  whatsapp: "919071092615",
};

document.getElementById("year").textContent = new Date().getFullYear();

// mobile menu
const ham = document.getElementById("hamburger");
const links = document.getElementById("navLinks");
ham.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  ham.setAttribute("aria-expanded", open);
});
links.querySelectorAll("a").forEach(a =>
  a.addEventListener("click", () => links.classList.remove("open"))
);

// scroll reveal
const io = new IntersectionObserver(es =>
  es.forEach(e => e.isIntersecting && e.target.classList.add("visible")),
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

// Full-page dense mouse-reactive network (warm light theme)
const canvas = document.getElementById("network");
const ctx = canvas.getContext("2d");
let pts = [];
const mouse = { x: -9999, y: -9999 };
const LINK_DIST = 130;
const MOUSE_DIST = 180;
const REPEL = 0.9;

function buildPoints() {
  const area = window.innerWidth * window.innerHeight;
  const count = Math.min(190, Math.max(90, Math.floor(area / 11000)));
  pts = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
    r: Math.random() * 2 + 1,
    warm: Math.random(), // pick orange / amber / rose
  }));
}
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  buildPoints();
}
resize();
window.addEventListener("resize", resize);
window.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener("touchmove", e => {
  const t = e.touches[0];
  if (t) { mouse.x = t.clientX; mouse.y = t.clientY; }
}, { passive: true });
window.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });

function dotColor(p) {
  if (p.warm < 0.5) return "234,88,12";   // orange
  if (p.warm < 0.8) return "245,158,11";  // amber
  return "225,29,72";                      // rose
}

(function tick() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // update + mouse repel
  for (const p of pts) {
    const dx = p.x - mouse.x, dy = p.y - mouse.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < MOUSE_DIST * MOUSE_DIST && d2 > 1) {
      const d = Math.sqrt(d2);
      const f = ((MOUSE_DIST - d) / MOUSE_DIST) * REPEL;
      p.vx += (dx / d) * f * 0.12;
      p.vy += (dy / d) * f * 0.12;
    }
    // gentle friction + drift
    p.vx *= 0.985; p.vy *= 0.985;
    if (Math.abs(p.vx) < 0.08) p.vx += (Math.random() - 0.5) * 0.02;
    if (Math.abs(p.vy) < 0.08) p.vy += (Math.random() - 0.5) * 0.02;
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    p.x = Math.max(0, Math.min(canvas.width, p.x));
    p.y = Math.max(0, Math.min(canvas.height, p.y));
  }

  // links between points
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      const d2 = dx * dx + dy * dy;
      if (d2 < LINK_DIST * LINK_DIST) {
        const a = (1 - Math.sqrt(d2) / LINK_DIST) * 0.45;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = `rgba(234,88,12,${a.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    // link to mouse — nodes reach toward cursor
    const mdx = pts[i].x - mouse.x, mdy = pts[i].y - mouse.y;
    const md2 = mdx * mdx + mdy * mdy;
    if (md2 < MOUSE_DIST * MOUSE_DIST) {
      const a = (1 - Math.sqrt(md2) / MOUSE_DIST) * 0.7;
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(mouse.x, mouse.y);
      ctx.strokeStyle = `rgba(225,29,72,${a.toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  // dots on top
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, 7);
    ctx.fillStyle = `rgba(${dotColor(p)},0.65)`;
    ctx.fill();
  }

  // soft glow around cursor
  if (mouse.x > 0) {
    const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120);
    g.addColorStop(0, "rgba(245,158,11,0.18)");
    g.addColorStop(1, "rgba(245,158,11,0)");
    ctx.fillStyle = g;
    ctx.fillRect(mouse.x - 120, mouse.y - 120, 240, 240);
  }

  requestAnimationFrame(tick);
})();

// lead form -> mailto (replace with Formspree later)
document.getElementById("leadForm").addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const name = (f.get("name") || "").toString().trim();
  const email = (f.get("email") || "").toString().trim();
  const type = f.get("type");
  const msg = (f.get("message") || "").toString().trim();
  const out = document.getElementById("formMsg");
  if (!name || !email.includes("@") || !msg) {
    out.textContent = "Please fill name, valid email, and message.";
    return;
  }
  const subject = encodeURIComponent(`OneNodeAI lead: ${name} (${type})`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nType: ${type}\n\n${msg}\n\n— via onenodeai.com`);
  window.location.href = `mailto:${CONFIG.email}?subject=${subject}&body=${body}`;
  out.textContent = "Opening your email app… we reply within 24h ✓";
  e.target.reset();
});

// whatsapp button uses CONFIG
const wa = document.getElementById("whatsappBtn");
if (wa) wa.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Hi OneNodeAI, I need an AI bot")}`;

// mock copy button
document.querySelector(".mock-link button")?.addEventListener("click", ev => {
  ev.currentTarget.textContent = "Copied ✓";
  setTimeout(() => ev.currentTarget.textContent = "Copy", 1500);
});
