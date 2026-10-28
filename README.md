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

The baseline build uses Node.js 18.12.1, Gulp 4, and Bower for the remaining browser dependencies. Build it in an isolated container or other reproducible environment.

```text
npm install
bower install
gulp dist
```

The generated distribution is written to `es-dist`.

## Support and security

Issues for this fork belong in the Neural Edge repositories. Do not send support or vulnerability reports for this fork to Kurrent/Event Store channels.

See `PROVENANCE.md`, `SECURITY.md`, and `LICENSE.md`.
