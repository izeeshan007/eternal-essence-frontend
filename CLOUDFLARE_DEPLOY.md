# Cloudflare Pages deployment

Build command:
`npm run build`

Build output directory:
`dist`

Set this Cloudflare Pages environment variable:
`VITE_BACKEND_BASE_URL=https://YOUR-RAILWAY-BACKEND-DOMAIN`

Optional production backup backend (used automatically for safe requests when Railway is unavailable):
`VITE_BACKEND_FALLBACK_URL=https://eternal-essence-backend.onrender.com`

Do not include a trailing slash in either URL. The application also normalizes
trailing slashes defensively so requests never contain `//api`.

Railway backend CORS example:
`FRONTEND_URL=https://eternalessence.in,https://www.eternalessence.in,http://localhost:5173,http://localhost:3000`

Clean product routes:
- `/products/perfumes/purple_oud`
- `/products/attars/ameer_al_oud_attar`

Other clean page routes:
- `/admin` (full secured administration dashboard, including dealers)
- `/dealer` (direct URL only; deliberately omitted from public navigation)
- `/cart`
- `/orders`
- `/account`
- `/profile`
- `/about`
- `/contact`
- `/custom-set`
- `/perfume-card`

The included `public/_redirects` file restores `/admin` from `admin.html`, redirects the retired `/admin/dealers` URL back to `/admin`, and sends other routes to the React application.

This is required so refreshing a deep React route on Cloudflare Pages returns the React application instead of a 404.
