#!/usr/bin/env node
/**
 * Iconic Original — generatore statico.
 *
 * Legge i frammenti da content/<lang>/<slug>.html (primo blocco: <!--META {json} -->),
 * li avvolge con head SEO + header/footer condivisi e scrive l'HTML finale nella
 * root del sito con URL directory-style (/chi-siamo/index.html ecc.).
 * Genera anche sitemap.xml con alternates hreflang.
 *
 * Uso:  node tools/build.mjs
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "content");
const HOST = "https://www.iconicoriginal.it";
const LANGS = ["it", "en", "de"];
const V = 112; // bump a ogni modifica di styles.css / script.js

/* ------------------------------------------------------------------ */
/* Dizionari header/footer                                             */
/* ------------------------------------------------------------------ */
const NAV = {
  it: [
    ["restyling", "Restyling"],
    ["come-lavoro", "Come lavoriamo"],
    ["realizzazioni", "Realizzazioni"],
    ["materiali", "Materiali"],
    ["sistema-modulare-magnetico", "Sistema modulare"],
    ["per-progettisti", "Per progettisti"],
    ["chi-siamo", "Chi siamo"],
    ["contatti", "Contatti"],
  ],
  en: [
    ["restyling", "Restyling"],
    ["come-lavoro", "How we work"],
    ["realizzazioni", "Projects"],
    ["materiali", "Materials"],
    ["sistema-modulare-magnetico", "Modular system"],
    ["chi-siamo", "About"],
    ["contatti", "Contact"],
  ],
  de: [
    ["restyling", "Restyling"],
    ["come-lavoro", "Arbeitsweise"],
    ["realizzazioni", "Projekte"],
    ["materiali", "Materialien"],
    ["sistema-modulare-magnetico", "Modulsystem"],
    ["chi-siamo", "Über uns"],
    ["contatti", "Kontakt"],
  ],
};

/* Footer: replica del footer di iconicwall.it (stesso layout, dati Iconic S.r.l.) */
const FOOTER = {
  it: {
    introAria: "Iconic",
    intro: "Riqualificazione di interni senza demolizioni<br>con Finiture 3M DI-NOC. Un unico interlocutore,<br>dall'idea all'inaugurazione.",
    companyAria: "Iconic S.r.l.",
    companyName: "Iconic Srl",
    address: "Via Guido Rossa, 39<br>35020 Ponte San Nicolò (PD)",
    vat: "P.IVA / C.F. 04683100988",
    menuTitle: "Menu",
    legalTitle: "Legali",
    socialTitle: "Social",
    legalPrivacy: "Privacy Policy",
    legalCookie: "Cookie Policy",
    rights: "Tutti i diritti riservati.",
    tagline: "Progettato e realizzato in Italia",
    home: "Home",
  },
  en: {
    introAria: "Iconic",
    intro: "Interior refurbishment without demolition<br>with 3M DI-NOC finishes. One point of contact,<br>from idea to opening.",
    companyAria: "Iconic S.r.l.",
    companyName: "ICONIC S.R.L. a socio unico",
    address: "Via Guido Rossa, 39<br>35020 Ponte San Nicolò (PD), Italy",
    vat: "VAT / Tax ID 04683100988",
    menuTitle: "Menu",
    legalTitle: "Legal",
    socialTitle: "Social",
    legalPrivacy: "Privacy Notice",
    legalCookie: "Cookie Notice",
    rights: "All rights reserved.",
    tagline: "Progettato e realizzato in Italia",
    home: "Home",
  },
  de: {
    introAria: "Iconic",
    intro: "Innenraumsanierung ohne Abbruch<br>mit 3M DI-NOC Oberflächen. Ein Ansprechpartner,<br>von der Idee bis zur Eröffnung.",
    companyAria: "Iconic S.r.l.",
    companyName: "ICONIC S.R.L. a socio unico",
    address: "Via Guido Rossa, 39<br>35020 Ponte San Nicolò (PD), Italien",
    vat: "USt-IdNr. / St.-Nr. 04683100988",
    menuTitle: "Menü",
    legalTitle: "Rechtliches",
    socialTitle: "Social Media",
    legalPrivacy: "Datenschutzerklärung",
    legalCookie: "Cookie-Richtlinie",
    rights: "Alle Rechte vorbehalten.",
    tagline: "Progettato e realizzato in Italia",
    home: "Home",
  },
};

const OG_LOCALE = { it: "it_IT", en: "en_US", de: "de_DE" };

/* ------------------------------------------------------------------ */
/* Utilità                                                             */
/* ------------------------------------------------------------------ */
function langPrefix(lang) {
  return lang === "it" ? "" : `/${lang}`;
}
function pageUrl(lang, slug) {
  const p = langPrefix(lang);
  return slug === "index" ? `${HOST}${p}/` : `${HOST}${p}/${slug}/`;
}
function outPath(lang, slug) {
  const p = lang === "it" ? "" : lang;
  return slug === "index"
    ? join(ROOT, p, "index.html")
    : join(ROOT, p, slug, "index.html");
}
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* raccoglie i frammenti: { slug: { it: {meta, body}, en: ..., de: ... } } */
const pages = {};
for (const lang of LANGS) {
  const dir = join(CONTENT, lang);
  let files = [];
  try {
    files = readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith(".html"));
  } catch {
    continue;
  }
  for (const f of files) {
    const raw = readFileSync(join(dir, String(f)), "utf8");
    const m = raw.match(/^<!--META\s*({[\s\S]*?})\s*-->/);
    if (!m) throw new Error(`META mancante in ${lang}/${f}`);
    const meta = JSON.parse(m[1]);
    let body = raw.slice(m[0].length).trim();
    // include di partial per lingua: <!--INCLUDE:nome--> → tools/partials/nome-<lang>.svg
    body = body.replace(/<!--INCLUDE:([\w-]+)-->/g, (_, name) =>
      readFileSync(join(ROOT, "tools", "partials", `${name}-${lang}.svg`), "utf8")
    );
    const slug = String(f).replace(/\\/g, "/").replace(/\.html$/, "");
    (pages[slug] ||= {})[lang] = { meta, body };
  }
}

/* ------------------------------------------------------------------ */
/* Blocchi condivisi                                                   */
/* ------------------------------------------------------------------ */
function headerHtml(lang, slug) {
  const p = langPrefix(lang);
  const items = NAV[lang]
    .map(([s, label]) => {
      const active = slug === s || (s === "realizzazioni" && slug.startsWith("realizzazioni/")) || (s === "per-progettisti" && slug.startsWith("per-progettisti/"));
      return `<a href="${p}/${s}/"${active ? ' class="active" aria-current="page"' : ""}>${label}</a>`;
    })
    .join("\n      ");

  const others = LANGS.map((l) => {
    const exists = pages[slug]?.[l] ? slug : "index";
    const cls = l === lang ? ' class="active"' : "";
    const name = { it: "Italiano", en: "English", de: "Deutsch" }[l];
    return `<li><a${cls} href="${pageUrl(l, exists).replace(HOST, "")}" lang="${l}" hreflang="${l}">${name}</a></li>`;
  }).join("\n          ");

  return `<a class="skip-link sr-only" href="#main">Skip</a>
  <header class="site-header">
    <a class="brand" href="${p}/" aria-label="Iconic — home">
      <img src="/assets/img/brand/iconic-logo-black.svg" alt="Iconic — Dress your interiors" width="115" height="50">
    </a>
    <nav class="main-nav" aria-label="Principale">
      ${items}
      <div class="lang-switcher">
        <button class="lang-current" type="button" aria-haspopup="true" aria-expanded="false">
          <span>${lang.toUpperCase()}</span>
          <svg class="lang-caret" viewBox="0 0 8 5" aria-hidden="true"><path d="M0 0l4 5 4-5z" fill="currentColor"/></svg>
        </button>
        <ul class="lang-dropdown">
          ${others}
        </ul>
      </div>
    </nav>
    <button class="menu-toggle" type="button" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button>
  </header>`;
}

function footerHtml(lang, slug) {
  const p = langPrefix(lang);
  const f = FOOTER[lang];
  const items = [["", f.home], ...NAV[lang]]
    .map(([s, label]) => `<a href="${p}/${s ? s + "/" : ""}">${label}</a>`)
    .join("\n        ");
  return `<footer>
    <div class="footer-inner">
      <div class="footer-columns">
        <section class="footer-column footer-company" aria-label="${f.companyAria}">
          <a class="footer-iconic-mark" href="${p}/" aria-label="Iconic">
            <img src="/assets/img/brand/iconic-logo-white.svg" alt="Logo Iconic" loading="lazy">
          </a>
          <strong>${f.companyName}</strong>
          <ul class="footer-contact-list">
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>${f.address}</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/></svg>
              <span>${f.vat}</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4Z"/><path d="m22 6-10 7L2 6"/></svg>
              <a href="mailto:${slug === "contatti" ? "info@iconicwall.it" : "info@iconicoriginal.it"}">${slug === "contatti" ? "info@iconicwall.it" : "info@iconicoriginal.it"}</a>
            </li>
          </ul>
        </section>

        <nav class="footer-column footer-nav" aria-label="${f.menuTitle}">
          <h2>${f.menuTitle}</h2>
        ${items}
        </nav>

        <nav class="footer-column footer-nav" aria-label="${f.legalTitle}">
          <h2>${f.legalTitle}</h2>
          <a href="${p}/privacy-policy/">${f.legalPrivacy}</a>
          <a href="${p}/cookie-policy/">${f.legalCookie}</a>
        </nav>

        <nav class="footer-column footer-nav footer-social" aria-label="${f.socialTitle}">
          <h2>${f.socialTitle}</h2>
          <a href="https://www.instagram.com/iconicwall.it/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
            <span>Instagram</span>
          </a>
          <a href="https://www.facebook.com/profile.php?id=61591808465350" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z"/></svg>
            <span>Facebook</span>
          </a>
          <a href="https://www.linkedin.com/company/iconicwall/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 11v6M8 8v.01M12 17v-6M12 14a3 3 0 0 1 6 0v3"/></svg>
            <span>LinkedIn</span>
          </a>
        </nav>
      </div>

      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Iconic Srl.<br>${f.rights}</span>
      </div>
    </div>
  </footer>`;
}

/* ------------------------------------------------------------------ */
/* JSON-LD                                                             */
/* ------------------------------------------------------------------ */
function localBusinessLd(lang, slug) {
  const contactPage = slug === "contatti";
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${HOST}/#organization`,
    name: "Iconic",
    legalName: "Iconic Srl",
    vatID: "IT04683100988",
    url: `${HOST}/`,
    logo: `${HOST}/assets/img/brand/logo-iconic-schema.png`,
    image: `${HOST}/assets/img/ambienti/hall-hotel-restyling.webp`,
    slogan: "Mantieni la storia, rinnova il design.",
    description:
      lang === "en"
        ? "Interior refurbishment without demolition with 3M DI-NOC architectural finishes, in Italy and abroad."
        : lang === "de"
          ? "Innenraumsanierung ohne Abbrucharbeiten mit 3M DI-NOC Oberflächen, in Italien und im Ausland."
          : "Riqualificazione di interni senza demolizioni con Finiture 3M DI-NOC, in Italia e all'estero.",
    ...(contactPage ? {} : { telephone: "+39 0437 794268" }),
    email: contactPage ? "info@iconicwall.it" : "info@iconicoriginal.it",
    address: {
      "@type": "PostalAddress",
      streetAddress: contactPage ? "Via Guido Rossa, 39" : "Zona artigianale Ciambèr",
      addressLocality: contactPage ? "Ponte San Nicolò" : "Val di Zoldo",
      addressRegion: contactPage ? "PD" : "BL",
      postalCode: contactPage ? "35020" : "32012",
      addressCountry: "IT",
    },
    ...(contactPage ? {} : { geo: { "@type": "GeoCoordinates", latitude: 46.3471, longitude: 12.1804 } }),
    areaServed: ["IT", "FR", "DE", "AT", "NL", "LU", "BE", "GR", "CY", "IL"],
    sameAs: [
      "https://www.instagram.com/iconic_dressyourinteriors/",
      "https://www.iconicwall.it/",
    ],
  };
}

function breadcrumbLd(lang, slug, meta) {
  if (slug === "index") return null;
  const parts = slug.split("/");
  const items = [
    { "@type": "ListItem", position: 1, name: "Home", item: pageUrl(lang, "index") },
  ];
  let acc = "";
  parts.forEach((part, i) => {
    acc = acc ? `${acc}/${part}` : part;
    const known = pages[acc]?.[lang]?.meta;
    items.push({
      "@type": "ListItem",
      position: i + 2,
      name: i === parts.length - 1 ? meta.breadcrumb || meta.h1 || meta.title : known?.breadcrumb || known?.h1 || part,
      item: pageUrl(lang, acc),
    });
  });
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
}

/* ------------------------------------------------------------------ */
/* Render pagina                                                       */
/* ------------------------------------------------------------------ */
function render(lang, slug, { meta, body }) {
  const url = pageUrl(lang, slug);
  const alternates = LANGS.filter((l) => pages[slug]?.[l])
    .map((l) => `  <link rel="alternate" hreflang="${l}" href="${pageUrl(l, slug)}">`)
    .join("\n");
  const xDefault = pages[slug]?.it ? pageUrl("it", slug) : url;
  const og = meta.ogImage ? `${HOST}${meta.ogImage}` : `${HOST}/assets/img/ambienti/hall-hotel-restyling.webp`;

  const ld = [localBusinessLd(lang, slug)];
  const bc = breadcrumbLd(lang, slug, meta);
  if (bc) ld.push(bc);
  if (Array.isArray(meta.schema)) ld.push(...meta.schema);

  const ldTags = ld
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join("\n  ");

  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${url}">
${alternates}
  <link rel="alternate" hreflang="x-default" href="${xDefault}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Iconic">
  <meta property="og:locale" content="${OG_LOCALE[lang]}">
  <meta property="og:title" content="${esc(meta.title)}">
  <meta property="og:description" content="${esc(meta.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${og}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/assets/img/brand/favicon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/img/brand/favicon-192.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Italiana&display=swap">
  <link rel="stylesheet" href="/tokens.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/styles.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/project-map.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/project-stage.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/restyling.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/materiali.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/iconicwall-page.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/about-page.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/contact-page.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/come-lavoro-page.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/works-page.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/guess-page.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/brand-case-pages.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/single-project-pages.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/progettisti-page.css?v=${V}">
${meta.bodyClass?.includes("home-page") ? `<link rel="stylesheet" href="/assets/css/home-page.css?v=${V}"><script src="/assets/js/home-page.js?v=${V}" defer></script>` : ""}
  <noscript><style>.reveal{opacity:1;transform:none}</style></noscript>
  <script src="/assets/js/script.js?v=${V}" defer></script>
${meta.bodyClass?.includes("guess-editorial") ? `<link rel="stylesheet" href="/assets/css/guess-editorial.css?v=${V}"><script src="/assets/js/guess-editorial.js?v=${V}" defer></script>` : ""}${meta.bodyClass?.includes("mantegna-editorial") ? `
<link rel="stylesheet" href="/assets/css/mantegna-editorial.css?v=3"><script src="/assets/js/mantegna-editorial.js?v=2" defer></script>` : ""}
  ${ldTags}
</head>
<body${meta.bodyClass ? ` class="${meta.bodyClass}"` : ""} data-page="${slug}">
  ${headerHtml(lang, slug)}
  <main id="main"${meta.bodyClass?.includes("dark-header") ? "" : ' class="page-main"'}>
${body}
  </main>
  ${footerHtml(lang, slug)}
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* Build                                                               */
/* ------------------------------------------------------------------ */
let count = 0;
const sitemapEntries = [];
for (const [slug, byLang] of Object.entries(pages)) {
  for (const lang of LANGS) {
    if (!byLang[lang]) continue;
    const html = render(lang, slug, byLang[lang]);
    const out = outPath(lang, slug);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html, "utf8");
    count++;
    if (byLang[lang].meta.noSitemap) continue;
    sitemapEntries.push({ lang, slug, url: pageUrl(lang, slug), priority: byLang[lang].meta.priority ?? (slug === "index" ? 1 : 0.7) });
  }
}

/* sitemap con alternates */
const bySlug = {};
for (const e of sitemapEntries) (bySlug[e.slug] ||= []).push(e);
const urls = sitemapEntries
  .map((e) => {
    const alts = bySlug[e.slug]
      .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.url}"/>`)
      .join("\n");
    return `  <url>\n    <loc>${e.url}</loc>\n${alts}\n    <priority>${e.priority}</priority>\n  </url>`;
  })
  .join("\n");
writeFileSync(
  join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
  "utf8"
);

console.log(`build ok — ${count} pagine, ${sitemapEntries.length} voci sitemap`);
