/* blackrose — hero bloom, glitch, reveals. No dependencies. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- nav scrolled state ---------------------------------- */
  var nav = document.querySelector("[data-nav]");
  function onScrollNav() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* ---- reading progress bar --------------------------------- */
  var readbar = document.querySelector("[data-readbar]");
  if (readbar) {
    var onScrollBar = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      readbar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", onScrollBar, { passive: true });
    onScrollBar();
  }

  /* ---- scroll reveals ---------------------------------------- */
  var revealables = [].slice.call(document.querySelectorAll("[data-reveal]"));
  if (reduced || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---- periodic glitch bursts -------------------------------- */
  var glitchers = [].slice.call(document.querySelectorAll(".glitch"));
  if (!reduced && glitchers.length) {
    var burst = function (el) {
      el.classList.add("glitching");
      setTimeout(function () { el.classList.remove("glitching"); }, 360);
    };
    glitchers.forEach(function (el) {
      el.addEventListener("mouseenter", function () { burst(el); });
    });
    setInterval(function () {
      var el = glitchers[Math.floor(Math.random() * glitchers.length)];
      if (el.getBoundingClientRect().top < window.innerHeight) burst(el);
    }, 3400);
  }

  /* ---- hero boot line ----------------------------------------- */
  var boot = document.querySelector("[data-boot]");
  if (boot) {
    var msg = "$ ./init --target intelligent_systems --mode adversarial";
    if (reduced) {
      boot.textContent = msg;
    } else {
      var i = 0;
      var type = function () {
        boot.textContent = msg.slice(0, i);
        i += 1;
        if (i <= msg.length) setTimeout(type, 26 + Math.random() * 40);
      };
      setTimeout(type, 400);
    }
  }

  /* ---- static rose for inner-page headers --------------------- */
  [].slice.call(document.querySelectorAll("[data-rose-static]")).forEach(function (c) {
    var cw = c.offsetWidth, ch = c.offsetHeight;
    if (!cw || !ch) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = cw * dpr; c.height = ch * dpr;
    var g = c.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cx = cw / 2, cy = ch / 2, R = Math.min(cw, ch) * 0.42;
    g.globalCompositeOperation = "lighter";
    for (var i = 0; i < 2400; i++) {
      var th = i * 0.02611;
      var r = R * Math.cos(5 * th);
      var wob = Math.sin(i * 0.37) * 4;
      var x = cx + (r + wob) * Math.cos(th);
      var y = cy + (r + wob) * Math.sin(th) * 0.92;
      var a = 0.05 + 0.16 * Math.abs(Math.cos(5 * th));
      var col = i % 29 === 0 ? "161, 42, 255" : (i % 17 === 0 ? "255, 106, 61" : "255, 42, 77");
      g.fillStyle = "rgba(" + col + "," + a + ")";
      g.beginPath();
      g.arc(x, y, 0.9 + (i % 5) * 0.22, 0, 6.2832);
      g.fill();
    }
  });

  /* ---- scroll-linked drift on display type -------------------- */
  var plx = [].slice.call(document.querySelectorAll(".statement, .section-title, .contact-title"));
  if (!reduced && plx.length && "translate" in document.documentElement.style) {
    var onPlx = function () {
      var vh = window.innerHeight;
      plx.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.translate = "0 " + (p * 36).toFixed(1) + "px";
      });
    };
    window.addEventListener("scroll", function () { requestAnimationFrame(onPlx); }, { passive: true });
    onPlx();
  }

  /* ---- rhodonea particle bloom -------------------------------- */
  var canvas = document.querySelector("[data-rose]");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  var particles = [];
  var t = 0;
  var pointer = { x: 0, y: 0 };
  var running = true;

  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = "#060407";
    ctx.fillRect(0, 0, W, H);
    seed();
  }

  function seed() {
    var n = Math.floor(Math.min(1400, Math.max(420, (W * H) / 1700)));
    particles = [];
    for (var i = 0; i < n; i++) {
      particles.push({
        theta: Math.random() * Math.PI * 2,
        speed: 0.0022 + Math.random() * 0.0048,
        drift: Math.random() * Math.PI * 2,
        wobble: 4 + Math.random() * 20,
        size: 0.6 + Math.random() * 1.7,
        hue: Math.random()
      });
    }
  }

  function colorOf(p) {
    if (p.hue < 0.70) return "255, 42, 77";       /* rose */
    if (p.hue < 0.92) return "255, 106, 61";      /* ember */
    return "161, 42, 255";                        /* violet */
  }

  /* rose curve r = R * cos(k * theta), k = 5 petals.
     Trails: fade with a translucent wash instead of clearing. */
  function draw(staticFrame) {
    var cx = W / 2 + pointer.x * 14;
    var cy = H * 0.44 + pointer.y * 10;
    var R = Math.min(W, H) * 0.36;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = staticFrame ? "#060407" : "rgba(6, 4, 7, 0.085)";
    ctx.fillRect(0, 0, W, H);

    /* soft core glow */
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.15);
    g.addColorStop(0, "rgba(255, 42, 77, 0.05)");
    g.addColorStop(1, "rgba(255, 42, 77, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);

    ctx.globalCompositeOperation = "lighter";
    var rot = t * 0.00014;
    var steps = staticFrame ? 60 : 1;
    for (var s = 0; s < steps; s++) {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.theta += p.speed;
        var th = p.theta;
        var r = R * Math.cos(5 * th);
        var wob = Math.sin((t + s * 160) * 0.001 + p.drift) * p.wobble;
        var x = cx + (r + wob) * Math.cos(th + rot);
        var y = cy + (r + wob) * Math.sin(th + rot) * 0.92;
        var a = (0.16 + 0.34 * Math.abs(Math.cos(5 * th))) * (staticFrame ? 0.35 : 1);
        ctx.fillStyle = "rgba(" + colorOf(p) + "," + a + ")";
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
        if (!staticFrame && p.hue > 0.97) {
          ctx.fillStyle = "rgba(255, 220, 226, " + (a * 0.9) + ")";
          ctx.beginPath();
          ctx.arc(x, y, p.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function loop() {
    if (!running) return;
    t += 16;
    draw(false);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", function (e) {
    pointer.x = (e.clientX / W - 0.5) * 2;
    pointer.y = (e.clientY / H - 0.5) * 2;
  }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    if (reduced) return;
    if (document.hidden) { running = false; }
    else if (!running) { running = true; requestAnimationFrame(loop); }
  });

  resize();
  if (reduced) {
    t = 9000;
    draw(true);
  } else {
    requestAnimationFrame(loop);
  }
})();
