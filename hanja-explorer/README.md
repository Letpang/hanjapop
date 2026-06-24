# Hanja Pop Native Shell

This directory contains the Capacitor iOS and Android projects.

The web application source lives in `../frontend`, and shared static assets
live in `../public`. Capacitor is configured to package `../frontend/dist`, so
build the frontend before syncing native assets.

## Common commands

```sh
npm run build
npm run sync
npm run open:ios
npm run open:android
```

`npm run build` delegates to `../frontend`, and `npm run sync` builds that
frontend bundle before running `cap sync`.
