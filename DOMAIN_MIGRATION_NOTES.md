# Domain Migration Notes — Redirect Strategy & Next Steps

**Date:** 2026-10-01  
**Source Domain (Old):** `https://moscheeatlas.de`  
**Target Canonical Domain (New):** `https://moscheeindernaehe.de`  
**Brand Name:** MoscheeAtlas (Unchanged)  

---

## 1. Scope of Current Phase

In this phase, the application codebase has been prepared and certified for production readiness on `https://moscheeindernaehe.de` **prior to DNS connection**.

No automatic in-app HTTP redirect from `moscheeatlas.de` to `moscheeindernaehe.de` was added in application code because:
1. `moscheeatlas.de` is not yet connected to this production deployment alongside `moscheeindernaehe.de`.
2. DNS configuration for `moscheeindernaehe.de` must first resolve and verify SSL/TLS certificates on Railway.
3. Premature redirects without dual-domain ingress binding could cause certificate validation failures, DNS loop conditions, or invalid routing.

---

## 2. Post-DNS Redirect Architecture Plan

Once `moscheeindernaehe.de` is connected and serving traffic reliably, incoming traffic on the legacy domain (`moscheeatlas.de` and `www.moscheeatlas.de`) must be permanently redirected to `https://moscheeindernaehe.de`.

### Recommended Approaches:

### Option A: Edge / DNS Provider Level 301 Redirects (Recommended)
Configure the redirect directly at the DNS provider (e.g. Cloudflare, Cloudflare Page Rules, or registrar forwarding):
- `http://moscheeatlas.de/*` → `301 Moved Permanently` → `https://moscheeindernaehe.de/$1`
- `https://moscheeatlas.de/*` → `301 Moved Permanently` → `https://moscheeindernaehe.de/$1`
- `http://www.moscheeatlas.de/*` → `301 Moved Permanently` → `https://moscheeindernaehe.de/$1`
- `https://www.moscheeatlas.de/*` → `301 Moved Permanently` → `https://moscheeindernaehe.de/$1`

**Benefits:**
- Offloads traffic from the application origin.
- Zero server compute overhead.
- Preserves full path and query string fidelity for all indexed search URLs.

### Option B: Next.js Ingress / Middleware / next.config.mjs Redirects
If both domains point to the Railway deployment:
```javascript
// Example future next.config.mjs redirect rule
async redirects() {
  return [
    {
      source: '/:path*',
      has: [
        {
          type: 'host',
          value: 'moscheeatlas.de',
        },
      ],
      destination: 'https://moscheeindernaehe.de/:path*',
      permanent: true,
    },
    {
      source: '/:path*',
      has: [
        {
          type: 'host',
          value: 'www.moscheeatlas.de',
        },
      ],
      destination: 'https://moscheeindernaehe.de/:path*',
      permanent: true,
    },
    {
      source: '/:path*',
      has: [
        {
          type: 'host',
          value: 'www.moscheeindernaehe.de',
        },
      ],
      destination: 'https://moscheeindernaehe.de/:path*',
      permanent: true,
    },
  ];
}
```

---

## 3. Google Search Console & SEO Migration Checklist

When DNS is pointed and SSL is issued:
1. **Add Property:** Verify `https://moscheeindernaehe.de` in Google Search Console (Domain Property verification recommended via DNS TXT).
2. **Submit Sitemap:** Submit `https://moscheeindernaehe.de/sitemap.xml`.
3. **Change of Address Tool:** In Google Search Console, under the old `moscheeatlas.de` property, use the **Change of Address** tool to signal domain migration to Google's indexing pipeline.
4. **Monitor Index Coverage:** Track canonical adoption and 301 redirect uptake over 90–180 days.
