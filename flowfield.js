/*
 * Header flow field: inviscid potential flow past a circular cylinder,
 * with the headshot as the cylinder. Complex velocity
 *   dW/dz = U (1 - R^2 / z^2) + i Gamma / (2 pi z) = u - i v
 * with z measured from the cylinder center. A small circulation breaks the
 * symmetry so the stagnation points sit slightly below the axis (lifting flow).
 */
(function () {
  "use strict";
  const hero = document.querySelector(".hero");
  const canvas = hero && hero.querySelector("canvas.flow");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const photo = hero.querySelector(".headshot");
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, cx = 0, cy = 0, R = 1, U = 1, G = 0;
  let particles = [], running = false, visible = true;
  const TRAIL = 22;

  // velocity in screen coordinates (y down); returns null inside the cylinder
  function velocity(x, y) {
    const zx = x - cx, zy = cy - y;               // math coords, y up
    const r2 = zx * zx + zy * zy;
    if (r2 < R * R * 1.02) return null;
    // R^2 / z^2 = R^2 * conj(z)^2 / |z|^4
    const k = (R * R) / (r2 * r2);
    const re = k * (zx * zx - zy * zy), im = k * (-2 * zx * zy);
    // i G / (2 pi z) = G/(2 pi) * i conj(z) / |z|^2
    const g = G / (2 * Math.PI * r2);
    const wr = U * (1 - re) + g * zy;             // Re(dW/dz) = u
    const wi = -U * im + g * zx;                  // Im(dW/dz) = -v
    return [wr, wi];                              // screen v (down) = +wi
  }

  function spawn(p, anywhere) {
    p.x = anywhere ? Math.random() * W : -Math.random() * 60;
    p.y = Math.random() * H;
    p.trail = []; p.life = 0;
    if (anywhere && velocity(p.x, p.y) === null) spawn(p, true);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (photo && photo.offsetWidth) {
      const hr = hero.getBoundingClientRect(), pr = photo.getBoundingClientRect();
      cx = pr.left - hr.left + pr.width / 2;
      cy = pr.top - hr.top + pr.height / 2;
      R = pr.width / 2 + 10;
    } else { cx = W * 0.75; cy = H * 0.5; R = Math.min(W, H) * 0.18; }
    U = Math.max(60, Math.min(110, W * 0.07));    // px/s
    G = -2 * Math.PI * U * R * 0.45;              // mild circulation
    const n = Math.round(Math.min(420, (W * H) / 2200));
    particles = Array.from({ length: n }, () => { const p = {}; spawn(p, true); return p; });
  }

  function step(dt) {
    for (const p of particles) {
      const v = velocity(p.x, p.y);
      if (!v) { spawn(p, false); continue; }
      p.trail.push(p.x, p.y);
      if (p.trail.length > TRAIL * 2) p.trail.splice(0, 2);
      p.x += v[0] * dt; p.y += v[1] * dt; p.life += dt;
      if (p.x > W + 30 || p.y < -30 || p.y > H + 30) spawn(p, false);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 1.3;
    for (const p of particles) {
      const t = p.trail;
      if (t.length < 4) continue;
      const fade = Math.min(1, p.life * 1.5);
      ctx.beginPath();
      ctx.moveTo(t[0], t[1]);
      for (let i = 2; i < t.length; i += 2) ctx.lineTo(t[i], t[i + 1]);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = "rgba(255,255,255," + (0.26 * fade).toFixed(3) + ")";
      ctx.stroke();
    }
  }

  let last = 0;
  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
    last = t; step(dt); draw();
    requestAnimationFrame(frame);
  }
  function start() { if (!running && visible && !document.hidden) { running = true; last = 0; requestAnimationFrame(frame); } }
  function stop() { running = false; }
  function still() { for (let i = 0; i < 60; i++) step(0.03); draw(); }

  function init() {
    resize();
    if (reduce) { still(); return; }
    start();
    if ("IntersectionObserver" in window)
      new IntersectionObserver((e) => { visible = e[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  }
  if (photo && !photo.complete) photo.addEventListener("load", init, { once: true }); else init();

  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (reduce) still(); }, 150); });
})();

/* Gentle fade-in for project sections */
(function () {
  "use strict";
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const items = document.querySelectorAll(".project, .skills");
  document.documentElement.classList.add("reveal-ready");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach((el) => io.observe(el));
})();
