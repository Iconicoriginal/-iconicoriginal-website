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
      formSuccess: "Grazie! Il messaggio è arrivato: ti rispondo personalmente entro un giorno lavorativo.",
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
      formSuccess: "Thank you! Your message has arrived: I will reply personally within one working day.",
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
      formSuccess: "Danke! Ihre Nachricht ist angekommen: Ich antworte Ihnen persönlich innerhalb eines Werktags.",
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
        phone: (contactForm.elements.phone?.value || "").trim(),
        message,
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
