# City Quality Gates

The `validateCityForLaunch` script enforces strict data gates before a city can transition to the `PUBLISHED` state.

- **GATE_A**: Core Registry Presence. The city must exist in the registry with canonical name, slug, and a valid German state. (Hard Blocker)
- **GATE_B**: Valid Coordinates. Ensures published entities have valid Germany-bounded coordinates (Lat: 47-55.5, Lng: 5.5-15.5). Blocks if 0 valid coordinates. Warns if < 80%.
- **GATE_C**: Completeness. Warns if > 50% records are missing a phone, or > 70% are missing a website. Blocks if 0 have addresses.
- **GATE_D**: Category Integrity. Warns if > 10% are non-mosque categories. Blocks if explicit club/sports organizations are found.
- **GATE_E**: PlaceId Deduplication. Blocks if duplicate placeIds are detected among publishable records.
- **GATE_F**: Minimum Records. Blocks if the publishable record count is less than `CITY_MIN_PUBLISHED_RECORDS` (5).
- **GATE_G**: Content Quality. Blocks if < 50% records have an address, or if no records have any phone or website data.
- **GATE_H**: valid Routing. Blocks if the city slug is invalid (`/^[a-z0-9-]+$/`) or canonical name is empty.
- **GATE_I**: Localization Routes. Blocks if DE/EN route patterns (slug, englishSlug) are missing.
- **GATE_J**: Search Aliases. Warns if no search aliases are defined.

A status of `READY_FOR_LAUNCH` is only returned if there are 0 hard blockers.
