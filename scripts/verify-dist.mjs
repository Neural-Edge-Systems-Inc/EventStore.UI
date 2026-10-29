import fs from 'node:fs';
import path from 'node:path';

const base = 'es-dist';
const required = [
    'index.html',
    'js/app.min.js',
    'js/requirejs.min.js',
    'css/main.min.css',
    'images/logo.svg',
    'fonts/roboto-regular-webfont.woff2',
    'favicon.png'
];

for (const relative of required) {
    const filename = path.join(base, relative);
    const stat = fs.statSync(filename);
    if (!stat.isFile() || stat.size === 0) {
        throw new Error(`Missing or empty distribution asset: ${filename}`);
    }
}

// Check actual vendor URLs, not protocol MIME types such as
// application/vnd.eventstore.competingatom+json needed by legacy clients.
const vendorUrl = /https?:\/\/(?:[a-z0-9.-]+\.)?(?:eventstore\.(?:com|org)|kurrent(?:db)?\.(?:com|io))\b|https?:\/\/github\.com\/(?:EventStore|kurrent-io)\//i;
for (const relative of ['index.html', 'js/app.min.js', 'css/main.min.css']) {
    const text = fs.readFileSync(path.join(base, relative), 'utf8');
    if (vendorUrl.test(text)) {
        throw new Error(`Vendor URL present in built asset: ${relative}`);
    }
}

console.log(`Verified ${required.length} required assets; no vendor URLs found`);
