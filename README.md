# Eternal Essence React storefront

This build keeps the working Eternal Essence store logic inside a React/Vite application while giving product detail pages and the new experience a proper React route layer.

## Routing

Product links are semantic and category-aware:

- Perfume: `/products/perfumes/purple_oud`
- Attar: `/products/attars/ameer_al_oud_attar`

Other storefront pages also have clean paths:

- `/`
- `/cart`
- `/orders`
- `/account`
- `/profile`
- `/about`
- `/contact`
- `/custom-set`
- `/perfume-card`

Private operational routes:

- `/admin` — original full admin dashboard, now including dealer management
- `/dealer` — dealer sign-in and trade collection; intentionally not linked in public navigation

Old hash-based links are still intercepted and converted to the clean routes.

## Product experience

The product page includes:

- Dynamic interactive Scent Journey built from the product Top / Heart / Base notes and accords.
- Catmull-Rom smoothing, hover/touch/drag exploration, contextual tooltip, phase, intensity and projection values.
- Gold/green Eternal Essence styling rather than copying the competitor theme.
- Floating cart control.
- Size-dependent price and image switching for perfume variants (8 / 20 / 30 / 50 / 100 ml and gift variants).
- Existing wishlist, reviews and cart logic bridged to the working storefront implementation.

The comparison table is shown on the home page only.

## Home page

The home page now adds:

- Perfumes collection card
- Attars collection card
- Explore More Products action
- Eternal Essence value strip
- How Eternal Essence Compares section

The existing collection navigation/filtering remains active.

## Offer popup

The Buy 3 Pay for 2 popup:

- appears at most once per 24 hours per browser
- closes when the visitor clicks anywhere on the overlay/content
- carries the `BUY3@2` offer into the cart
- the existing cart calculation applies the lowest-priced qualifying perfume as the offer discount once 3+ perfumes are present

## Image format

Product/static raster assets in the bundle are WebP. Legacy image references are converted to WebP paths and missing legacy filenames are backed by WebP aliases so variant switching does not create broken image requests.

## Run locally

1. `npm install`
2. Copy `.env.example` to `.env`
3. Set:

`VITE_BACKEND_BASE_URL=https://YOUR-RAILWAY-BACKEND-DOMAIN`

4. `npm run dev`

The development frontend normally opens at `http://localhost:5173`.

## Railway backend CORS

Keep the backend variable on Railway as a comma-separated list of allowed origins, for example:

`FRONTEND_URL=https://eternalessence.in,https://www.eternalessence.in,http://localhost:5173,http://localhost:3000`

Do not put multiple separate `FRONTEND_URL=` lines in the backend `.env`.

## Cloudflare Pages

Build command:

`npm run build`

Output:

`dist`

Set:

`VITE_BACKEND_BASE_URL=https://YOUR-RAILWAY-BACKEND-DOMAIN`

The included `_redirects` file sends all SPA routes back to `index.html`.
