# Preview the Expo web export locally

After installing the repository's locked dependencies:

```sh
npx expo export --platform web --output-dir dist
node scripts/preview-web.cjs dist
```

Open http://127.0.0.1:4173. Direct loads of `/explore` and `/modal` serve the
matching exported HTML; unknown routes return 404. Stop the server with Ctrl+C.
An optional second argument changes the port. This server is for local preview
only, not a hosting or production configuration.

Run `node --test scripts/preview-web.test.cjs` for the disposable fixture checks.
Run `node scripts/movie-home-smoke.cjs` after exporting to check Home, Explore,
all five direct movie pages, and the missing-movie 404. See the
[README](../README.md#try-search-and-direct-links) for the interactive browser
checks. This workflow covers the web export, not native devices.
