# Neural Edge EventStore.UI BSD Fork

> **This repository is not the current Kurrent/KurrentDB UI.**

This repository is the Neural Edge Systems Inc. maintained EventStore.UI lineage for the EventStoreDB BSD fork. The maintained upstream baseline is commit `e442c32eaf511a36005717b2c867f8f2b7a35005`, dated 2024-08-20. At that commit, `package.json` declares `BSD-3-Clause`.

The original UI repository later added Event Store License v2 in commit `8c3f442def01f75f427d4cbd3f5bf85f88bb8303` on 2024-09-30. This fork intentionally stops before that license change and does not merge or copy later restricted source.

The EventStoreDB 24.6 source tree historically pinned an older UI commit, `4175ff3f9c18cfd5432f76e3b3a5bed868084fca`. Neural Edge uses the later pre-license-change UI baseline above because it contains the intervening BSD-licensed maintenance work, including changes already represented in the 24.6 embedded administration UI.

## Maintenance policy

- Preserve the BSD-licensed lineage and provenance.
- Apply maintenance and security fixes independently.
- Do not add Kurrent/Event Store marketing, support, telemetry, analytics, update checks, or documentation links.
- Runtime UI traffic stays on the EventStoreDB node being administered unless a feature explicitly uses a destination configured by the operator.
- Prefer repository-local documentation and assets over mutable external resources.

## Building

The maintained build uses Node.js 24 LTS, Gulp 5, ESLint 10, and Bower for the remaining browser dependencies. Build it in an isolated container or other reproducible environment. The exact Node.js patch release is pinned in `.node-version`.

```text
npm ci
npm audit --audit-level=low
npm run lint
npm run deps:browser
npm run build
```

The generated distribution is written to `es-dist`. The old JSHint workflow is now backed by ESLint 10 while preserving the `gulp lint` task and file-watch workflow. The old Gulp HTML/CSS minifier wrappers have been replaced by maintained minifier libraries. Minifier output may differ in byte representation even when the application source is unchanged.

The `gulp connect` and `gulp connectDist` development commands are retained using BrowserSync 3 instead of the abandoned `gulp-webserver` dependency. They provide a local static server, automatic browser opening outside CI, and live reload on file changes. `gulp connect` serves `src` on port 8000; `gulp connectDist` serves `es-dist` on port 8001.

The image-minification build dependencies were also removed. Maintained image assets are checked in already optimized and are copied directly into `es-dist`, avoiding vulnerable archive/XML processing dependencies during the build.

## Support and security

Issues for this fork belong in the Neural Edge repositories. Do not send support or vulnerability reports for this fork to Kurrent/Event Store channels.

See `PROVENANCE.md`, `SECURITY.md`, and `LICENSE.md`. Continuous integration on `main`, pull requests, maintained branches and nightly builds runs npm auditing, linting, and the complete UI distribution build. Tags produce CI build artifacts, not automatic vendor-hosted releases.
