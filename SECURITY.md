# Security

Report security issues for this maintained fork through the Neural Edge EventStore.UI repository. Do not send Neural Edge fork issues to Kurrent/Event Store support channels.

## Legacy frontend dependency status

This is a legacy Angular/Bower frontend. The maintained BSD baseline builds reproducibly with Node.js 18.12.1, npm 9.2.0, Gulp 4, and Bower 1.8.14.

During the current reproducibility build, npm reported 75 dependency findings in the historical Node build graph: 4 low, 24 moderate, 42 high, and 5 critical. These findings require a separate dependency-modernization pass. The Bower-delivered browser dependencies also require their own runtime review because npm audit does not cover them.

Until that work is complete, build the UI in an isolated container and do not interpret a successful build as a claim that the historical frontend dependency set is fully hardened.
