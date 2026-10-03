# Security

Security issues for this maintained fork should be reported through the Neural Edge `EventStore.UI` repository once published. Do not send Neural Edge fork issues to Kurrent/Event Store support channels.

## Legacy dependency status

This UI is a legacy Angular/Gulp/Bower application preserved from the BSD lineage. A reproducibility build using Node.js 10.20.1 succeeds, but the legacy npm development dependency graph currently reports known vulnerabilities. Those build-time findings must be treated as maintenance debt rather than ignored. The Bower-delivered browser dependencies also require a separate runtime dependency review because npm audit does not cover them.

Until that dependency review is complete, build the UI only in an isolated container and do not interpret a successful build as a claim that the legacy frontend dependency set is fully hardened.
