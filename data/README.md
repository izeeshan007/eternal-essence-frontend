# Catalogue data

- `current-catalog.json` is the storefront's bundled fallback catalogue. It is imported by `src/main.jsx`, so the frontend repository can build and deploy without reading files from the backend or EEERP repositories.
- `legacy-catalog.json` is the pre-Bakhoor, 137-product migration snapshot. Runtime code does not import it; keep it only for catalogue comparison or rollback analysis.

The API remains the primary live product source. When it is unavailable or behind the checked-in product array, the storefront uses `current-catalog.json` to keep the catalogue usable.
