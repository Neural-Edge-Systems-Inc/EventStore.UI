# Read-only Admin UI browser contract

The maintained BSD Admin UI still uses end-of-life AngularJS. Before removing or replacing its modules, run the same read-only browser contract against a **disposable, synthetic** EventStoreDB node. This intentionally covers API-exposed feature flags and enabled navigation without touching real streams, user accounts or credentials.

## Prerequisites

- Node.js matching `.node-version` with dependencies installed by `npm ci`.
- Chrome/Chromium available locally (or pass `--chrome=/absolute/path`). The package uses `playwright-core`, so it does not download or bundle a browser.
- A disposable EventStoreDB node on `127.0.0.1` with `--insecure --mem-db`; never use production data or personal credentials for this contract. Start the node using the parent EventStoreDB development checkout's .NET 8 build or an isolated container mapped to host loopback.
- The node must return `/info` with `authentication.type` set to `insecure`, plus the `features` object. The contract refuses login-protected nodes.

## Commands

Run the static route and URL-safety tests anytime, including CI:

```sh
npm run test:contract-routes
```

With the disposable server already listening on loopback:

```sh
npm run test:browser-contract -- --base-url=http://127.0.0.1:2113 --out-dir=/tmp/eventstore-ui-contract
```

For a different Chrome location use `--chrome=/absolute/path`. To test a deliberately authorized non-loopback **synthetic** service, pass `--allow-remote` explicitly. The harness never copies browser profiles or credentials and refuses credential-bearing URLs. It navigates read-only routes but never submits forms or operates server Admin actions.

The optional output directory contains `contract.json` and desktop/mobile Admin-page screenshots. Only enable screenshots against disposable/synthetic instances: screenshots may reveal operational data. The script records but does **not** fail on existing narrow-screen horizontal overflow (see mobile layout issue #3). It fails on uncaught JavaScript exceptions, unexpected off-host HTTP requests, attempted mutating requests, missing routes, wrong server feature gates, and incorrect RequireJS loader version.

## Coverage and limits

- Each desktop (1280×800) and mobile (390×844) run validates the loader, seven primary navigation links and their `/info` feature-gate states, then opens only enabled routes.
- The default expected RequireJS version is `2.3.8`; use `--expected-loader=...` only when intentionally testing another reviewed build.
- Missing `$scavenges` or similar 404s from an empty synthetic node are **recorded**, not hidden or treated as a JavaScript exception.
- This is a navigation/bootstrapping contract, **not** full end-to-end authorization, stream writes, forms, projection editing, or visual acceptance. Those require separate synthetic tests and appropriate scoped identities.
- GitHub UI CI runs the unit-testable route/security rules without a server. The full Chrome contract is executed locally or in a future dedicated synthetic server job; do not claim hosted browser coverage from those unit tests alone.
