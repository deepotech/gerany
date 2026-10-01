# Domain Migration — Environment Variables Specification

**Date:** 2026-10-01  
**Target Domain:** `https://moscheeindernaehe.de`  
**Application:** MoscheeAtlas  

---

## 1. Overview

The MoscheeAtlas application supports optional environment variable overrides for its canonical production origin via `process.env.NEXT_PUBLIC_SITE_URL`.

When deployed to production (e.g. Railway or container runtime), the environment variable should be configured as follows.

---

## 2. Production Environment Variables

| Variable Name | Required | Recommended Production Value | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Optional (default fallback built-in) | `https://moscheeindernaehe.de` | The fully qualified canonical origin for metadata, sitemaps, robots, and JSON-LD schema. |

### Notes:
- If `NEXT_PUBLIC_SITE_URL` is omitted in the environment, the application safely defaults to `https://moscheeindernaehe.de` defined in `src/lib/config.ts`.
- **Do not** add a trailing slash (e.g., use `https://moscheeindernaehe.de`, not `https://moscheeindernaehe.de/`).
- **Do not** include `www.` unless DNS routing is explicitly configured to require it as canonical. Canonical host is apex domain: `moscheeindernaehe.de`.

---

## 3. Platform Configuration Instructions (Railway)

1. Open Railway Dashboard → Project: **Germany Mosque Finder / MoscheeAtlas**.
2. Navigate to **Variables** tab for the web service.
3. Update or add:
   ```
   NEXT_PUBLIC_SITE_URL=https://moscheeindernaehe.de
   ```
4. Trigger a deployment or redeploy after setting the custom domain in Railway Settings.
