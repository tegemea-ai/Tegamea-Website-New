# Tegemea Website

Premium, UK-based virtual assistant and operational support for elite founders and professional services.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the **`API_KEY`** (Gemini API key) in `.env` or `.env.local` for the Operational Assessment feature. Do not commit this file; the key is injected at build time. For production, consider proxying the assessment call server-side (e.g. Netlify Function) so the key is not exposed in the client bundle.
3. Run the app:
   ```bash
   npm run dev
   ```

## Build

```bash
npm run build
```

Output is in `dist/`.

## Deploy to Netlify

- Connect the repo to Netlify; build command `npm run build`, publish directory `dist`.
- For the **Operational Assessment** feature, set **`API_KEY`** in Netlify: Site settings → Environment variables → add `API_KEY` with your Gemini API key.
