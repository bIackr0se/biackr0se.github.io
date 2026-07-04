/* blackrose - hero bloom, glitch, reveals. No dependencies.
   Shapes: rhodonea r = R*cos(5*theta), shared visual language with
   renderStaticRoses (inner pages) and the favicon. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- scroll chrome (nav state + reading bar), rAF-batched --- */
  var nav = document.querySelector("[data-nav]");
  var readbar = document.querySelector("[data-readbar]");
  var scrollTick = false;
  function onScrollChrome() {
    scrollTick = false;
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 40);
    if (readbar) {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      readbar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", function () {
    if (!scrollTick) { scrollTick = true; requestAnimationFrame(onScrollChrome); }
  }, { passive: true });
  onScrollChrome();

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
  function renderStaticRoses() {
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
  }
  renderStaticRoses();
  var roseResizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(roseResizeTimer);
    roseResizeTimer = setTimeout(renderStaticRoses, 200);
  });

  /* ---- scroll-scrubbed scenes + display-type drift ------------- */
  /* One rAF loop drives the pinned stages (hero push-through, manifesto
     line scrub) and the parallax drift, all lerp-smoothed. */
  var stages = [].slice.call(document.querySelectorAll("[data-stage]"));
  var plx = [].slice.call(document.querySelectorAll(".section-title, .contact-title"));
  var canTranslate = "translate" in document.documentElement.style;
  if (!reduced && (stages.length || plx.length)) {
    var clamp01 = function (v) { return v < 0 ? 0 : (v > 1 ? 1 : v); };
    var ramp = function (p, a, b) { return clamp01((p - a) / (b - a)); };
    var heroRefs = null, maniRefs = null;
    stages.forEach(function (st) {
      var kind = st.getAttribute("data-stage");
      if (kind === "hero") {
        heroRefs = {
          stage: st,
          title: st.querySelector(".hero-title"),
          sub: st.querySelector(".hero-sub"),
          boot: st.querySelector("[data-boot]"),
          cue: st.querySelector(".hero-cue"),
          canvas: st.querySelector("[data-rose]"),
          fade: st.querySelector("[data-hero-fade]")
        };
      } else if (kind === "manifesto") {
        maniRefs = {
          stage: st,
          kicker: st.querySelector(".kicker"),
          lines: [].slice.call(st.querySelectorAll(".statement .line")),
          copy: st.querySelector(".manifesto-copy"),
          wash: st.querySelector("[data-wash]")
        };
      }
    });
    var progressOf = function (el) {
      var scene = el.firstElementChild;
      var total = el.offsetHeight - (scene ? scene.offsetHeight : window.innerHeight);
      if (total <= 0) return 0;
      return clamp01(-el.getBoundingClientRect().top / total);
    };
    var applyHero = function (p) {
      var zoom = 1 + Math.pow(p, 1.55) * 6;
      heroRefs.title.style.transform = "scale(" + zoom.toFixed(3) + ")";
      heroRefs.title.style.opacity = (1 - ramp(p, 0.56, 0.86)).toFixed(3);
      if (heroRefs.canvas) heroRefs.canvas.style.transform = "scale(" + (1 + Math.pow(p, 1.3) * 3.2).toFixed(3) + ")";
      var side = (1 - ramp(p, 0.06, 0.3)).toFixed(3);
      if (heroRefs.sub) {
        heroRefs.sub.style.opacity = side;
        heroRefs.sub.style.transform = "translateY(" + (ramp(p, 0.06, 0.3) * 30).toFixed(1) + "px)";
      }
      if (heroRefs.boot) heroRefs.boot.style.opacity = side;
      if (heroRefs.cue) heroRefs.cue.style.opacity = (1 - ramp(p, 0.02, 0.12)).toFixed(3);
      if (heroRefs.fade) heroRefs.fade.style.opacity = ramp(p, 0.72, 0.97).toFixed(3);
    };
    var applyManifesto = function (p) {
      if (maniRefs.kicker) maniRefs.kicker.style.opacity = ramp(p, 0.02, 0.14).toFixed(3);
      maniRefs.lines.forEach(function (ln, i) {
        var t = ramp(p, 0.08 + i * 0.24, 0.24 + i * 0.24);
        t = 1 - Math.pow(1 - t, 3);
        ln.style.opacity = t.toFixed(3);
        ln.style.transform = "translateY(" + ((1 - t) * 70).toFixed(1) + "px)";
      });
      if (maniRefs.copy) {
        var c = ramp(p, 0.78, 0.98);
        c = 1 - Math.pow(1 - c, 3);
        maniRefs.copy.style.opacity = c.toFixed(3);
        maniRefs.copy.style.transform = "translateY(" + ((1 - c) * 40).toFixed(1) + "px)";
      }
      if (maniRefs.wash) {
        maniRefs.wash.style.opacity = (0.75 * Math.sin(Math.PI * clamp01((p - 0.04) / 0.92))).toFixed(3);
      }
    };
    if (stages.length) document.documentElement.classList.add("cinema");
    /* All layout reads happen before all style writes, and the loop parks
       itself once scroll and the smoothed values settle; scroll or resize
       wakes it. (Named scrubActive: `running` belongs to the canvas loop.) */
    var smoothHero, smoothMani;
    var scrubActive = false, lastY = -1;
    var frame = function () {
      var settled = window.scrollY === lastY;
      lastY = window.scrollY;

      /* reads */
      var hp = heroRefs ? progressOf(heroRefs.stage) : 0;
      var mp = maniRefs ? progressOf(maniRefs.stage) : 0;
      var qs = null;
      if (canTranslate && plx.length) {
        var vh = window.innerHeight;
        qs = plx.map(function (el) {
          var r = el.getBoundingClientRect();
          return Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        });
      }

      /* writes */
      if (heroRefs) {
        smoothHero = smoothHero === undefined ? hp : smoothHero + (hp - smoothHero) * 0.24;
        if (Math.abs(hp - smoothHero) > 0.0005) settled = false;
        applyHero(smoothHero);
      }
      if (maniRefs) {
        smoothMani = smoothMani === undefined ? mp : smoothMani + (mp - smoothMani) * 0.24;
        if (Math.abs(mp - smoothMani) > 0.0005) settled = false;
        applyManifesto(smoothMani);
      }
      if (qs) {
        plx.forEach(function (el, i) {
          el.style.translate = "0 " + (qs[i] * 36).toFixed(1) + "px";
        });
      }

      if (settled) { scrubActive = false; return; }
      requestAnimationFrame(frame);
    };
    var wake = function () {
      if (!scrubActive) { scrubActive = true; lastY = -1; requestAnimationFrame(frame); }
    };
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    wake();
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

  var glow = null;

  function seed() {
    var n = Math.floor(Math.min(1400, Math.max(420, (W * H) / 1700)));
    particles = [];
    for (var i = 0; i < n; i++) {
      var hue = Math.random();
      particles.push({
        theta: Math.random() * Math.PI * 2,
        speed: 0.0022 + Math.random() * 0.0048,
        drift: Math.random() * Math.PI * 2,
        wobble: 4 + Math.random() * 20,
        size: 0.6 + Math.random() * 1.7,
        hue: hue,
        col: hue < 0.70 ? "255, 42, 77" : (hue < 0.92 ? "255, 106, 61" : "161, 42, 255")
      });
    }
    /* core glow, cached per size (parallax offset is negligible at this radius) */
    var gx = W / 2, gy = H * 0.44, gr = Math.min(W, H) * 0.36 * 1.15;
    glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    glow.addColorStop(0, "rgba(255, 42, 77, 0.05)");
    glow.addColorStop(1, "rgba(255, 42, 77, 0)");
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

    /* soft core glow (gradient cached in seed) */
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = "lighter";
    var rot = t * 0.00014;
    /* static frame: bounded synchronous pass (reduced-motion users get one draw) */
    var steps = staticFrame ? 42 : 1;
    var count = staticFrame ? Math.min(particles.length, 760) : particles.length;
    for (var s = 0; s < steps; s++) {
      for (var i = 0; i < count; i++) {
        var p = particles[i];
        p.theta += p.speed;
        var th = p.theta;
        var r = R * Math.cos(5 * th);
        var wob = Math.sin((t + s * 160) * 0.001 + p.drift) * p.wobble;
        var x = cx + (r + wob) * Math.cos(th + rot);
        var y = cy + (r + wob) * Math.sin(th + rot) * 0.92;
        var a = (0.16 + 0.34 * Math.abs(Math.cos(5 * th))) * (staticFrame ? 0.5 : 1);
        ctx.fillStyle = "rgba(" + p.col + "," + a + ")";
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

  /* Debounced resize; iOS URL-bar scrolls fire resize with tiny height
     deltas, so only rebuild when the geometry meaningfully changed. */
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var dw = Math.abs(canvas.clientWidth - W);
      var dh = Math.abs(canvas.clientHeight - H);
      if (dw < 2 && dh < 120) return;
      resize();
      if (reduced) { t = 9000; draw(true); }
    }, 160);
  });

  /* Pointer parallax only where a hovering pointer exists; on touch the
     last position would stick and keep the bloom off-center. */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener("pointermove", function (e) {
      pointer.x = (e.clientX / W - 0.5) * 2;
      pointer.y = (e.clientY / H - 0.5) * 2;
    }, { passive: true });
  }

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
