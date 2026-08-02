# Sito Iconic Original — iconicoriginal.it

Rifacimento completo del sito servizio di Iconic Original: riqualificazione/restyling
di interni senza demolizioni con pellicole 3M DI-NOC. Design system condiviso con
IconicWall (iconicwall.it). SEO-first. Statico, zero dipendenze runtime.

## Struttura

- `content/{it,en,de}/…` — **fonte dei contenuti**: un frammento HTML per pagina con
  blocco `<!--META {json} -->` in testa (title, description, schema JSON-LD extra,
  breadcrumb, ogImage, priority).
- `tools/build.mjs` — generatore statico: avvolge i frammenti con head SEO
  (canonical, hreflang IT/EN/DE, og, robots `index,follow`, JSON-LD LocalBusiness +
  BreadcrumbList), header/footer statici e genera `sitemap.xml`.
- `assets/css/styles.css` — design system estratto da IconicWall + componenti dedicati
  (slider prima/dopo `.ba-slider`, banda "Garantisco io" `.pledge-section`, metodo
  `.method-list`, mappa `.map-section`, gallery progetti…).
- `assets/js/script.js` — comportamento: header, menu mobile, selettore lingua,
  reveal, slider prima/dopo, accordion, form contatti, cookie banner (GA4 spento
  finché `GA_MEASUREMENT_ID` è vuoto).
- `assets/img/` — immagini .webp con nomi SEO (realizzazioni/, ambienti/, materiali/,
  applicazioni/, brand/, icons/).
- `api/contact.js` — serverless Vercel per il form: inoltra al webhook impostato in
  `CONTACT_WEBHOOK_URL` (variabile d'ambiente su Vercel).
- Le pagine finali nella root (`index.html`, `chi-siamo/index.html`, `en/…`, `de/…`)
  sono **generate**: non modificarle a mano, modificare i frammenti e rifare la build.

## Comandi

```bash
node tools/build.mjs        # rigenera tutte le pagine + sitemap.xml
```

Bump della costante `V` in `tools/build.mjs` a ogni modifica di styles.css/script.js
(cache busting `?v=`).

## Deploy

Pensato per **Vercel** (come iconicwall.it):
- `vercel.json` contiene redirect 301 (non-www → www, vecchi URL WordPress → nuove
  pagine), trailing slash e cache headers.
- Impostare l'env `CONTACT_WEBHOOK_URL` (webhook GoHighLevel o simile) per il form.
- In alternativa hosting Apache: usare `.htaccess` (stesse regole 301).

## SEO — cose fatte e cose da fare al lancio

Fatto nel codice: `index,follow` ovunque, canonical su host www, hreflang IT/EN/DE +
x-default, sitemap con alternates, JSON-LD (LocalBusiness, Service, Article per
progetto, BreadcrumbList, FAQPage su /come-lavoro/), un solo H1 per pagina, alt text
su tutte le immagini, webp + lazy-load, 301 dai vecchi URL.

Da fare al lancio (manuale):
1. Puntare il dominio a Vercel e verificare che `iconicoriginal.it` →
   `https://www.iconicoriginal.it` (301).
2. Google Search Console: aggiungere la proprietà, inviare
   `https://www.iconicoriginal.it/sitemap.xml`, chiedere l'indicizzazione delle
   pagine principali.
3. Impostare `GA_MEASUREMENT_ID` in `assets/js/script.js` se si vuole GA4 (il
   banner cookie si attiva da solo quando l'ID è presente).
4. Verificare la P.IVA/ragione sociale nelle pagine privacy (placeholder generico).

## Contenuti preservati dal vecchio sito

Claim: "Mantieni la storia, rinnova il design", "Semplicemente si riveste".
Testi integrali di chi-siamo/restyling/realizzazioni. Tutte le case histories
(Guess ×8 città, Fiorella Rubino ×3, Oltre ×3, Motivi, La Cala, Eis Café Alberto,
Mamiani, casa Haifa, ASD Lotta) con le gallery complete recuperate dagli uploads
WordPress. NAP invariato.
