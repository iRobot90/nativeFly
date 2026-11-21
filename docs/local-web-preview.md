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
The preview was checked against the pinned Expo web export via HTTP; browser
navigation and native devices have not been verified.
