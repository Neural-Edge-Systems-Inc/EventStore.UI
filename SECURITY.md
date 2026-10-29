# Security

Report security issues for this maintained fork through the Neural Edge `EventStore.UI` repository. Do not send Neural Edge fork issues to Kurrent/Event Store support channels.

## Legacy frontend dependency status

This is a legacy Angular/Bower frontend. The maintained BSD baseline builds reproducibly with Node.js 18.12.1, npm 9.2.0, Gulp 4, and Bower 1.8.14.

### Critical npm findings remediated

The initial audit reported five critical npm dependency findings. They were eliminated without using `npm audit fix --force` or importing post-license-change source:

- Removed `gulp-webserver`, which eliminated the vulnerable `open` and `websocket-driver` dependency paths. The `gulp connect` and `gulp connectDist` developer workflows are preserved with BrowserSync 3.0.4, which had zero findings in an isolated npm audit when selected.
- Removed `gulp-imagemin` and `imagemin-pngcrush`, which eliminated the vulnerable `fast-xml-parser` and `decompress` dependency paths. Image assets are now copied directly during the build.
- The already-optimized SVG assets from the validated embedded UI were checked into the maintained UI source so the dependency-free image-copy step reproduces the same distribution files.

After this remediation, `npm audit` reports **0 critical** findings. The current npm development dependency graph still reports **31 findings: 2 low, 7 moderate, 22 high, 0 critical**. Those remaining findings require a separate dependency-modernization pass.

The Bower-delivered browser dependencies also require their own runtime security review because `npm audit` does not cover them. Until that review and the remaining npm modernization are complete, build the UI in an isolated container and do not interpret a successful build as a claim that the historical frontend dependency set is fully hardened.
