import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTestOrigin, expectedNavigation } from '../scripts/browser-contract-routes.mjs';

test('accepts loopback HTTP and HTTPS origins only by default', () => {
    assert.equal(normalizeTestOrigin('http://127.0.0.1:2113'), 'http://127.0.0.1:2113');
    assert.equal(normalizeTestOrigin('https://localhost:2113/'), 'https://localhost:2113');
    assert.equal(normalizeTestOrigin('http://[::1]:2113'), 'http://[::1]:2113');
    assert.throws(() => normalizeTestOrigin('http://192.168.1.10:2113'), /non-loopback/);
    assert.equal(normalizeTestOrigin('http://192.168.1.10:2113', true), 'http://192.168.1.10:2113');
});

test('rejects credentials and hidden URL components', () => {
    for (const url of ['file:///tmp/test', 'http://user:pass@localhost:2113/',
        'http://localhost:2113/web/index.html', 'http://localhost:2113/?secret=yes',
        'http://localhost:2113/#/admin']) {
        assert.throws(() => normalizeTestOrigin(url));
    }
});

test('disabled features remain visible but unavailable', () => {
    const contract = expectedNavigation({features: {atomPub: false, projections: false, userManagement: false}});
    assert.deepEqual(contract.filter(x => x.enabled).map(x => x.label),
        ['Dashboard', 'Persistent Subscriptions', 'Admin']);
    assert.deepEqual(contract.filter(x => !x.enabled).map(x => x.label),
        ['Stream Browser', 'Projections', 'Query', 'Users']);
});

test('enabled server features expose existing navigation routes', () => {
    const contract = expectedNavigation({features: {atomPub: true, projections: true, userManagement: true}});
    assert.equal(contract.length, 7);
    assert.ok(contract.every(x => x.enabled));
    assert.equal(contract.find(x => x.label === 'Stream Browser').fragment, '#/streams');
});

test('bad server info fails explicitly instead of assuming all features are enabled', () => {
    assert.throws(() => expectedNavigation({}), /feature flags/);
    assert.throws(() => expectedNavigation(null), /feature flags/);
});
