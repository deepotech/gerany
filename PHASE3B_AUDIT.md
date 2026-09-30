# PHASE 3B AUDIT — PRODUCTION UX, ACCESSIBILITY & PERFORMANCE
**Project:** MoscheeAtlas.de  
**Date:** 2026-09-29  
**Baseline:** 122/122 tests passing · ESLint clean · build ✓ · 1,372 static pages

---

## 1. UI ARCHITECTURE INVENTORY

### Routes (Static Pages Generated)
| Route Pattern | Locale | Count |
|---|---|---|
| `/{locale}` | DE/EN/AR | 3 |
| `/de/moscheen` + `/en/mosques` + `/ar/mosques` | DE/EN/AR | 3 |
| `/de/moscheen/[city]` + `/en/mosques/[city]` + `/ar/mosques/[city]` | 9 cities × 3 | 27 |
| `/de/moschee/[city]/[slug]` | 443 | 443 |
| `/en/mosque/[city]/[slug]` + `/ar/mosque/[city]/[slug]` | 443 × 2 | 886 |
| `/[locale]/admin` + `/admin` | 4 | 4 |
| `robots.txt` + `sitemap.xml` | 2 | 2 |
| **Total** | | **1,372** |

### Components
| Component | Type | Role |
|---|---|---|
| `Header` | Server | Brand, nav, language switcher |
| `Footer` | Server | City links, brand, tagline |
| `HomeHero` | Client (`use client`) | Hero, search form, city grid |
| `SearchClient` | Client (`use client`) | City page search/filter/map/list |
| `MosqueCard` | Server | Result card in list |
| `MosqueDetailView` | Server | Mosque detail page |
| `MapContainer` | Client (dynamic SSR=false) | Wraps LeafletProvider |
| `LeafletProvider` | Client | Actual Leaflet map |
| `LanguageSwitcher` | Client (`use client`) | DE/EN/AR switcher |

### Data Layer
- `src/data/mosques.json` — 443 published records
- `JsonMosqueRepository` — `getAllPublished()`, `getCities()`, `getNearby()`
- No database runtime; pure JSON file reads at build/request time

---

## 2. FINDINGS BY AREA

### A. HOMEPAGE

**P1 — Hardcoded city count in Header**
- `Header.tsx` L32: `"9 Städte • Deutschland"` is hardcoded.
- When new cities are added, this will silently show the wrong number.
- Not localized (only German). Shows "9 Städte" even on EN/AR routes.
- **Fix:** Pass `cityCount` prop from layout (already computed) into Header.

**P1 — Hero browse link uses hardcoded city name logic**
- `HomeHero.tsx` L130–134: Instead of using `dict`, contains locale-branched hardcoded English/Arabic/German phrases.
- `"Browse ${cities[0]?.name || 'mosques'} directory"` — not i18n compliant, not translatable.
- **Fix:** Add `homeFirstCityLink` key to dictionary or simplify to `getCityUrl` link with the first city's translated name from the city grid.

**P1 — Popular cities quick-links label hardcoded in HomeHero**
- `HomeHero.tsx` L142: `locale === 'en' ? 'Popular cities:' : locale === 'ar' ? 'مدن رائجة:' : 'Häufig gesucht:'`
- Inline locale branch instead of `dict.*` key.
- **Fix:** Add `quickSearchLabel` key to dictionary.

**P2 — City card description is a hardcoded inline locale branch**
- `HomeHero.tsx` L200–205: 3-way locale inline string for city card body text.
- Should use dictionary keys.

**P1 — City card CTA uses hardcoded inline string**
- `HomeHero.tsx` L211–215: `"Browse ${city.name} mosques →"` etc. inline.
- No i18n key. Arrow direction not flipped for RTL Arabic.
- **Fix:** Add `cityCta` dictionary key; use `dir`-aware arrow.

**P2 — `openNow` filter: "Restroom" filter missing from city page mobile pill row**  
- `SearchClient.tsx` has no `filterRestroom` toggle visible (it is in state but only in `filterRestroom` applied; it has no UI pill on the filter bar).  
- Actually re-reading: filterRestroom state exists but there is **no button rendering it** in the JSX (L295–L380 shows only wheelchair/parking/women). Users cannot toggle it from the UI.
- **Fix:** Add the restroom filter pill.

**P1 — "Karte wird geladen..." loading text in MapContainer is hardcoded DE-only**
- `MapContainer.tsx` L13: `"Karte wird geladen..."` — hardcoded German, no locale prop.
- Shows German text on EN and AR city pages.
- **Fix:** Pass locale to MapContainer and use dict.

**P1 — Mobile map/list toggle "Karte" label hardcoded in SearchClient**
- `SearchClient.tsx` L413: `<span>Karte</span>` — hardcoded German, not localized.
- **Fix:** Use dictionary key.

**P1 — "Standort aktiv" in SearchClient hardcoded**
- `SearchClient.tsx` L284: `'Standort aktiv'` — not in dictionary.
- **Fix:** Add `locationActive` key to dict.

**P1 — LanguageSwitcher city routing is hardcoded to Cologne only**
- `LanguageSwitcher.tsx` L30: `targetLocale === 'en' ? 'cologne' : 'koeln'` — hardcoded to Cologne regardless of current city.
- If user is on `/de/moscheen/berlin` and switches to EN → goes to `/en/mosques/cologne` instead of `/en/mosques/berlin`.
- L35: Same bug on detail page — city always replaced with cologne/koeln.
- **Fix:** Extract the city slug from the current path and find the correct localized slug from `CITY_CONFIGS`.

**P0 — LanguageSwitcher produces wrong city URLs for all cities except Cologne**
- This is production-broken: switching language on any non-Cologne city page sends users to the wrong city. Severity: P0 because it breaks a core navigation feature.

**P1 — Footer "Moscheen nach Stadt" and "Geografische Hierarchie" sections not localized**
- `Footer.tsx` L37: heading `"Moscheen nach Stadt"` — German only
- `Footer.tsx` L49: link text `"Moscheen in ${c.canonical}"` — German only
- `Footer.tsx` L84–99: entire "Geografische Hierarchie" section — German only
- Shows German text in English and Arabic layouts.
- **Fix:** Use dictionary keys or locale-branch correctly.

**P1 — Footer "6 Bundesländer" is hardcoded and may be inaccurate**
- `Footer.tsx` L92: `"6 Bundesländer"` — hardcoded. Currently covers cities in NRW, Bayern, Hessen, Hamburg (city-state), Berlin (city-state), Baden-Württemberg = actually 6 states, but this is fragile.
- Requires manual update if cities span new states. Document as P2.

**P2 — Header nav has two links pointing to the same URL (`getSearchUrl`)**
- `Header.tsx` L40 and L47: Both "Moscheen finden" and "Suchen" link to identical `getSearchUrl(locale)`.
- Redundant. Could consolidate into one meaningful nav entry.

**P1 — Detail page "Anrufen" and "Website" action buttons hardcoded German**
- `MosqueDetailView.tsx` L218: `<span>Anrufen</span>` — not in dictionary
- `MosqueDetailView.tsx` L230: `<span>Website</span>` — not in dictionary
- Displays German on EN/AR detail pages.
- **Fix:** Add `call` and `website` keys to dictionary and use them.

**P1 — MosqueDetailView: `Share2` icon imported but never used**
- `MosqueDetailView.tsx` L25: `Share2` is imported from lucide-react but no share button is rendered.
- Unused import is a lint warning source and dead code.

**P1 — MosqueDetailView: breadcrumb item 2 always shows "Deutschland" (hardcoded)**
- `MosqueDetailView.tsx` L76: `{ name: 'Deutschland', url: getHomeUrl(locale) }` — always German word "Deutschland".
- On EN page shows "Deutschland" instead of "Germany"; on AR shows "Deutschland" instead of "ألمانيا".
- **Fix:** Localize via dictionary.

**P1 — MapContainer loading state not keyboard-accessible or aria-labeled**
- The pulsing loading div has no `role="status"` or `aria-label`.
- Screen readers don't announce map loading.

**P2 — `CheckCircle2` used as city count badge icon (homeHero city cards)**
- `HomeHero.tsx` L194: `<CheckCircle2>` next to the count implies "verified count" but these are just listing counts.
- Could confuse users into thinking count represents verified mosques.
- Semantically ambiguous; consider `Building2` or a neutral number.

**P1 — `openNow` filter results: no content when openingHours is null for all records**
- Most mosques have `openingHours: null`. Activating "Jetzt geöffnet" shows 0 results with no explanation that most hours are unavailable.
- The empty state shows generic "Keine Moscheen gefunden" rather than a specific hint about why there are no open-now results.
- **Fix:** When `openNowOnly` is true and results are 0, the no-results hint should explain that opening hours are not recorded for most mosques.

### B. ACCESSIBILITY

**P1 — MosqueCard link wraps only text, not the full card**
- `MosqueCard.tsx` L65: `<Link href={detailUrl}>` wraps only the h3 text.
- The entire card is visually clickable-looking but only the name text is actually a link.
- Keyboard users can only tab to the name link; the card border/hover implies full-card click but it's not.
- **Acceptable as-is** — card has explicit "Details anzeigen →" link at bottom. The card design is fine; NOT a P0 because there is a valid link. P2 — could improve.

**P1 — `<nav>` breadcrumb in MosqueDetailView lacks `aria-label`**
- `MosqueDetailView.tsx` L114: `<nav className="flex...">` has no `aria-label`.
- Multiple `<nav>` elements on the page (header also has one) without distinct labels.
- **Fix:** Add `aria-label="Brotkrümmel-Navigation"` / `"Breadcrumb"` / `"المسار"`.

**P1 — Header `<nav>` lacks `aria-label`**
- `Header.tsx` L38: `<nav>` with no `aria-label`.
- **Fix:** Add `aria-label` per locale.

**P1 — Map loading state (`MapContainer.tsx`) lacks `role="status"` and `aria-label`**
- Already noted above.

**P1 — `<article>` in MosqueCard semantically correct but has no accessible name**
- `MosqueCard.tsx` L24: `<article>` without an `aria-label` or `aria-labelledby`.
- Articles should have accessible names. The `<h3>` inside is sufficient for `aria-labelledby`.
- **Fix:** Add `aria-labelledby` to `<article>`.

**P2 — Filter toggle buttons in SearchClient use `aria-pressed` correctly** ✓ — already good.

**P2 — `tablist`/`tab` role on mobile view switcher** ✓ — already correctly implemented.

**P1 — Language switcher `aria-label` says "Sprache wechseln zu X" in German always**
- `LanguageSwitcher.tsx` L59: `aria-label={`Sprache wechseln zu ${lang.label}`}` — hardcoded German "Sprache wechseln zu".
- On AR page, screen reader announces in German.
- P2 severity — the label is functional but not translated.

**P1 — Mosque detail page `<h2>` for facilities uses ShieldCheck icon which implies verification**
- `MosqueDetailView.tsx` L244: `<ShieldCheck className="text-brand-600" />` next to "Ausstattung & Service" heading.
- ShieldCheck is a verification/approval icon; using it for plain facilities is semantically misleading.
- Inconsistency: ShieldCheck was deliberately removed from UNVERIFIED status badges, but remains on the facilities heading.
- **Fix:** Replace with a neutral icon like `Layers` or `List`.

### C. PERFORMANCE

**P1 — `LocaleLayout` runs `getAllPublished()` twice per request**
- `[locale]/layout.tsx` L27: `const mosques = await repo.getAllPublished()`
- `[locale]/page.tsx` L54: `const [mosques, cities] = await Promise.all([repo.getAllPublished(), ...])`
- Both fire independently. Since it's a JSON file read, it's fast, but it's two separate passes of 443 records per page render.
- The layout only uses `mosques.length` for the footer — it doesn't need all 443 records.
- **Fix:** Add a `getCount()` or `getStats()` method to the repository to avoid loading all records just for the count.

**P2 — `HomeHero` is `use client`; entire hero runs client-side**
- The hero contains the search form (needs `useState`) so client rendering is required.
- But the city grid is pure presentational. Currently all city data is passed as props from the server page — this is correct.
- No fix needed here — architecture is intentional.

**P2 — Map loading state min-height inconsistency**
- `MapContainer.tsx` L11: `min-h-[340px]` in loading state
- `LeafletProvider.tsx` L132: `minHeight: '320px'` in live map
- 20px difference causes subtle layout shift when map loads.
- **Fix:** Unify to same value.

**P2 — No `loading` attribute on images in MosqueCard/Detail**
- No Next.js `<Image>` component used anywhere — all map tiles are handled by Leaflet.
- There are currently no mosque images displayed (data has image URLs but they're not rendered).
- No fix needed unless images are added.

### D. SEO

**P1 — Homepage `alternates.canonical` uses relative path `/de` not full URL**
- `[locale]/page.tsx` L30: `canonical: '/${locale}'` — relative URL.
- Next.js adds `NEXT_PUBLIC_SITE_URL` prefix for Open Graph (`url: ${SITE_URL}/${locale}`) but canonical is set as just `/${locale}`.
- Next.js typically resolves this correctly, but it's inconsistent with the OG URL pattern.
- Verify this doesn't cause issues in production; if `metadataBase` is not set, relative canonicals could be wrong.
- **Fix:** Set `metadataBase` in root layout or use absolute canonicals.

**P0 — Root `app/layout.tsx` has no `metadataBase` set**
- Without `metadataBase`, Next.js 14 may output relative canonical URLs and incorrect OG URLs.
- **Fix:** Add `metadataBase: new URL(SITE_URL)` to root layout metadata.

**P1 — City page SEO: hreflang implementation not verified in route files**
- Need to check city page `generateMetadata` for hreflang alternates.

**SEO checks already confirmed passing from Phase 3A** ✓:
- Sitemap: 1,362 HTTPS URLs
- Robots: correct disallow rules
- JSON-LD: Mosque + BreadcrumbList
- Admin: noindex + excluded from sitemap

### E. I18N / RTL

**P1 — Arrow direction in RTL not flipped**
- `HomeHero.tsx` L213–215: Arabic city CTA uses `←` (already correct — reversed for RTL)  ✓
- But `MosqueCard.tsx` L121: `{dict.common.viewDetails} →` — arrow is always `→` even in RTL Arabic.
- In RTL "View details →" should be "← عرض التفاصيل" (or the arrow flipped).
- **Fix:** Use CSS `dir`-aware approach: in RTL, the `→` appears on the wrong side. Use `rtl:rotate-180` on the arrow element or use a ChevronRight icon that auto-flips with CSS.

**P1 — Mobile toggle "Liste" in SearchClient hardcoded German**
- `SearchClient.tsx` L400: `Liste ({filteredMosques.length})` — hardcoded German.
- **Fix:** Add `listTab` and `mapTab` dictionary keys.

**P2 — Footer city links always say "Moscheen in Berlin" etc. (German) regardless of locale**
- Already noted under P1. The footer links in EN/AR routes display German text.

**P1 — `openNow` filter: hardcoded inline strings in SearchClient result header**
- `SearchClient.tsx` L234–236: `'mosques available'` / `'مسجد متاح'` / `'Moscheen gefunden'` — inline locale branches instead of dict keys.
- `SearchClient.tsx` L236: `'Sorted by distance'` / `'مرتبة حسب المسافة'` / `'Sortiert nach Entfernung'` — inline.
- **Fix:** Add these to dictionary.

### F. LOADING / EMPTY / ERROR STATES

**P1 — Map loading state label hardcoded German** — already noted.

**P1 — No 404 page customization visible**
- `app/_not-found` at `/_not-found` is Next.js default. The page shows generic Next.js error.
- A localized, branded 404 page improves UX significantly.
- **Fix:** Add `src/app/not-found.tsx` with German/localized message and link back to homepage.

**P1 — No error boundary for map failures**
- If Leaflet fails to initialize (e.g., network issue with OSM tiles), there's no fallback UI.
- The map simply stays empty. User sees no explanation.
- **Fix:** Add a fallback state or note inside LeafletProvider.

### G. TRUST / DATA

**✓ Verification semantics correct** — all 443 records UNVERIFIED, no ShieldCheck, neutral "Erfasst" badge.

**✓ Facility null handling correct** — `noInfo` shown for null, never converted to false.

**✓ Prayer times conservative** — only disclaimer shown, no speculative times.

**P1 — `ShieldCheck` icon used as Facilities section heading icon**
- Already noted above (accessibility section). Creates misleading visual association.

**P2 — Rating displayed without source attribution**
- `MosqueCard.tsx` L73–76: Rating shown as stars + number + review count with no source note.
- Users may think MoscheeAtlas collected these ratings.
- Low risk for now — ratings are clearly numerical, not editorially positioned.
- Document as P2 trust concern.

---

## 3. PRIORITIZED ISSUE LIST

### P0 (Production Blockers)
| # | Issue | File |
|---|---|---|
| P0-1 | LanguageSwitcher always routes to Cologne for any non-home city switch | `LanguageSwitcher.tsx` |
| P0-2 | No `metadataBase` in root layout — canonical/OG URLs may be relative | `app/layout.tsx` |

### P1 (Important Production Quality)
| # | Issue | File |
|---|---|---|
| P1-1 | Header "9 Städte" hardcoded and not localized | `Header.tsx` |
| P1-2 | "Anrufen" / "Website" buttons hardcoded German on detail page | `MosqueDetailView.tsx` |
| P1-3 | "Deutschland" breadcrumb not localized | `MosqueDetailView.tsx` |
| P1-4 | ShieldCheck used on Facilities section heading (misleads verification semantics) | `MosqueDetailView.tsx` |
| P1-5 | "Karte wird geladen..." hardcoded German in MapContainer loading | `MapContainer.tsx` |
| P1-6 | "Karte" tab label hardcoded German in SearchClient | `SearchClient.tsx` |
| P1-7 | "Liste (...)" tab label hardcoded German in SearchClient | `SearchClient.tsx` |
| P1-8 | "Standort aktiv" hardcoded in SearchClient | `SearchClient.tsx` |
| P1-9 | Result count "Moscheen gefunden" etc. hardcoded inline in SearchClient | `SearchClient.tsx` |
| P1-10 | Footer city links + headings not localized | `Footer.tsx` |
| P1-11 | Restroom filter pill missing from SearchClient filter bar | `SearchClient.tsx` |
| P1-12 | Share2 icon unused import in MosqueDetailView | `MosqueDetailView.tsx` |
| P1-13 | Nav breadcrumb missing `aria-label` | `MosqueDetailView.tsx` |
| P1-14 | Header nav missing `aria-label` | `Header.tsx` |
| P1-15 | MosqueCard `<article>` missing `aria-labelledby` | `MosqueCard.tsx` |
| P1-16 | MapContainer loading div missing `role="status"` | `MapContainer.tsx` |
| P1-17 | No branded 404 page | `app/not-found.tsx` |
| P1-18 | `→` arrow not RTL-aware in MosqueCard "Details anzeigen" CTA | `MosqueCard.tsx` |
| P1-19 | `getAllPublished()` called twice per page in layout + page | `layout.tsx`, `page.tsx` |
| P1-20 | City CTA text in HomeHero not using i18n dict | `HomeHero.tsx` |
| P1-21 | Quick-search label in HomeHero not using i18n dict | `HomeHero.tsx` |

### P2 (Polish / Future)
| # | Issue | File |
|---|---|---|
| P2-1 | City card description inline locale branch (not dict) | `HomeHero.tsx` |
| P2-2 | CheckCircle2 on city count badge implies verification | `HomeHero.tsx` |
| P2-3 | Header has two identical nav links to same URL | `Header.tsx` |
| P2-4 | Map loading vs live map minHeight mismatch (340 vs 320) | `MapContainer.tsx`, `LeafletProvider.tsx` |
| P2-5 | Marker clustering (intentionally deferred from Phase 3A) | `LeafletProvider.tsx` |
| P2-6 | External image hotlinking from Google (no images rendered yet) | Future |
| P2-7 | Rating attribution note (minor trust concern) | `MosqueCard.tsx` |
| P2-8 | Footer "6 Bundesländer" hardcoded | `Footer.tsx` |
| P2-9 | Language switcher aria-label in German always | `LanguageSwitcher.tsx` |

---

## 4. SCOPE DECISION

**Will fix in Phase 3B:**
- All P0 issues (P0-1, P0-2)
- All P1 issues (P1-1 through P1-21)
- P2-4 (map height consistency — trivial)

**Will defer:**
- P2-5 Clustering — confirmed P2 as per Phase 3A decision
- P2-6 Images — no images rendered yet
- P2-1, P2-2, P2-3, P2-7, P2-8, P2-9 — documented as P3B remaining items

---

## 5. FILES TO CHANGE

1. `src/app/layout.tsx` — add `metadataBase`
2. `src/lib/i18n/index.ts` — add missing dict keys
3. `src/components/Header.tsx` — accept `cityCount` prop, add `aria-label` to nav, remove duplicate link
4. `src/app/[locale]/layout.tsx` — pass `cityCount` to Header, avoid double repo call
5. `src/components/Footer.tsx` — localize city link texts and headings
6. `src/components/HomeHero.tsx` — use dict keys for all hardcoded strings
7. `src/components/SearchClient.tsx` — add restroom pill, localize hardcoded strings
8. `src/components/MosqueCard.tsx` — add `aria-labelledby`, RTL-aware arrow
9. `src/components/MosqueDetailView.tsx` — fix "Deutschland" breadcrumb, "Anrufen"/"Website" labels, ShieldCheck → Layers icon, `aria-label` on breadcrumb nav, remove unused Share2 import
10. `src/components/map/MapContainer.tsx` — pass locale prop, add `role="status"`, fix loading height
11. `src/components/LanguageSwitcher.tsx` — fix city routing bug (P0-1)
12. `src/app/not-found.tsx` — create branded 404 page
