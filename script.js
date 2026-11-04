/* ============================================================
   ASTRALABS — script.js
   Progressive enhancement. Every section is readable without JS.
   ============================================================ */
(function () {
  "use strict";

  /* Set this to a real inbox to enable the contact form's mail-app hand-off. */
  var CONTACT_EMAIL = "";

  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $ = function (selector, scope) {
    return (scope || document).querySelector(selector);
  };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };
  var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };

  /* ---------- Branded, non-blocking preloader ---------- */
  var preloader = $("[data-preloader]");
  if (preloader) {
    document.addEventListener("DOMContentLoaded", function () {
      preloader.classList.add("is-done");
      window.setTimeout(function () { preloader.hidden = true; }, reduceMotion ? 0 : 500);
    }, { once: true });
  }

  /* ---------- Reveal delays ---------- */
  $$("[data-reveal]").forEach(function (el) {
    var delay = el.getAttribute("data-reveal-delay");
    if (delay) el.style.setProperty("--reveal-delay", delay + "ms");
  });

  /* ---------- Scroll reveal ---------- */
  var revealTargets = $$("[data-reveal], [data-split-lines]");

  if ("IntersectionObserver" in window && revealTargets.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Navigation ---------- */
  var nav = $("[data-nav]");
  var navLinks = $$("[data-nav-link]");
  var progressBar = $("[data-scroll-progress]");
  var lastScroll = window.pageYOffset;
  var ticking = false;

  function updateNav() {
    var y = window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    if (nav) {
      nav.classList.toggle("is-scrolled", y > 24);
      if (y > lastScroll && y > 320) {
        nav.classList.add("is-hidden");
      } else {
        nav.classList.remove("is-hidden");
      }
    }

    if (progressBar && max > 0) {
      progressBar.style.transform = "scaleX(" + Math.min(y / max, 1) + ")";
    }

    lastScroll = y;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        raf(updateNav);
      }
    },
    { passive: true }
  );
  updateNav();

  /* Active section state */
  var sections = $$("main section[id]");
  if ("IntersectionObserver" in window && sections.length) {
    var activeObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (section) { activeObserver.observe(section); });
  }

  /* ---------- Mobile menu ---------- */
  var burger = $("[data-burger]");
  var menu = $("[data-menu]");
  var menuLinks = $$("[data-menu-link]");

  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");

    if (open) {
      menu.hidden = false;
      document.body.classList.add("is-locked");
      if (nav) nav.classList.remove("is-hidden");
      raf(function () { menu.classList.add("is-open"); });
      var firstLink = $("a", menu);
      if (firstLink) window.setTimeout(function () { firstLink.focus(); }, 220);
    } else {
      menu.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      window.setTimeout(function () { menu.hidden = true; }, 380);
    }
  }

  if (burger && menu) {
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });

    menuLinks.forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        burger.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024 && burger.getAttribute("aria-expanded") === "true") {
        setMenu(false);
      }
    });
  }

  /* ---------- Anchor scrolling with nav offset ---------- */
  $$('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (event) {
      var id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      event.preventDefault();

      var navHeight = nav ? nav.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 14;

      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });

      if (history.replaceState) history.replaceState(null, "", id);
      target.setAttribute("tabindex", "-1");
      window.setTimeout(function () {
        target.focus({ preventScroll: true });
      }, reduceMotion ? 0 : 600);
    });
  });

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Back to top ---------- */
  $$("[data-to-top]").forEach(function (button) {
    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      var brand = $(".brand");
      if (brand) window.setTimeout(function () { brand.focus({ preventScroll: true }); }, 600);
    });
  });

  /* ---------- Contact form: validated email-client hand-off, no fake backend ---------- */
  var contactForm = $("[data-contact-form]");
  var contactStatus = $("[data-contact-status]");
  if (contactForm && contactStatus) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;

      var recipient = CONTACT_EMAIL.trim();
      if (!recipient) {
        contactStatus.textContent = "The email inbox is not configured yet. Add a real address to CONTACT_EMAIL in script.js.";
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
        contactStatus.textContent = "CONTACT_EMAIL must contain a valid email address before enquiries can be prepared.";
        return;
      }

      var data = new FormData(contactForm);
      var name = String(data.get("name") || "").trim();
      var business = String(data.get("business") || "").trim();
      var sender = String(data.get("email") || "").trim();
      var message = String(data.get("message") || "").trim();
      var body = [
        "Name: " + name,
        "Business: " + (business || "Not provided"),
        "Reply to: " + sender,
        "",
        message
      ].join("\n");
      var subject = "Website enquiry from " + name;

      contactStatus.textContent = "Your email app should open with this enquiry. Review it there and choose Send.";
      window.location.href = "mailto:" + recipient +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------- Interactive design studies ---------- */
  var playerButton = $("[data-demo-play]");
  if (playerButton) {
    playerButton.addEventListener("click", function () {
      var playing = playerButton.getAttribute("aria-pressed") !== "true";
      playerButton.setAttribute("aria-pressed", String(playing));
      playerButton.setAttribute("aria-label", playing ? "Pause demo track" : "Play demo track");
      playerButton.textContent = playing ? "Ⅱ" : "▶";
      var demo = playerButton.closest(".demo--skeuo");
      if (demo) demo.classList.toggle("is-playing", playing);
      var status = $("[data-player-status]");
      if (status) status.textContent = playing ? "PLAYING / VISUAL DEMO" : "PAUSED / INTERFACE DEMO";
    });
  }

  var neoSwitch = $("[data-neo-switch]");
  if (neoSwitch) {
    neoSwitch.addEventListener("click", function () {
      var enabled = neoSwitch.getAttribute("aria-checked") !== "true";
      neoSwitch.setAttribute("aria-checked", String(enabled));
      var state = $("[data-neo-state]");
      if (state) state.textContent = enabled ? "ON" : "OFF";
    });
  }

  $$("[data-glass-refresh]").forEach(function (button) {
    button.addEventListener("click", function () {
      var demo = button.closest(".demo--glass");
      if (!demo) return;
      var shifted = demo.classList.toggle("is-shifted");
      button.firstChild.nodeValue = shifted ? "View original " : "Refresh view ";
    });
  });

  $$("[data-liquid-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      var demo = button.closest(".demo--liquid");
      if (!demo) return;
      var active = demo.classList.toggle("is-active");
      button.setAttribute("aria-pressed", String(active));
      button.textContent = active ? "Release the light" : "Bend the light";
    });
  });

  $$("[data-clay-step]").forEach(function (button) {
    button.addEventListener("click", function () {
      var output = $("[data-clay-count]");
      if (!output) return;
      var count = Number(output.textContent) + Number(button.getAttribute("data-clay-step"));
      output.textContent = String(Math.max(0, Math.min(99, count))).padStart(2, "0");
    });
  });

  $$("[data-brutal-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      var poster = button.closest(".brutal-poster");
      if (!poster) return;
      var alternate = poster.classList.toggle("is-alt");
      button.setAttribute("aria-pressed", String(alternate));
    });
  });

  $$("[data-max-cycle]").forEach(function (button) {
    var composition = 0;
    button.addEventListener("click", function () {
      var poster = $("[data-max-poster]");
      if (!poster) return;
      poster.classList.remove("is-remix-1", "is-remix-2");
      composition = (composition + 1) % 3;
      if (composition) poster.classList.add("is-remix-" + composition);
    });
  });

  $$("[data-spatial-range]").forEach(function (range) {
    range.addEventListener("input", function () {
      var cube = $("[data-spatial-cube]");
      if (cube) cube.style.setProperty("--spatial-yaw", range.value + "deg");
    });
  });

  /* ---------- Project card tilt ---------- */
  var projectCard = $("[data-project-card]");
  var projectMedia = projectCard ? $(".project__media", projectCard) : null;

  if (projectMedia && finePointer && !reduceMotion) {
    var tiltFrame = null;

    projectMedia.addEventListener("pointermove", function (event) {
      var rect = projectMedia.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;

      if (tiltFrame) return;
      tiltFrame = raf(function () {
        projectMedia.style.setProperty("--ry", (x * 6).toFixed(2) + "deg");
        projectMedia.style.setProperty("--rx", (-y * 5).toFixed(2) + "deg");
        projectMedia.style.setProperty("--lift", "-6px");
        tiltFrame = null;
      });
    });

    projectMedia.addEventListener("pointerleave", function () {
      projectMedia.style.setProperty("--ry", "0deg");
      projectMedia.style.setProperty("--rx", "0deg");
      projectMedia.style.setProperty("--lift", "0px");
    });
  }

  /* ---------- Project dialog ---------- */
  var dialog = $("#project-dialog");
  var openButtons = $$("[data-open-project]");
  var closeButton = $("[data-close-project]");

  if (dialog && openButtons.length) {
    var lastFocused = null;

    function openDialog(event) {
      if (event) event.preventDefault();
      lastFocused = document.activeElement;

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }

      document.body.classList.add("is-locked");
      if (closeButton) closeButton.focus();
    }

    function closeDialog() {
      if (typeof dialog.close === "function" && dialog.open) {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
      document.body.classList.remove("is-locked");
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus({ preventScroll: true });
      }
    }

    openButtons.forEach(function (button) {
      button.addEventListener("click", openDialog);
    });

    if (closeButton) closeButton.addEventListener("click", closeDialog);

    dialog.addEventListener("click", function (event) {
      if (event.target !== dialog) return;
      var rect = dialog.getBoundingClientRect();
      var inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) closeDialog();
    });

    dialog.addEventListener("close", function () {
      document.body.classList.remove("is-locked");
    });

    dialog.addEventListener("cancel", function () {
      document.body.classList.remove("is-locked");
    });
  }

  /* ---------- Process timeline ---------- */
  var timeline = $("[data-timeline]");
  var timelineFill = $("[data-timeline-fill]");
  var steps = $$("[data-step]");

  if (timeline && steps.length) {
    if ("IntersectionObserver" in window) {
      var stepObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) entry.target.classList.add("is-active");
          });
        },
        { rootMargin: "-38% 0px -46% 0px", threshold: 0 }
      );
      steps.forEach(function (step) { stepObserver.observe(step); });
    } else {
      steps.forEach(function (step) { step.classList.add("is-active"); });
    }

    var fillTick = false;

    function updateTimeline() {
      fillTick = false;
      if (!timelineFill) return;

      var rect = timeline.getBoundingClientRect();
      var trigger = window.innerHeight * 0.72;
      var progress = (trigger - rect.top) / rect.height;
      progress = Math.max(0, Math.min(1, progress));
      var vertical = window.matchMedia("(max-width: 768px)").matches;
      timelineFill.style.transform = vertical
        ? "scaleY(" + progress.toFixed(3) + ")"
        : "scaleX(" + progress.toFixed(3) + ")";
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!fillTick) {
          fillTick = true;
          raf(updateTimeline);
        }
      },
      { passive: true }
    );

    window.addEventListener("resize", updateTimeline);
    updateTimeline();
  }

  /* ---------- Hero sculpture ---------- */
  var canvas = $("#orb-canvas");
  var renderLabel = $("[data-render-label]");

  function canRenderWebGL() {
    try {
      var probe = document.createElement("canvas");
      return !!(window.WebGLRenderingContext &&
        (probe.getContext("webgl2") || probe.getContext("webgl")));
    } catch (error) {
      return false;
    }
  }

  /* Environment map painted on a canvas: dark studio with lime + violet lights. */
  function buildEnvironment(THREE, renderer) {
    var map = document.createElement("canvas");
    map.width = 512;
    map.height = 256;
    var ctx = map.getContext("2d");
    if (!ctx) return null;

    var base = ctx.createLinearGradient(0, 0, 0, 256);
    base.addColorStop(0, "#55566a");
    base.addColorStop(0.32, "#1b1c25");
    base.addColorStop(0.62, "#0a0b10");
    base.addColorStop(1, "#05060a");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 512, 256);

    var lime = ctx.createRadialGradient(370, 52, 0, 370, 52, 190);
    lime.addColorStop(0, "rgba(197,255,74,1)");
    lime.addColorStop(0.45, "rgba(197,255,74,0.34)");
    lime.addColorStop(1, "rgba(197,255,74,0)");
    ctx.fillStyle = lime;
    ctx.fillRect(0, 0, 512, 256);

    var violet = ctx.createRadialGradient(92, 206, 0, 92, 206, 150);
    violet.addColorStop(0, "rgba(155,138,255,0.75)");
    violet.addColorStop(1, "rgba(155,138,255,0)");
    ctx.fillStyle = violet;
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = "rgba(244,241,232,0.95)";
    ctx.fillRect(24, 148, 150, 6);
    ctx.fillStyle = "rgba(244,241,232,0.5)";
    ctx.fillRect(24, 162, 88, 3);
    ctx.fillStyle = "rgba(197,255,74,0.55)";
    ctx.fillRect(300, 210, 120, 2);

    var texture = new THREE.CanvasTexture(map);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    var pmrem = new THREE.PMREMGenerator(renderer);
    var env = pmrem.fromEquirectangular(texture).texture;
    texture.dispose();
    pmrem.dispose();
    return env;
  }

  function initSculpture(THREE) {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
    } catch (error) {
      return;
    }

    var smallScreen = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, smallScreen ? 1.6 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    camera.position.set(0, 0, 5.6);

    var environment = buildEnvironment(THREE, renderer);
    if (environment) scene.environment = environment;

    var group = new THREE.Group();
    group.rotation.set(0.18, -0.4, 0);
    scene.add(group);

    /* Soft lime halo behind the sculpture */
    var haloCanvas = document.createElement("canvas");
    haloCanvas.width = 256;
    haloCanvas.height = 256;
    var haloContext = haloCanvas.getContext("2d");
    if (haloContext) {
      var haloGradient = haloContext.createRadialGradient(128, 128, 0, 128, 128, 128);
      haloGradient.addColorStop(0, "rgba(197,255,74,0.55)");
      haloGradient.addColorStop(0.4, "rgba(197,255,74,0.16)");
      haloGradient.addColorStop(1, "rgba(197,255,74,0)");
      haloContext.fillStyle = haloGradient;
      haloContext.fillRect(0, 0, 256, 256);

      var haloTexture = new THREE.CanvasTexture(haloCanvas);
      var halo = new THREE.Mesh(
        new THREE.PlaneGeometry(9, 9),
        new THREE.MeshBasicMaterial({
          map: haloTexture,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      halo.position.z = -4;
      scene.add(halo);
    }

    /* Faceted dark-chrome core */
    var coreGeometry = new THREE.IcosahedronGeometry(1.06, 2);
    var coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x101412,
      metalness: 1,
      roughness: 0.09,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      reflectivity: 1,
      envMapIntensity: 2.2
    });
    var core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.065, 1)),
      new THREE.LineBasicMaterial({ color: 0xc5ff4a, transparent: true, opacity: 0.14 })
    );
    core.add(edges);

    /* Concentric rings */
    var ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a423b,
      metalness: 1,
      roughness: 0.22,
      emissive: 0xc5ff4a,
      emissiveIntensity: 0.18,
      envMapIntensity: 1.8
    });

    function makeRing(radius, tube, opacity) {
      var material = ringMaterial.clone();
      material.transparent = true;
      material.opacity = opacity;
      return new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, 200), material);
    }

    var ringA = makeRing(1.62, 0.014, 1);
    ringA.rotation.set(Math.PI * 0.46, 0.2, 0.1);
    group.add(ringA);

    var ringB = makeRing(1.9, 0.009, 0.7);
    ringB.rotation.set(Math.PI * 0.36, -0.5, 0.6);
    group.add(ringB);

    var ringC = new THREE.Mesh(
      new THREE.TorusGeometry(1.34, 0.007, 8, 160),
      new THREE.MeshBasicMaterial({ color: 0xc5ff4a, transparent: true, opacity: 0.75 })
    );
    ringC.rotation.set(Math.PI * 0.5, 0.9, 0);
    group.add(ringC);

    var ringD = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.004, 6, 140),
      new THREE.MeshBasicMaterial({ color: 0x9b8aff, transparent: true, opacity: 0.4 })
    );
    ringD.rotation.set(Math.PI * 0.44, -0.9, 0.4);
    group.add(ringD);

    /* Orbiting accents */
    var orbit = new THREE.Group();
    group.add(orbit);

    var limeAccent = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 20, 20),
      new THREE.MeshStandardMaterial({
        color: 0xc5ff4a,
        emissive: 0xc5ff4a,
        emissiveIntensity: 2.4,
        metalness: 0.4,
        roughness: 0.35
      })
    );
    limeAccent.position.set(1.58, 0.34, 0.1);
    orbit.add(limeAccent);

    var violetAccent = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 18, 18),
      new THREE.MeshStandardMaterial({
        color: 0x9b8aff,
        emissive: 0x9b8aff,
        emissiveIntensity: 1.8,
        metalness: 0.4,
        roughness: 0.4
      })
    );
    violetAccent.position.set(-1.12, -0.86, 0.62);
    orbit.add(violetAccent);



    /* Particle dust */
    var particleCount = smallScreen ? 90 : 190;
    var positions = new Float32Array(particleCount * 3);

    for (var i = 0; i < particleCount; i++) {
      var radius = 2.3 + Math.random() * 1.5;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.82;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    var particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    var particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xcdd8b4,
        size: 0.022,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    scene.add(particles);

    /* Lighting */
    scene.add(new THREE.AmbientLight(0x2b3330, 0.55));

    var keyLight = new THREE.DirectionalLight(0xc5ff4a, 1.9);
    keyLight.position.set(3.4, 4.2, 3.2);
    scene.add(keyLight);

    var rimLight = new THREE.DirectionalLight(0xf4f1e8, 1.4);
    rimLight.position.set(-3.6, -2.4, -3);
    scene.add(rimLight);

    var violetLight = new THREE.PointLight(0x9b8aff, 20, 14, 2);
    violetLight.position.set(-2.6, -2.2, 2.4);
    scene.add(violetLight);

    /* Sizing */
    function resize() {
      var width = canvas.clientWidth || 1;
      var height = canvas.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    if (typeof ResizeObserver === "function") {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }
    resize();

    /* Pointer + scroll influence */
    var pointer = { x: 0, y: 0 };
    var scrollDepth = 0;

    if (finePointer && !reduceMotion) {
      window.addEventListener(
        "pointermove",
        function (event) {
          pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
          pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
        },
        { passive: true }
      );
    }

    function readScroll() {
      scrollDepth = Math.min(window.pageYOffset / Math.max(window.innerHeight, 1), 1.4);
    }
    window.addEventListener("scroll", readScroll, { passive: true });
    readScroll();

    /* Reveal the WebGL layer only once the first frame is ready */
    var contextLost = false;
    canvas.addEventListener("webglcontextlost", function (event) {
      event.preventDefault();
      contextLost = true;
      root.classList.remove("webgl");
    });

    if (reduceMotion) {
      group.rotation.set(0.2, -0.45, 0);
      renderer.render(scene, camera);
      root.classList.add("webgl");
      if (renderLabel) renderLabel.textContent = "WEBGL / STILL";
      return;
    }

    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(canvas);
    }

    var clock = new THREE.Clock();
    var firstFrame = true;

    function animate() {
      raf(animate);
      if (contextLost) return;

      var t = clock.getElapsedTime();

      group.rotation.y += (pointer.x * 0.42 - group.rotation.y) * 0.035;
      group.rotation.x += (-pointer.y * 0.24 + 0.16 - group.rotation.x) * 0.035;
      group.position.y = Math.sin(t * 0.6) * 0.06;
      group.position.z = -scrollDepth * 0.6;

      core.rotation.y += 0.0026;
      core.rotation.x = Math.sin(t * 0.32) * 0.08;

      orbit.rotation.y += 0.0034;
      orbit.rotation.z = Math.sin(t * 0.4) * 0.12;

      ringA.rotation.z += 0.0011;
      ringB.rotation.z -= 0.0007;
      ringC.rotation.z += 0.0015;
      ringD.rotation.z -= 0.0019;

      particles.rotation.y -= 0.0004;

      camera.position.z += (5.6 + scrollDepth * 0.9 - camera.position.z) * 0.05;

      if (visible) renderer.render(scene, camera);

      if (firstFrame) {
        firstFrame = false;
        root.classList.add("webgl");
        if (renderLabel) renderLabel.textContent = "WEBGL / LIVE";
      }
    }

    animate();
  }

  if (canvas && canRenderWebGL()) {
    import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js")
      .then(function (THREE) {
        initSculpture(THREE);
      })
      .catch(function () {
        /* Offline or blocked CDN: the CSS sculpture remains in place. */
      });
  }
})();
