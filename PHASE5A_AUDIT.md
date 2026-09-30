# Phase 5A Audit Report

## Current Architecture
- **City Configs:** The system currently relies on an array `CITY_CONFIGS` containing exactly 9 cities. This array dictates which cities are considered valid and live.
- **Routes & Sitemap:** The `sitemap.ts` and dynamic route generation use `CITY_CONFIGS`. If a city is not in this list, it is never published.
- **Components:** `Footer` and `HomeHero` iterate directly over `CITY_CONFIGS` to render the list of live cities.
- **City Indexability:** The logic for `isCityIndexable` simply checks for the presence of the city in `CITY_CONFIGS` and ensures at least 1 record exists.

## Identified Gaps
- **Lack of City Lifecycle:** There is no concept of a city lifecycle (e.g., Discovered, Review, Validated, Published). A city is either fully hardcoded into production or completely hidden.
- **No Explicit Promotion Gate:** The only barrier to launching a city is manually adding it to the `CITY_CONFIGS` array, bypassing data quality gates that should exist for cities as a whole.
- **Risk:** Adding a city to `CITY_CONFIGS` immediately exposes it to routing and indexing, which makes it dangerous to add pilot cities.

## Hannover and Bremen State
- Currently reside in `EXTENDED_CITY_CONFIGS` but contain no real production data. They are purely synthetic fixture entities used for pipeline tests.
- We must not promote these to the public sitemap or UI.

## Recommendations
- Implement a dedicated **City Registry** with a robust lifecycle abstraction (`CityLifecycleStatus`).
- Introduce **City Quality Gates** that must be passed before a city can transition to `PUBLISHED`.
- Refactor the application layer to use `getPublishedCityConfigs()` derived from the registry, rather than checking `CITY_CONFIGS` array length directly.
