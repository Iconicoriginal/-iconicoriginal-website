/* Iconic Original — comportamento sito (header, menu, reveal, prima/dopo, form, cookie) */
(() => {
  "use strict";

  const lang = document.documentElement.lang || "it";

  const i18n = {
    it: {
      formErrorName: "Inserisci il tuo nome.",
      formErrorEmailEmpty: "Inserisci la tua email.",
      formErrorEmailInvalid: "L'email non sembra valida.",
      formErrorMessage: "Scrivi due righe sul tuo progetto.",
      formErrorPrivacy: "Serve il consenso al trattamento dei dati.",
      formSending: "Invio in corso…",
      formSubmit: "Invia la richiesta",
      formSuccess: "Grazie! Il messaggio è arrivato: ti rispondiamo entro un giorno lavorativo.",
      formError: "Si è verificato un errore nell'invio. Riprova, oppure scrivi a info@iconicoriginal.it.",
      cookieText: "Questo sito usa cookie tecnici e, solo con il tuo consenso, cookie di misurazione del traffico.",
      cookieAccept: "Accetta",
      cookieReject: "Solo tecnici",
      cookiePolicy: "Cookie policy",
    },
    en: {
      formErrorName: "Please enter your name.",
      formErrorEmailEmpty: "Please enter your email.",
      formErrorEmailInvalid: "This email doesn't look valid.",
      formErrorMessage: "Tell us a few words about your project.",
      formErrorPrivacy: "Consent to data processing is required.",
      formSending: "Sending…",
      formSubmit: "Send request",
      formSuccess: "Thank you! Your message has arrived: we will reply within one working day.",
      formError: "Something went wrong. Please try again or write to info@iconicoriginal.it.",
      cookieText: "This site uses technical cookies and, only with your consent, traffic measurement cookies.",
      cookieAccept: "Accept",
      cookieReject: "Essential only",
      cookiePolicy: "Cookie policy",
    },
    de: {
      formErrorName: "Bitte geben Sie Ihren Namen ein.",
      formErrorEmailEmpty: "Bitte geben Sie Ihre E-Mail-Adresse ein.",
      formErrorEmailInvalid: "Diese E-Mail-Adresse scheint ungültig zu sein.",
      formErrorMessage: "Beschreiben Sie kurz Ihr Projekt.",
      formErrorPrivacy: "Die Einwilligung zur Datenverarbeitung ist erforderlich.",
      formSending: "Wird gesendet…",
      formSubmit: "Anfrage senden",
      formSuccess: "Danke! Ihre Nachricht ist angekommen: Wir antworten Ihnen innerhalb eines Werktags.",
      formError: "Beim Senden ist ein Fehler aufgetreten. Bitte erneut versuchen oder an info@iconicoriginal.it schreiben.",
      cookieText: "Diese Website verwendet technische Cookies und – nur mit Ihrer Einwilligung – Cookies zur Reichweitenmessung.",
      cookieAccept: "Akzeptieren",
      cookieReject: "Nur technische",
      cookiePolicy: "Cookie-Richtlinie",
    },
  };
  const t = i18n[lang] || i18n.it;

  /* GA4: lasciare vuoto per disattivare. Impostare l'ID misurazione quando disponibile. */
  const GA_MEASUREMENT_ID = "";

  /* --- Header: stato scrolled + barra progresso --- */
  const header = document.querySelector(".site-header");
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  document.body.appendChild(progress);

  let ticking = false;
  function updateScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 24);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  updateScroll();

  /* --- Menu mobile --- */
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      document.body.classList.toggle("menu-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        document.body.classList.remove("menu-open");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* --- Selettore lingua --- */
  const langSwitcher = document.querySelector(".lang-switcher");
  const langButton = langSwitcher?.querySelector(".lang-current");
  if (langSwitcher && langButton) {
    langButton.addEventListener("click", (e) => {
      e.stopPropagation();
      langSwitcher.classList.toggle("open");
    });
    document.addEventListener("click", () => langSwitcher.classList.remove("open"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") langSwitcher.classList.remove("open");
    });
  }

  /* --- Reveal on scroll --- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px" }
  );
  document.querySelectorAll(".reveal, .image-reveal").forEach((el) => revealObserver.observe(el));

  /* --- Slider Prima/Dopo --- */
  document.querySelectorAll(".ba-slider").forEach((slider) => {
    if (slider.classList.contains("ba-awaiting")) return;
    function setFromEvent(e) {
      const rect = slider.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      slider.style.setProperty("--ba", pct.toFixed(2) + "%");
    }
    let dragging = false;
    slider.addEventListener("pointerdown", (e) => {
      dragging = true;
      try { slider.setPointerCapture(e.pointerId); } catch {}
      setFromEvent(e);
    });
    slider.addEventListener("pointermove", (e) => dragging && setFromEvent(e));
    ["pointerup", "pointercancel"].forEach((ev) =>
      slider.addEventListener(ev, () => { dragging = false; })
    );
    /* accessibilità: frecce tastiera */
    slider.setAttribute("tabindex", "0");
    slider.setAttribute("role", "slider");
    slider.setAttribute("aria-label", slider.dataset.label || "Prima / Dopo");
    slider.addEventListener("keydown", (e) => {
      const cur = parseFloat(getComputedStyle(slider).getPropertyValue("--ba")) || 50;
      if (e.key === "ArrowLeft") slider.style.setProperty("--ba", Math.max(0, cur - 5) + "%");
      if (e.key === "ArrowRight") slider.style.setProperty("--ba", Math.min(100, cur + 5) + "%");
    });
  });

  /* --- Filtri archivio Realizzazioni --- */
document.querySelectorAll("[data-project-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.projectFilter;
    document.querySelectorAll("[data-project-filter]").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    document.querySelectorAll("[data-project-category]").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.projectCategory !== filter;
    });
    const firstVisible = document.querySelector(".works-project-row:not([hidden])");
    firstVisible?.dispatchEvent(new CustomEvent("projectpreview"));
  });
});

const worksIndex = document.querySelector("[data-works-index]");
if (worksIndex) {
  const preview = worksIndex.querySelector(".works-preview");
  const previewImage = worksIndex.querySelector("[data-works-preview-image]");
  const previewTitle = worksIndex.querySelector("[data-works-preview-title]");
  const previewLabel = worksIndex.querySelector("[data-works-preview-label]");
  const previewLocation = worksIndex.querySelector("[data-works-preview-location]");
  const rows = [...worksIndex.querySelectorAll(".works-project-row")];

  const selectProject = (row) => {
    if (!row || row.classList.contains("is-current")) return;
    rows.forEach((item) => item.classList.toggle("is-current", item === row));
    preview?.classList.add("is-changing");
    const nextImage = new Image();
    nextImage.src = row.dataset.projectPreview;
    nextImage.onload = () => {
      previewImage.src = nextImage.src;
      previewImage.alt = row.dataset.projectTitle;
      previewTitle.textContent = row.dataset.projectTitle;
      previewLabel.textContent = row.dataset.projectLabel;
      previewLocation.textContent = row.dataset.projectLocation;
      requestAnimationFrame(() => preview?.classList.remove("is-changing"));
    };
  };

  rows.forEach((row) => {
    row.addEventListener("mouseenter", () => selectProject(row));
    row.addEventListener("focus", () => selectProject(row));
    row.addEventListener("projectpreview", () => selectProject(row));
  });
}

const worksHero = document.querySelector("[data-works-hero]");
if (worksHero && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  worksHero.addEventListener("pointermove", (event) => {
    const bounds = worksHero.getBoundingClientRect();
    worksHero.style.setProperty("--works-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    worksHero.style.setProperty("--works-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
  });
}

document.querySelectorAll(".atlas-card").forEach((card) => {
  const title = card.querySelector("h3")?.textContent?.trim();
  if (!title || card.querySelector(".atlas-card-ghost")) return;
  const movingTitle = document.createElement("span");
  movingTitle.className = "atlas-card-ghost";
  movingTitle.setAttribute("aria-hidden", "true");
  movingTitle.textContent = `${title} · ${title} ·`;
  card.append(movingTitle);
});

const atlasProjects = document.querySelector(".atlas-projects");
if (atlasProjects) {
  const railHead = atlasProjects.querySelector(".atlas-projects-head");
  const railLabel = atlasProjects.querySelector("[data-atlas-current-label]");
  const railTitle = atlasProjects.querySelector("[data-atlas-current-title]");
  const railCopy = atlasProjects.querySelector("[data-atlas-current-copy]");
  const atlasCards = [...atlasProjects.querySelectorAll(".atlas-card")];
  let activeAtlasCard = null;
  let atlasSwitchTimer;

  const updateAtlasChapter = (card) => {
    if (!card || card === activeAtlasCard || card.hidden) return;
    activeAtlasCard = card;
    const title = card.querySelector("h3")?.textContent?.trim() || "Realizzazione";
    const label = card.querySelector("small")?.textContent?.trim() || "Progetto Iconic Original";
    const copy = card.querySelector("p")?.textContent?.trim() || "Scopri il progetto e la sua trasformazione.";
    const number = card.querySelector(".atlas-card-count")?.textContent?.trim();
    railHead?.classList.add("is-switching");
    window.clearTimeout(atlasSwitchTimer);
    atlasSwitchTimer = window.setTimeout(() => {
      railLabel.textContent = number ? `${number} · ${label}` : label;
      railTitle.textContent = title;
      railCopy.textContent = copy;
      railHead?.classList.remove("is-switching");
    }, 150);
  };

  let atlasScrollFrame;
  const syncAtlasChapter = () => {
    atlasScrollFrame = null;
    const viewportFocus = window.innerHeight * .52;
    const visibleCards = atlasCards.filter((card) => !card.hidden);
    const current = visibleCards.reduce((closest, card) => {
      const bounds = card.getBoundingClientRect();
      const cardCenter = bounds.top + bounds.height / 2;
      const distance = Math.abs(cardCenter - viewportFocus);
      return !closest || distance < closest.distance ? { card, distance } : closest;
    }, null);
    if (current) updateAtlasChapter(current.card);
  };

  const requestAtlasSync = () => {
    if (!atlasScrollFrame) atlasScrollFrame = requestAnimationFrame(syncAtlasChapter);
  };
  window.addEventListener("scroll", requestAtlasSync, { passive: true });
  window.addEventListener("resize", requestAtlasSync);
  atlasProjects.querySelectorAll("[data-project-filter]").forEach((button) => {
    button.addEventListener("click", () => requestAnimationFrame(syncAtlasChapter));
  });
  syncAtlasChapter();
}

const guessFilm = document.querySelector("[data-guess-film]");
if (guessFilm) {
  const rail = guessFilm.querySelector(".guess-film-rail");
  const label = guessFilm.querySelector("[data-guess-film-label]");
  const title = guessFilm.querySelector("[data-guess-film-title]");
  const copy = guessFilm.querySelector("[data-guess-film-copy]");
  const progress = guessFilm.querySelector("[data-guess-film-progress]");
  const frames = [...guessFilm.querySelectorAll(".guess-film-frame")];
  let activeFrame = null;
  let filmFrameRequest;
  let filmSwitchTimer;

  const syncGuessFilm = () => {
    filmFrameRequest = null;
    const focus = window.innerHeight * .52;
    const nearest = frames.reduce((current, frame, index) => {
      const bounds = frame.getBoundingClientRect();
      const distance = Math.abs(bounds.top + bounds.height / 2 - focus);
      return !current || distance < current.distance ? { frame, index, distance } : current;
    }, null);
    if (!nearest || nearest.frame === activeFrame) return;
    activeFrame = nearest.frame;
    frames.forEach((frame) => frame.classList.toggle("is-current", frame === activeFrame));
    rail?.classList.add("is-switching");
    window.clearTimeout(filmSwitchTimer);
    filmSwitchTimer = window.setTimeout(() => {
      label.textContent = activeFrame.dataset.filmLabel;
      title.textContent = activeFrame.dataset.filmTitle;
      copy.textContent = activeFrame.dataset.filmCopy;
      progress.style.transform = `scaleX(${nearest.index + 1})`;
      rail?.classList.remove("is-switching");
    }, 140);
  };

  const requestGuessFilmSync = () => {
    if (!filmFrameRequest) filmFrameRequest = requestAnimationFrame(syncGuessFilm);
  };
  window.addEventListener("scroll", requestGuessFilmSync, { passive: true });
  window.addEventListener("resize", requestGuessFilmSync);
  syncGuessFilm();
}

  /* --- Cartine delle collaborazioni multi-sede --- */
  document.querySelectorAll("[data-brand-location]").forEach((button) => {
    button.addEventListener("click", () => {
      const location = button.dataset.brandLocation;
      document.querySelectorAll(`[data-brand-location="${location}"]`).forEach((item) => item.classList.add("active"));
      document.querySelectorAll(`[data-brand-location]:not([data-brand-location="${location}"])`).forEach((item) => item.classList.remove("active"));
      document.querySelector(`[data-brand-store="${location}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* --- Mappa Europa: zoom, pan, tooltip e sincronizzazione con la colonna --- */
  const mapBoard = document.querySelector(".map-board");
  if (mapBoard) {
    const wrap = mapBoard.querySelector(".europe-map-wrap");
    const svg = mapBoard.querySelector(".europe-map");
    const pins = [...svg.querySelectorAll(".pin")];
    const items = [...mapBoard.querySelectorAll(".city-list li")];
    const byKey = {};
    pins.forEach((p) => { (byKey[p.dataset.k] ||= {}).pin = p; });
    items.forEach((li) => {
      const btn = li.querySelector("button");
      if (btn) (byKey[btn.dataset.k] ||= {}).li = li;
    });

    const tip = document.createElement("div");
    tip.className = "map-tip";
    tip.setAttribute("aria-hidden", "true");
    wrap.appendChild(tip);

    /* stato zoom (viewBox) */
    const base = svg.dataset.base.split(" ").map(Number);
    let z = 1;
    let cx = base[2] / 2;
    let cy = base[3] / 2;
    const applyView = () => {
      const w = base[2] / z;
      const h = base[3] / z;
      const half = { x: w / 2, y: h / 2 };
      cx = Math.min(Math.max(cx, half.x), base[2] - half.x);
      cy = Math.min(Math.max(cy, half.y), base[3] - half.y);
      svg.setAttribute("viewBox", `${cx - half.x} ${cy - half.y} ${w} ${h}`);
      const s = (1 / z).toFixed(4);
      pins.forEach((p) => p.setAttribute("transform", `translate(${p.dataset.x} ${p.dataset.y}) scale(${s})`));
      svg.style.touchAction = z > 1 ? "none" : "pan-y";
    };
    const clientToSvg = (e) => {
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      const vb = svg.viewBox.baseVal;
      return {
        x: vb.x + ((e.clientX - r.left) / r.width) * vb.width,
        y: vb.y + ((e.clientY - r.top) / r.height) * vb.height,
      };
    };
    const zoomAt = (factor, at) => {
      const nz = Math.min(8, Math.max(1, z * factor));
      if (nz === z) return;
      if (at) {
        cx = at.x + (cx - at.x) * (z / nz);
        cy = at.y + (cy - at.y) * (z / nz);
      }
      z = nz;
      applyView();
    };

    svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      zoomAt(e.deltaY < 0 ? 1.25 : 0.8, clientToSvg(e));
    }, { passive: false });

    mapBoard.querySelectorAll(".map-zoom button").forEach((b) => {
      b.addEventListener("click", () => {
        if (b.dataset.zoom === "in") zoomAt(1.4);
        else if (b.dataset.zoom === "out") zoomAt(1 / 1.4);
        else { z = 1; cx = base[2] / 2; cy = base[3] / 2; applyView(); }
      });
    });

    /* pan con trascinamento + pinch a due dita */
    const pointers = new Map();
    let pinchDist = 0;
    let dragged = false;
    svg.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".pin") && pointers.size === 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dragged = false;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      }
      svg.setPointerCapture?.(e.pointerId);
      svg.classList.add("dragging");
    });
    svg.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1 && z > 1) {
        const r = svg.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const vb = svg.viewBox.baseVal;
        cx -= ((e.clientX - prev.x) / r.width) * vb.width;
        cy -= ((e.clientY - prev.y) / r.height) * vb.height;
        if (Math.abs(e.clientX - prev.x) + Math.abs(e.clientY - prev.y) > 2) dragged = true;
        applyView();
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0) zoomAt(d / pinchDist);
        pinchDist = d;
      }
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
      svg.addEventListener(ev, (e) => {
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinchDist = 0;
        if (pointers.size === 0) svg.classList.remove("dragging");
      })
    );

    /* evidenziazione incrociata + tooltip "Guess + Città" */
    const setActive = (k, on) => {
      const rec = byKey[k] || {};
      rec.pin?.classList.toggle("active", on);
      rec.li?.classList.toggle("active", on);
      if (on && rec.pin) {
        tip.innerHTML = `<strong>Guess ${rec.pin.dataset.city}</strong>`;
        const pr = rec.pin.getBoundingClientRect();
        const wr = wrap.getBoundingClientRect();
        tip.style.left = `${pr.left + pr.width / 2 - wr.left}px`;
        tip.style.top = `${pr.top - wr.top}px`;
        tip.classList.add("visible");
      } else if (!on) {
        tip.classList.remove("visible");
      }
    };
    const clearActive = () => {
      pins.forEach((p) => p.classList.remove("active"));
      items.forEach((li) => li.classList.remove("active"));
      tip.classList.remove("visible");
    };

    pins.forEach((pin) => {
      const k = pin.dataset.k;
      pin.addEventListener("pointerenter", () => { clearActive(); setActive(k, true); });
      pin.addEventListener("pointerleave", () => setActive(k, false));
      pin.addEventListener("focus", () => { clearActive(); setActive(k, true); });
      pin.addEventListener("blur", () => setActive(k, false));
      pin.addEventListener("click", (e) => {
        e.preventDefault();
        if (dragged) return;
        clearActive();
        setActive(k, true);
        byKey[k].li?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
      pin.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); clearActive(); setActive(k, true); }
        if (e.key === "Escape") clearActive();
      });
    });

    items.forEach((li) => {
      const btn = li.querySelector("button");
      if (!btn) return;
      const k = btn.dataset.k;
      btn.addEventListener("pointerenter", () => { clearActive(); setActive(k, true); });
      btn.addEventListener("pointerleave", () => setActive(k, false));
      btn.addEventListener("focus", () => { clearActive(); setActive(k, true); });
      btn.addEventListener("blur", () => setActive(k, false));
      btn.addEventListener("click", () => { clearActive(); setActive(k, true); });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") clearActive();
    });
  }

  /* --- Mappa generale lavori: zoom, pan, conteggi e gallery --- */
  document.querySelectorAll("[data-work-map]").forEach((map) => {
    const viewport = map.querySelector(".work-map-viewport");
    const canvas = map.querySelector(".work-map-canvas");
    const pins = [...map.querySelectorAll(".work-map-pin")];
    const panels = [...map.querySelectorAll("[data-zone-panel]")];
    const intro = map.querySelector(".work-map-intro");
    const tip = map.querySelector(".work-map-tooltip");
    const locale = map.dataset.locale || "it";
    const nouns = { it: ["lavoro", "lavori"], en: ["project", "projects"], de: ["Projekt", "Projekte"] }[locale];
    let scale = 1;
    let tx = 0;
    let ty = 0;
    let moved = false;
    const pointers = new Map();

    const clamp = () => {
      const r = viewport.getBoundingClientRect();
      const minX = Math.min(0, r.width - r.width * scale);
      const minY = Math.min(0, r.height - r.height * scale);
      tx = Math.max(minX, Math.min(0, tx));
      ty = Math.max(minY, Math.min(0, ty));
    };
    const apply = () => { clamp(); canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; };
    const setScale = (next, x = viewport.clientWidth / 2, y = viewport.clientHeight / 2) => {
      next = Math.max(1, Math.min(4.5, next));
      const ratio = next / scale;
      tx = x - (x - tx) * ratio;
      ty = y - (y - ty) * ratio;
      scale = next;
      apply();
    };
    const reset = () => { scale = 1; tx = 0; ty = 0; apply(); pins.forEach((p) => p.classList.remove("active")); panels.forEach((p) => p.hidden = true); intro.hidden = false; };
    const showTip = (pin) => {
      const count = Number(pin.dataset.count);
      tip.textContent = `${pin.dataset.label} · ${count} ${count === 1 ? nouns[0] : nouns[1]}`;
      const pr = pin.getBoundingClientRect();
      const vr = viewport.getBoundingClientRect();
      tip.style.left = `${pr.left + pr.width / 2 - vr.left}px`;
      tip.style.top = `${pr.top - vr.top}px`;
      tip.classList.add("visible");
    };
    const activate = (pin, zoom = true) => {
      pins.forEach((p) => p.classList.toggle("active", p === pin));
      intro.hidden = true;
      panels.forEach((p) => p.hidden = p.dataset.zonePanel !== pin.dataset.zone);
      showTip(pin);
      if (zoom) {
        const target = 2.15;
        const x = parseFloat(pin.style.getPropertyValue("--x")) / 100 * viewport.clientWidth;
        const y = parseFloat(pin.style.getPropertyValue("--y")) / 100 * viewport.clientHeight;
        scale = target;
        tx = viewport.clientWidth / 2 - x * target;
        ty = viewport.clientHeight / 2 - y * target;
        apply();
      }
    };

    pins.forEach((pin) => {
      pin.addEventListener("pointerenter", () => showTip(pin));
      pin.addEventListener("pointerleave", () => { if (!pin.classList.contains("active")) tip.classList.remove("visible"); });
      pin.addEventListener("focus", () => showTip(pin));
      pin.addEventListener("blur", () => { if (!pin.classList.contains("active")) tip.classList.remove("visible"); });
      pin.addEventListener("click", (e) => { e.stopPropagation(); if (!moved) activate(pin); });
    });
    viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      const r = viewport.getBoundingClientRect();
      setScale(scale * (e.deltaY < 0 ? 1.18 : .84), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    viewport.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".work-map-pin")) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
      viewport.setPointerCapture?.(e.pointerId);
      viewport.classList.add("dragging");
    });
    viewport.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId) || scale === 1) return;
      const prev = pointers.get(e.pointerId);
      tx += e.clientX - prev.x;
      ty += e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = true;
      apply();
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((event) => viewport.addEventListener(event, (e) => { pointers.delete(e.pointerId); if (!pointers.size) viewport.classList.remove("dragging"); }));
    map.querySelectorAll("[data-map-action]").forEach((button) => button.addEventListener("click", () => {
      if (button.dataset.mapAction === "in") setScale(scale * 1.35);
      else if (button.dataset.mapAction === "out") setScale(scale / 1.35);
      else reset();
    }));
    viewport.addEventListener("keydown", (e) => {
      if (e.key === "+" || e.key === "=") setScale(scale * 1.3);
      if (e.key === "-") setScale(scale / 1.3);
      if (e.key === "Escape" || e.key === "0") reset();
    });
    window.addEventListener("resize", apply);
    apply();
  });

  /* --- Home: cartografia editoriale dei progetti --- */
  document.querySelectorAll("[data-project-map]").forEach(async (map) => {
    const viewport = map.querySelector(".project-map-viewport");
    const loading = map.querySelector(".project-map-loading");
    const tooltip = map.querySelector(".project-map-tooltip");
    const locale = map.dataset.locale || "it";
    const labels = {
      it: { open: "Apri il progetto", error: "La cartografia non è disponibile." },
      en: { open: "Open project", error: "The map is currently unavailable." },
      de: { open: "Projekt öffnen", error: "Die Karte ist derzeit nicht verfügbar." },
    }[locale];
    const ns = "http://www.w3.org/2000/svg";
    let svg;
    let camera;
    let markers = [];
    let scale = 1;
    let tx = 0;
    let ty = 0;
    let pointer;
    let moved = false;
    let tipTimer;
    const view = { width: 1600, height: 980 };
    const mapView = map.dataset.projectMapView;
    const minScale = mapView === "italy" ? 1.8 : 1;

    const mercator = (lat) => Math.log(Math.tan(Math.PI / 4 + Math.max(-85, Math.min(85, lat)) * Math.PI / 360));
    const bounds = { west: -12, south: 29, east: 37, north: 72 };
    const myMin = mercator(bounds.south);
    const myMax = mercator(bounds.north);
    const projectPoint = (lon, lat) => ({
      x: (lon - bounds.west) / (bounds.east - bounds.west) * view.width,
      y: (myMax - mercator(lat)) / (myMax - myMin) * view.height,
    });

    const clampView = () => {
      tx = Math.min(0, Math.max(view.width - view.width * scale, tx));
      ty = Math.min(0, Math.max(view.height - view.height * scale, ty));
    };
    const applyView = () => {
      if (!camera) return;
      clampView();
      camera.setAttribute("transform", `translate(${tx} ${ty}) scale(${scale})`);
      viewport.classList.toggle("is-detailed", scale >= 1.65);
      viewport.classList.toggle("is-provincial", scale >= 2.45);
      markers.forEach(({ node, point }) => node.setAttribute("transform", `translate(${point.x} ${point.y}) scale(${1 / (scale * .78)} ${1 / scale})`));
      map.querySelectorAll("[data-project-map-pan]").forEach((button) => button.toggleAttribute("disabled", scale <= minScale + .001));
      const zoomControl = map.querySelector("[data-project-map-zoom]");
      if (zoomControl && document.activeElement !== zoomControl) zoomControl.value = scale.toFixed(1);
    };
    const zoomAt = (next, x = view.width / 2, y = view.height / 2) => {
      next = Math.max(minScale, Math.min(6, next));
      const worldX = (x - tx) / scale;
      const worldY = (y - ty) / scale;
      tx = x - worldX * next;
      ty = y - worldY * next;
      scale = next;
      applyView();
    };
    const resetView = () => {
      if (mapView === "italy") {
        const center = projectPoint(12.5, 42.3);
        scale = 2.25;
        tx = view.width / 2 - center.x * scale;
        ty = view.height / 2 - center.y * scale;
      } else { scale = 1; tx = 0; ty = 0; }
      hideTip();
      applyView();
    };
    const localized = (item, key) => item[`${key}_${locale}`] || item[key];
    const localizedHref = (href) => locale === "it" ? href : `/${locale}${href}`;

    const positionTip = (node) => {
      const pinRect = node.getBoundingClientRect();
      const viewRect = viewport.getBoundingClientRect();
      const left = Math.max(120, Math.min(viewRect.width - 120, pinRect.left + pinRect.width / 2 - viewRect.left));
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${pinRect.top - viewRect.top}px`;
    };
    function showTip(node, item, delayed = false) {
      window.clearTimeout(tipTimer);
      const reveal = () => {
        tooltip.innerHTML = `<strong>${localized(item, "project")}</strong><span>${localized(item, "city")} · ${labels.open} ↗</span>`;
        tooltip.hidden = false;
        positionTip(node);
        requestAnimationFrame(() => tooltip.classList.add("is-visible"));
      };
      tipTimer = window.setTimeout(reveal, delayed ? 850 : 0);
    }
    function hideTip(delayed = false) {
      window.clearTimeout(tipTimer);
      const conceal = () => {
        tooltip.classList.remove("is-visible");
        window.setTimeout(() => { if (!tooltip.classList.contains("is-visible")) tooltip.hidden = true; }, 150);
      };
      tipTimer = window.setTimeout(conceal, delayed ? 220 : 0);
    }

    try {
      const [svgResponse, locationsResponse] = await Promise.all([
        fetch("/assets/data/iconic-project-map.svg"),
        fetch(map.dataset.locations || "/assets/data/project-locations.json"),
      ]);
      if (!svgResponse.ok || !locationsResponse.ok) throw new Error("map assets");
      const [svgText, allLocations] = await Promise.all([svgResponse.text(), locationsResponse.json()]);
      const projectScope = map.dataset.projectScope;
      const locations = projectScope ? allLocations.filter((item) => item.project === projectScope) : allLocations;
      const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
      svg = document.importNode(parsed.documentElement, true);
      svg.setAttribute("aria-labelledby", `project-map-title-${locale}`);
      camera = svg.querySelector(".project-map-camera");
      const markerLayer = svg.querySelector(".project-map-markers");

      const connectionLayer = document.createElementNS(ns, "g");
      connectionLayer.setAttribute("class", "project-map-connections");
      markerLayer.before(connectionLayer);
      const constellationPoints = locations.map((item) => projectPoint(item.lon, item.lat));
      const connected = new Set([0]);
      while (connected.size < constellationPoints.length) {
        let best = null;
        connected.forEach((from) => constellationPoints.forEach((toPoint, to) => {
          if (connected.has(to)) return;
          const fromPoint = constellationPoints[from];
          const distance = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
          if (!best || distance < best.distance) best = { from, to, distance };
        }));
        if (!best) break;
        const start = constellationPoints[best.from];
        const end = constellationPoints[best.to];
        const line = document.createElementNS(ns, "path");
        line.setAttribute("class", "project-map-connection");
        line.setAttribute("d", `M${start.x.toFixed(1)},${start.y.toFixed(1)} L${end.x.toFixed(1)},${end.y.toFixed(1)}`);
        line.setAttribute("aria-hidden", "true");
        connectionLayer.append(line);
        connected.add(best.to);
      }

      locations.forEach((item, index) => {
        const point = projectPoint(item.lon, item.lat);
        const node = document.createElementNS(ns, "a");
        node.classList.add("project-map-marker");
        node.setAttribute("href", localizedHref(item.href));
        node.setAttribute("tabindex", "0");
        node.setAttribute("aria-label", `${localized(item, "project")} — ${localized(item, "city")}`);
        node.setAttribute("data-location", String(index));
        const halo = document.createElementNS(ns, "circle");
        halo.setAttribute("class", "marker-halo");
        halo.setAttribute("r", "14");
        const dot = document.createElementNS(ns, "circle");
        dot.setAttribute("class", "marker-dot");
        dot.setAttribute("r", "5.5");
        node.append(halo, dot);
        node.addEventListener("pointerenter", () => showTip(node, item, true));
        node.addEventListener("pointerleave", () => hideTip(true));
        node.addEventListener("focus", () => showTip(node, item));
        node.addEventListener("blur", () => hideTip());
        node.addEventListener("click", (event) => { if (moved) event.preventDefault(); });
        markerLayer.appendChild(node);
        markers.push({ node, point, item });
      });

      loading?.remove();
      viewport.prepend(svg);
      tooltip.addEventListener("pointerenter", () => window.clearTimeout(tipTimer));
      tooltip.addEventListener("pointerleave", () => hideTip());
      resetView();
    } catch {
      if (loading) loading.textContent = labels.error;
      return;
    }

    viewport.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".project-map-marker, .project-map-controls")) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      moved = false;
      viewport.setPointerCapture?.(event.pointerId);
      viewport.classList.add("is-dragging");
      hideTip();
    });
    viewport.addEventListener("pointermove", (event) => {
      if (!pointer || pointer.id !== event.pointerId || scale <= 1) return;
      const rect = svg.getBoundingClientRect();
      tx += (event.clientX - pointer.x) / rect.width * view.width;
      ty += (event.clientY - pointer.y) / rect.height * view.height;
      moved ||= Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 2;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      applyView();
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((type) => viewport.addEventListener(type, (event) => {
      if (pointer?.id === event.pointerId) pointer = undefined;
      viewport.classList.remove("is-dragging");
    }));

    map.querySelectorAll("[data-project-map-action]").forEach((button) => button.addEventListener("click", () => {
      const action = button.dataset.projectMapAction;
      if (action === "fit" || action === "reset") resetView();
      else {
        const step = 150 / scale;
        if (action === "left") tx += step;
        if (action === "right") tx -= step;
        if (action === "up") ty += step;
        if (action === "down") ty -= step;
        hideTip();
        applyView();
      }
    }));
    map.querySelector("[data-project-map-zoom]")?.addEventListener("input", (event) => zoomAt(Number(event.currentTarget.value)));
    viewport.addEventListener("keydown", (event) => {
      const step = 90 / scale;
      if (event.key === "ArrowLeft") { tx += step; applyView(); }
      else if (event.key === "ArrowRight") { tx -= step; applyView(); }
      else if (event.key === "ArrowUp") { ty += step; applyView(); }
      else if (event.key === "ArrowDown") { ty -= step; applyView(); }
      else return;
      event.preventDefault();
    });
  });

  /* --- Home: project stage cinematografico --- */
  document.querySelectorAll("[data-project-stage]:not([data-home-stage])").forEach((stage) => {
    const images = [...stage.querySelectorAll("[data-stage-image]")];
    const triggers = [...stage.querySelectorAll("[data-stage-trigger]")];
    let frame;
    const activate = (index) => {
      images.forEach((image, current) => image.classList.toggle("is-active", current === index));
      triggers.forEach((trigger, current) => trigger.classList.toggle("is-active", current === index));
    };
    triggers.forEach((trigger) => {
      const index = Number(trigger.dataset.stageTrigger);
      trigger.addEventListener("pointerenter", () => activate(index));
      trigger.addEventListener("focus", () => activate(index));
    });
    stage.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        stage.style.setProperty("--stage-x", `${((x / rect.width) - .5) * -18}px`);
        stage.style.setProperty("--stage-y", `${((y / rect.height) - .5) * -12}px`);
        stage.style.setProperty("--cursor-x", `${x + 18}px`);
        stage.style.setProperty("--cursor-y", `${y + 18}px`);
        stage.classList.add("is-pointer-active");
      });
    });
    stage.addEventListener("pointerleave", () => {
      stage.classList.remove("is-pointer-active");
      stage.style.setProperty("--stage-x", "0px");
      stage.style.setProperty("--stage-y", "0px");
    });
  });

  /* --- Accordion --- */
  document.querySelectorAll(".accordion-item").forEach((item) => {
    const btn = item.querySelector(".accordion-button");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* --- Form contatti --- */
  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    const status = contactForm.querySelector(".form-status");
    const submitButton = contactForm.querySelector(".contact-submit");
    const submitLabel = submitButton?.querySelector(".contact-submit-label");
    const fields = ["full_name", "email", "message", "privacy"];
    const requestType = new URLSearchParams(location.search).get("richiesta");
    const requestPrompts = {
      campioni: "Vorrei ricevere una selezione di campioni per questo progetto: ",
      consulenza: "Vorrei richiedere un confronto tecnico su questo progetto: ",
      incontro: "Vorrei organizzare un incontro dedicato a: ",
    };
    if (requestType && requestPrompts[requestType] && !contactForm.elements.message.value) {
      contactForm.elements.message.value = requestPrompts[requestType];
    }

    const setFieldError = (name, message) => {
      const field = contactForm.elements[name];
      const error = contactForm.querySelector(`[data-error-for="${name}"]`);
      if (field) field.setAttribute("aria-invalid", message ? "true" : "false");
      if (error) {
        if (!error.id) error.id = `${name}_error`;
        error.textContent = message;
      }
    };
    const setStatus = (message, type = "") => {
      if (!status) return;
      status.textContent = message;
      status.className = `form-status${type ? ` ${type}` : ""}`;
    };

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus("");
      let valid = true;
      fields.forEach((n) => setFieldError(n, ""));
      const fullName = contactForm.elements.full_name.value.trim();
      const email = contactForm.elements.email.value.trim();
      const message = contactForm.elements.message.value.trim();
      const privacy = contactForm.elements.privacy.checked;
      if (!fullName) { setFieldError("full_name", t.formErrorName); valid = false; }
      if (!email) { setFieldError("email", t.formErrorEmailEmpty); valid = false; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError("email", t.formErrorEmailInvalid); valid = false; }
      if (!message) { setFieldError("message", t.formErrorMessage); valid = false; }
      if (!privacy) { setFieldError("privacy", t.formErrorPrivacy); valid = false; }
      if (!valid) return;

      const payload = {
        full_name: fullName,
        email,
        message,
        website: (contactForm.elements.website?.value || "").trim(),
        lingua: lang,
        pagina: location.pathname,
      };
      if (submitButton) {
        submitButton.disabled = true;
        if (submitLabel) submitLabel.textContent = t.formSending;
      }
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Request failed");
        contactForm.reset();
        fields.forEach((n) => setFieldError(n, ""));
        setStatus(t.formSuccess, "success");
        if (typeof window.gtag === "function") {
          window.gtag("event", "generate_lead", { form_id: "contact", lingua: lang });
        }
      } catch {
        setStatus(t.formError, "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          if (submitLabel) submitLabel.textContent = t.formSubmit;
        }
      }
    });
  }

  /* --- IconicWall: selettore della collezione --- */
  const iwCollection = document.querySelector("[data-iw-collection]");
  if (iwCollection) {
    const stageImage = iwCollection.querySelector("[data-iw-stage-image]");
    const stageName = iwCollection.querySelector("[data-iw-stage-name]");
    const stageCopy = iwCollection.querySelector("[data-iw-stage-copy]");
    const choices = [...iwCollection.querySelectorAll("button[data-image]")];
    const selectVariant = (button) => {
      if (!button || button.classList.contains("is-active")) return;
      choices.forEach((choice) => {
        const active = choice === button;
        choice.classList.toggle("is-active", active);
        choice.setAttribute("aria-pressed", String(active));
      });
      stageImage.classList.add("is-changing");
      const preload = new Image();
      preload.onload = () => {
        stageImage.src = button.dataset.image;
        stageImage.alt = `Composizione IconicWall ${button.dataset.name} in un living`;
        stageName.textContent = button.dataset.name;
        stageCopy.textContent = button.dataset.copy;
        requestAnimationFrame(() => stageImage.classList.remove("is-changing"));
      };
      preload.src = button.dataset.image;
    };
    choices.forEach((button) => button.addEventListener("click", () => selectVariant(button)));
  }

  /* --- Iconic Material Notes --- */
  const architectsNewsletter = document.querySelector(".architects-newsletter");
  if (architectsNewsletter) {
    const emailField = architectsNewsletter.elements.email;
    const privacyField = architectsNewsletter.elements.privacy;
    const submitButton = architectsNewsletter.querySelector('button[type="submit"]');
    const submitLabel = submitButton?.querySelector("span");
    const status = architectsNewsletter.querySelector(".architects-newsletter-status");
    const setNewsletterStatus = (message, type = "") => {
      if (!status) return;
      status.textContent = message;
      status.className = `architects-newsletter-status${type ? ` ${type}` : ""}`;
    };
    architectsNewsletter.addEventListener("submit", async (event) => {
      event.preventDefault();
      setNewsletterStatus("");
      const email = emailField.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailField.setAttribute("aria-invalid", "true");
        setNewsletterStatus("Inserisci un indirizzo email valido.", "error");
        emailField.focus();
        return;
      }
      emailField.setAttribute("aria-invalid", "false");
      if (!privacyField.checked) {
        privacyField.setAttribute("aria-invalid", "true");
        setNewsletterStatus("Per iscriverti è necessario accettare la Privacy Policy.", "error");
        privacyField.focus();
        return;
      }
      privacyField.setAttribute("aria-invalid", "false");
      submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = "Invio…";
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: "Iscrizione Material Notes",
            email,
            message: "Richiesta di iscrizione a Iconic Material Notes — Area Progettisti.",
            website: "",
            lingua: "it",
            pagina: location.pathname,
          }),
        });
        if (!response.ok) throw new Error("Request failed");
        architectsNewsletter.reset();
        setNewsletterStatus("Richiesta ricevuta. Ti aggiorneremo con le prossime Material Notes.", "success");
        if (typeof window.gtag === "function") {
          window.gtag("event", "sign_up", { method: "material_notes" });
        }
      } catch {
        setNewsletterStatus("Non siamo riusciti a inviare la richiesta. Scrivi a info@iconicwall.it.", "error");
      } finally {
        submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = "Iscrivimi";
      }
    });
  }

  /* --- Campione materiale nelle pagine progetto --- */
  document.querySelectorAll("[data-material-dialog-open]").forEach((materialDialogOpen) => {
    const materialDialog = document.getElementById(materialDialogOpen.dataset.materialDialogOpen);
    if (!materialDialog || typeof materialDialog.showModal !== "function") return;
    const materialDialogClose = materialDialog.querySelector("[data-material-dialog-close]");
    const closeMaterialDialog = () => materialDialog.close();
    materialDialogOpen.addEventListener("click", () => materialDialog.showModal());
    materialDialogClose?.addEventListener("click", closeMaterialDialog);
    materialDialog.addEventListener("close", () => materialDialogOpen.focus());
    materialDialog.addEventListener("click", (event) => {
      const rect = materialDialog.getBoundingClientRect();
      const onBackdrop = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (onBackdrop) closeMaterialDialog();
    });
  });

  /* --- Come lavoriamo: racconto sincronizzato delle fasi --- */
  document.querySelectorAll("[data-method-process]").forEach((process) => {
    const image = process.querySelector("[data-method-image]");
    const current = process.querySelector("[data-method-current]");
    const steps = [...process.querySelectorAll("[data-method-step]")];
    if (!image || !steps.length) return;
    const activate = (step, index) => {
      if (step.classList.contains("is-active")) return;
      steps.forEach((item) => item.classList.toggle("is-active", item === step));
      current.textContent = String(index + 1).padStart(2, "0");
      const next = new Image();
      image.classList.add("is-changing");
      next.onload = () => { image.src = next.src; requestAnimationFrame(() => image.classList.remove("is-changing")); };
      next.src = step.dataset.image;
    };
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio).slice(0, 1).forEach((entry) => activate(entry.target, steps.indexOf(entry.target)));
    }, { rootMargin: "-28% 0px -28% 0px", threshold: [.15, .45, .7] });
    steps.forEach((step) => observer.observe(step));
  });

  /* --- Cookie banner minimale (GA solo dopo consenso) --- */
  const CONSENT_KEY = "io-cookie-consent";
  function loadAnalytics() {
    if (!GA_MEASUREMENT_ID) return;
    const s = document.createElement("script");
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    s.async = true;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
  }
  const saved = (() => {
    try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
  })();
  if (saved === "all") loadAnalytics();
  else if (!saved && GA_MEASUREMENT_ID) {
    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    const cookieHref = lang === "it" ? "/cookie-policy/" : `/${lang}/cookie-policy/`;
    banner.innerHTML = `
      <div class="cookie-banner-copy"><p>${t.cookieText}</p>
      <nav><a href="${cookieHref}">${t.cookiePolicy}</a></nav></div>
      <div class="cookie-banner-actions">
        <button type="button" data-consent="essential" class="cookie-secondary-action">${t.cookieReject}</button>
        <button type="button" data-consent="all">${t.cookieAccept}</button>
      </div>`;
    document.body.appendChild(banner);
    banner.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-consent]");
      if (!btn) return;
      try { localStorage.setItem(CONSENT_KEY, btn.dataset.consent); } catch {}
      banner.remove();
      if (btn.dataset.consent === "all") loadAnalytics();
    });
  }
})();
