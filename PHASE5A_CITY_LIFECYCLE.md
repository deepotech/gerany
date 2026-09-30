# City Lifecycle States

The new city registry introduces formal lifecycle states to manage safe and gradual data ingestion, review, and publication.

## States

1. **DISCOVERED**: The city is known and tracked, but no meaningful data ingestion has started.
2. **REVIEW**: Data is being ingested and reviewed. The city is evaluated against pipelines, but is NOT exposed publicly.
3. **VALIDATED**: The city data has passed data quality checks and is ready for the final launch gates.
4. **READY_FOR_LAUNCH**: The city has passed the `validateCityForLaunch` script without any blockers and can safely be promoted.
5. **PUBLISHED**: The city is live. It appears in the footer, sitemap, routing tables, and search functionalities.
6. **PAUSED**: The city was live but has been temporarily disabled (e.g., due to massive data regression).

## Transitions
Transitions primarily happen via CLI promotion scripts and the `city-registry-overrides.json` file. A city cannot be transitioned to `PUBLISHED` if `validateCityForLaunch` returns `BLOCKED`.
