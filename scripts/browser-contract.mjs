#!/usr/bin/env node
/**
 * Read-only, browser-level contract for the last BSD EventStoreDB Admin UI.
 *
 * Purpose: protect existing navigation and feature-gate behaviour while we
 * replace end-of-life AngularJS. This is not an API mutator or a login probe.
 * Run against an isolated, disposable node with --insecure and synthetic data.
 * It intentionally refuses network targets other than loopback by default.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { normalizeTestOrigin, expectedNavigation } from './browser-contract-routes.mjs';

function optionsFromArgs(argv) {
    const opts = {};
    for (const arg of argv) {
        if (arg === '--allow-remote') {
            opts.allowRemote = true;
        } else if (arg.startsWith('--') && arg.includes('=')) {
            const [key, ...parts] = arg.slice(2).split('=');
            if (!['base-url', 'chrome', 'out-dir', 'expected-loader'].includes(key) || !parts.join('=')) {
                throw new Error(`Unknown or empty option: ${arg}`);
            }
            opts[key] = parts.join('=');
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    if (!opts['base-url']) {
        throw new Error('Use --base-url=http://127.0.0.1:2113 for a disposable test node');
    }
    return opts;
}

function chromeExecutable(requested) {
    const choices = [requested, process.env.CHROME_PATH,
        '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'];
    const found = choices.find(p => p && fs.existsSync(p));
    if (!found) throw new Error('Chrome or Chromium not found; set --chrome=/absolute/path');
    return found;
}

async function inspectViewport(browser, origin, info, expectedLoader, name, viewport, outDir) {
    // Each viewport gets a new, empty browser context. No personal cookies or
    // credentials are copied from the user's normal browser/profile.
    const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
    const page = await context.newPage();
    const jsErrors = [];
    const outbound = [];
    const writes = [];
    const httpErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    page.on('request', request => {
        const url = request.url();
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
            writes.push({ method: request.method(), pathname: new URL(url).pathname });
        }
        if (/^https?:/i.test(url) && new URL(url).origin !== origin) {
            outbound.push(new URL(url).origin);
        }
    });
    page.on('response', response => {
        if (response.status() >= 400) {
            // Keep only paths, never query strings or raw response bodies.
            httpErrors.push({ status: response.status(), pathname: new URL(response.url()).pathname });
        }
    });

    try {
        const response = await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (response?.status() !== 200) throw new Error(`Admin UI bootstrap HTTP ${response?.status()}`);
        await page.waitForFunction(() => Boolean(globalThis.requirejs?.version && document.querySelector('.site-nav')),
            undefined, { timeout: 15000 });
        const loader = await page.evaluate(() => globalThis.requirejs.version);
        if (loader !== expectedLoader) throw new Error(`RequireJS version ${loader} != ${expectedLoader}`);

        const expected = expectedNavigation(info);
        const nav = [];
        for (const entry of expected) {
            const link = page.getByRole('link', { name: entry.label, exact: true }).first();
            if (await link.count() !== 1) throw new Error(`Missing menu link: ${entry.label}`);
            const disabled = await link.evaluate(a => a.classList.contains('disabled') ||
                a.getAttribute('aria-disabled') === 'true');
            if (disabled === entry.enabled) {
                throw new Error(`Incorrect feature gate for ${entry.label}: enabled expected=${entry.enabled}`);
            }
            nav.push({ label: entry.label, enabled: !disabled });
        }

        const routes = [];
        for (const entry of expected.filter(x => x.enabled)) {
            // Never click Add, Delete, Shutdown, Sign Out, or submit a form.
            await page.getByRole('link', { name: entry.label, exact: true }).first().click({ timeout: 10000 });
            await page.waitForTimeout(350);
            const fragment = new URL(page.url()).hash;
            if (!fragment.startsWith(entry.fragment)) {
                throw new Error(`${entry.label} route mismatch: ${fragment} != ${entry.fragment}`);
            }
            routes.push({ label: entry.label, fragment });
        }
        // Admin is enabled even in a minimal single-node configuration.
        await page.getByRole('link', { name: 'Admin', exact: true }).first().click();
        await page.waitForTimeout(350);
        const dimensions = await page.evaluate(() => ({
            viewportWidth: document.documentElement.clientWidth,
            pageWidth: document.documentElement.scrollWidth,
            title: document.title
        }));
        if (outDir) {
            // Screenshots can contain operational data. Only enable artifacts
            // against the isolated synthetic node that the caller controls.
            await page.screenshot({ path: path.join(outDir, `admin-${name}.png`), fullPage: true });
        }
        return { name, viewport, loader, nav, routes, dimensions,
            horizontalOverflow: dimensions.pageWidth > dimensions.viewportWidth,
            jsErrors, outbound: [...new Set(outbound)], writes, httpErrors };
    } finally {
        await context.close();
    }
}

async function main() {
    const opts = optionsFromArgs(process.argv.slice(2));
    const origin = normalizeTestOrigin(opts['base-url'], opts.allowRemote === true);
    const chrome = chromeExecutable(opts.chrome);
    const outDir = opts['out-dir'] && path.resolve(opts['out-dir']);
    if (outDir) fs.mkdirSync(outDir, { recursive: true });
    const browser = await chromium.launch({ executablePath: chrome, headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    try {
        const request = await browser.newContext({ ignoreHTTPSErrors: true });
        const response = await request.request.get(`${origin}/info`, { timeout: 10000 });
        if (response.status() !== 200) throw new Error(`/info failed: HTTP ${response.status()}`);
        const info = await response.json();
        await request.close();
        // Secure/production logins require dedicated synthetic identities and
        // a different authorization test. Never ask for or reuse credentials.
        if (info.authentication?.type !== 'insecure') {
            throw new Error('Browser contract requires an isolated, insecure synthetic node');
        }
        const versions = [
            ['desktop', { width: 1280, height: 800 }],
            ['mobile', { width: 390, height: 844 }]
        ];
        const views = [];
        for (const [name, viewport] of versions) {
            views.push(await inspectViewport(browser, origin, info,
                opts['expected-loader'] || '2.3.8', name, viewport, outDir));
        }
        const failures = views.flatMap(view => [
            ...view.jsErrors.map(x => `${view.name}: JavaScript error: ${x}`),
            ...view.outbound.map(x => `${view.name}: unexpected external request: ${x}`),
            ...view.writes.map(x => `${view.name}: unexpected ${x.method} to ${x.pathname}`)
        ]);
        const report = { baseOrigin: origin, serverVersion: info.esVersion, views, failures };
        if (outDir) fs.writeFileSync(path.join(outDir, 'contract.json'), JSON.stringify(report, null, 2) + '\n');
        for (const view of views) {
            console.log(`${view.name}: loader ${view.loader}, ${view.routes.length} readable routes, ` +
                `${view.jsErrors.length} JS exceptions, ${view.outbound.length} external requests, ` +
                `${view.writes.length} writes, horizontal overflow=${view.horizontalOverflow}`);
        }
        if (failures.length) throw new Error(failures.join('\n'));
        console.log('READ_ONLY_BROWSER_CONTRACT_PASS');
    } finally {
        await browser.close();
    }
}

main().catch(e => { console.error(`BROWSER_CONTRACT_FAILED: ${e.message}`); process.exitCode = 1; });
