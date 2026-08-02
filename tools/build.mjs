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
const V = 6; // bump a ogni modifica di styles.css / script.js

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

const FOOTER = {
  it: {
    payoff: "Mantieni la storia, rinnova il design.",
    claim: "Riqualificazione di interni senza demolizioni con Finiture 3M DI-NOC. Un unico interlocutore che progetta, coordina il cantiere e segue il risultato — in Italia e all'estero.",
    menuTitle: "Menu",
    sedeTitle: "Sede",
    legalPrivacy: "Privacy Policy",
    legalCookie: "Cookie Policy",
    rights: "Tutti i diritti riservati",
    family: "Parte del mondo Iconic insieme a",
    home: "Home",
  },
  en: {
    payoff: "Keep the story, renew the design.",
    claim: "Interior refurbishment without demolition with 3M DI-NOC architectural finishes. One single point of contact who designs, coordinates the works and follows the result through — in Italy and abroad.",
    menuTitle: "Menu",
    sedeTitle: "Headquarters",
    legalPrivacy: "Privacy Policy",
    legalCookie: "Cookie Policy",
    rights: "All rights reserved",
    family: "Part of the Iconic family together with",
    home: "Home",
  },
  de: {
    payoff: "Bewahren Sie die Geschichte, erneuern Sie das Design.",
    claim: "Innenraumsanierung ohne Abbrucharbeiten mit 3M DI-NOC Oberflächen. Ein einziger Ansprechpartner, der plant, die Baustelle koordiniert und das Ergebnis bis zur Übergabe begleitet — in Italien und im Ausland.",
    menuTitle: "Menü",
    sedeTitle: "Firmensitz",
    legalPrivacy: "Datenschutzerklärung",
    legalCookie: "Cookie-Richtlinie",
    rights: "Alle Rechte vorbehalten",
    family: "Teil der Iconic Welt zusammen mit",
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
      const active = slug === s || (s === "realizzazioni" && slug.startsWith("realizzazioni/"));
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
    <a class="brand" href="${p}/" aria-label="Iconic Original — home">
      <img src="/assets/img/brand/iconic-logo-black.svg" alt="Iconic Original — Dress your interiors" width="115" height="50">
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

function footerHtml(lang) {
  const p = langPrefix(lang);
  const f = FOOTER[lang];
  const items = [["", f.home], ...NAV[lang]]
    .map(([s, label]) => `<li><a href="${p}/${s ? s + "/" : ""}">${label}</a></li>`)
    .join("\n          ");
  return `<footer>
    <div class="footer-inner">
      <div class="footer-columns">
        <div class="footer-column">
          <p class="footer-brand"><img src="/assets/img/brand/iconic-logo-white.svg" alt="Iconic Original" width="145" height="63" loading="lazy"></p>
          <div class="footer-intro"><p>${f.payoff}<br>${f.claim}</p></div>
          <p class="footer-endorsed">
            <img src="/assets/img/brand/logo-3m-endorsed.webp" alt="3M Endorsed Installer" width="120" height="76" loading="lazy">
            <img src="/assets/img/brand/logo-3m-dinoc-bianco.webp" alt="3M DI-NOC Architectural Finishes" width="190" height="19" loading="lazy">
          </p>
        </div>
        <div class="footer-column">
          <h2>${f.menuTitle}</h2>
          <ul class="footer-nav">
          ${items}
          </ul>
        </div>
        <div class="footer-column">
          <h2>${f.sedeTitle}</h2>
          <ul class="footer-contact-list">
            <li><span>Iconic Original<br>Zona artigianale Ciambèr<br>32012 Val di Zoldo (BL) — Italy</span></li>
            <li><a href="tel:+390437794268">+39 0437 794268</a></li>
            <li><a href="mailto:info@iconicoriginal.it">info@iconicoriginal.it</a></li>
            <li class="footer-social"><a href="https://www.instagram.com/iconic_dressyourinteriors/" rel="noopener" target="_blank">Instagram — @iconic_dressyourinteriors</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-legal">
        <p>© ${new Date().getFullYear()} Iconic Original — ${f.rights} · <a href="${p}/privacy-policy/">${f.legalPrivacy}</a> · <a href="${p}/cookie-policy/">${f.legalCookie}</a></p>
        <p>${f.family} <a href="https://www.iconicwall.it/" rel="noopener">IconicWall</a></p>
      </div>
    </div>
  </footer>`;
}

/* ------------------------------------------------------------------ */
/* JSON-LD                                                             */
/* ------------------------------------------------------------------ */
function localBusinessLd(lang) {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${HOST}/#organization`,
    name: "Iconic Original",
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
    telephone: "+39 0437 794268",
    email: "info@iconicoriginal.it",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Zona artigianale Ciambèr",
      addressLocality: "Val di Zoldo",
      addressRegion: "BL",
      postalCode: "32012",
      addressCountry: "IT",
    },
    geo: { "@type": "GeoCoordinates", latitude: 46.3471, longitude: 12.1804 },
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

  const ld = [localBusinessLd(lang)];
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
  <meta property="og:site_name" content="Iconic Original">
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
  <link rel="stylesheet" href="/assets/css/styles.css?v=${V}">
  <noscript><style>.reveal{opacity:1;transform:none}</style></noscript>
  <script src="/assets/js/script.js?v=${V}" defer></script>
  ${ldTags}
</head>
<body${meta.bodyClass ? ` class="${meta.bodyClass}"` : ""} data-page="${slug}">
  ${headerHtml(lang, slug)}
  <main id="main"${meta.bodyClass?.includes("dark-header") ? "" : ' class="page-main"'}>
${body}
  </main>
  ${footerHtml(lang)}
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
