/**
 * Navigation/target rules used by the read-only browser acceptance harness.
 * Keep these independent of Playwright so ordinary Node CI can test security
 * boundaries without needing a running EventStoreDB node or browser binary.
 */
export function normalizeTestOrigin(input, allowRemote = false) {
    let url;
    try {
        url = new URL(input);
    } catch {
        throw new Error('A fully qualified http(s) base URL is required');
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('The test target must use HTTP or HTTPS');
    }
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
        throw new Error('Provide a server origin only: no credentials, paths, queries, or fragments');
    }
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname.toLowerCase());
    if (!loopback && !allowRemote) {
        throw new Error('Refusing non-loopback test target without explicit --allow-remote');
    }
    return url.origin;
}

/**
 * A disabled feature is a server configuration decision, not a broken link.
 * These flags mirror src/js/run.js and the legacy navigation template.
 * This suite only clicks links; it never submits mutating Admin UI forms.
 */
export const NAVIGATION_CONTRACT = Object.freeze([
    { label: 'Dashboard', fragment: '#/dashboard', feature: null },
    { label: 'Stream Browser', fragment: '#/streams', feature: 'atomPub' },
    { label: 'Projections', fragment: '#/projections', feature: 'projections' },
    { label: 'Query', fragment: '#/query', feature: 'projections' },
    { label: 'Persistent Subscriptions', fragment: '#/subscriptions', feature: null },
    { label: 'Admin', fragment: '#/admin', feature: null },
    { label: 'Users', fragment: '#/users', feature: 'userManagement' }
]);

export function expectedNavigation(info) {
    if (!info || typeof info !== 'object' || !info.features || typeof info.features !== 'object') {
        throw new Error('The /info endpoint did not provide the expected feature flags');
    }
    return NAVIGATION_CONTRACT.map(({label, fragment, feature}) => ({
        label,
        fragment,
        enabled: feature === null || info.features[feature] === true
    }));
}
