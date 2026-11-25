# nativeFly

nativeFly is an Expo movie discovery demo. It uses a small, fictional catalog bundled with the app, so the preview does not need an API key or account. It does not stream movies or link to streams.

## Review the web demo locally

From the repository root, install the locked dependencies, export the web app, and start the local preview:

```sh
npm ci
npx expo export --platform web --output-dir dist
node scripts/preview-web.cjs dist
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Stop the server with Ctrl+C when finished. See the [local web preview guide](docs/local-web-preview.md) for port options and preview-server tests. This server is for local review, not production hosting.

### Try search and direct links

1. From Home, choose **Browse all movies** to open Explore.
2. Search for `2024 drama`. The only result should be **Harbour Lights**.
3. Open **Details for Harbour Lights**. The address ends in `/movie/harbour-lights`.
4. Reload that address, or open it in a new tab. It should still show the same movie.
5. Open [a missing movie](http://127.0.0.1:4173/movie/missing). The preview server should return HTTP 404 rather than opening another movie.

## Develop locally

Use `npm run web` if you want the Expo development server instead of the static preview. Routes live in [app](app) and use [Expo Router](https://docs.expo.dev/router/introduction).

Keep real configuration in untracked `.env*` files. Only sanitized `.env.example` templates with placeholders may be committed. Ignore rules do not remove files that were already committed.
