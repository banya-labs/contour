# Region-neutral application experience

Contour's product headings, navigation, authentication, marketing, metadata and property capture no longer present the application as exclusive to one city. Real recorded locations are retained.

- Desktop and Field OS capture free-entry suburb/area and optional city/town. Unknown coordinates remain empty; entering an area does not invent a GPS pin.
- Property cards, flyers, sharing text, agent summaries and analytics use actual recorded locations. Missing data produces an explicit empty state, not an assumed city or agency office.
- Maps center on valid inventory coordinates. Equator and prime-meridian coordinates are valid. Empty inventories use a world overview; individual properties with no GPS show an unknown-location state. Optional regional overlays count properties by coordinates within their supplied geometry.
- Inquiry preferences accept any location. Empty preferences stay empty online and offline; saved legacy names and normalized matching remain compatible.
- `/api/property-location-search?q=...` requires authenticated property-read access, validates query length, limits agency requests, and caches successful lookups per agency. The public Nominatim-compatible provider uses a Redis lock shared across replicas to cap upstream requests at one per second. Without that lock, public lookup is unavailable; manual coordinates and map selection still work. Search only sends after the user presses Search or Enter.
- `PROPERTY_GEOCODER_URL` is operator configuration for replacing the compatible provider. The provider's [usage policy](https://operations.osmfoundation.org/policies/nominatim/) forbids autocomplete and confidential inputs; requests have an application-identifying User-Agent. No new dependencies were added.

The migration `20261005100000_region_neutral_property_city` changes the city default to an empty string for future records only. It does not rewrite existing cities, coordinates, agency addresses or preferences. Its adjacent development rollback changes only the default.

Legal jurisdiction, regulator identity, valid IANA timezone identifiers, actual optional geographic datasets and explicit test/demo coordinates retain their real regional names. These are factual domain data rather than an application-wide market restriction. This change does not alter billing currencies, compliance rules or existing agency configuration.

Verification: the full unit suite passed (400 tests, one skipped), production build and TypeScript checks passed, and changed-source lint introduced no findings against the existing main-branch baseline. Subsequent map lifecycle checks passed 16 focused tests. A browser preview with synthetic inventory verified free-entry area/city, actual location display, empty initial coordinates and explicit address search. Provider responses and map selection were fixtures; live provider capacity and production deployment are not verified by this preview. The default-only migration is authored and has not been applied to production.
