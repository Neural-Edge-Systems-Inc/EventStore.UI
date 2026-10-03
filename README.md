# Neural Edge EventStore.UI BSD Fork

> **This repository is not the current Kurrent/KurrentDB UI.**

This is the maintained user-interface source for the Neural Edge Systems Inc. EventStoreDB BSD fork. It is based on EventStore.UI commit `4175ff3f9c18cfd5432f76e3b3a5bed868084fca`, the exact submodule commit referenced by the maintained EventStoreDB 24.6 BSD baseline. At that commit, `package.json` explicitly declares the project license as `BSD-3-Clause`.

The original EventStore.UI project later added the Event Store License v2 in commit `8c3f442def01f75f427d4cbd3f5bf85f88bb8303` on 2024-09-30. This fork intentionally remains on the earlier BSD-licensed lineage and does not merge or copy later license-restricted source.

## Maintenance policy

- Preserve the BSD-licensed lineage and provenance.
- Apply maintenance and security fixes independently.
- Do not add Kurrent/Event Store marketing, support, telemetry, analytics, update checks, or documentation links.
- Runtime UI traffic must stay on the EventStoreDB node being administered unless a feature explicitly requires a user-configured external destination.
- Prefer local documentation and repository-local assets over mutable external resources.

## Relationship to EventStoreDB

The parent server repository pins this UI as `src/EventStore.UI`. The UI is intended to be built and embedded with the Neural Edge maintained EventStoreDB fork.

## Building

This is a legacy Angular/Gulp/Bower application. The original build toolchain is intentionally preserved for reproducibility while a modernization path is evaluated. Use an isolated container or other reproducible environment rather than installing the legacy toolchain globally.

Useful Gulp targets include:

```text
gulp lint
gulp html
gulp dist
```

The generated distribution is written to `es-dist`.

## Support and security

Issues for this fork belong in the Neural Edge repositories. Do not send support or vulnerability reports for this fork to Kurrent/Event Store channels.

See `PROVENANCE.md` for the exact lineage and license boundary.
