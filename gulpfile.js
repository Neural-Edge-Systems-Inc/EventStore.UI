'use strict';

import gulp from 'gulp';
import concat from 'gulp-concat';
import ngHtml2Js from 'gulp-ng-html2js';
import wrap from 'gulp-wrap';
import cache from 'gulp-cached';
import terser from 'gulp-terser';
import rjs from 'gulp-requirejs';
import htmlreplace from 'gulp-html-replace';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import { createServer } from 'vite';
import { Transform } from 'node:stream';
import { ESLint } from 'eslint';
import htmlMinifier from 'html-minifier-terser';
import CleanCSS from 'clean-css';
const sass = gulpSass(dartSass);

// Use maintained minifiers directly; the old Gulp wrappers brought unpatched
// dependencies into the build. Preserve Vinyl metadata and surface failures.
function textTransform(operation, transform) {
    return new Transform({
        objectMode: true,
        transform(file, encoding, callback) {
            if (file.isNull()) return callback(null, file);
            if (file.isStream()) return callback(new Error(`${operation}: streamed files are unsupported`));
            Promise.resolve()
                .then(() => transform(file.contents.toString('utf8')))
                .then(result => {
                    file.contents = Buffer.from(result, 'utf8');
                    callback(null, file);
                }, callback);
        }
    });
}

function htmlmin(options) {
    return textTransform('HTML minification', html => htmlMinifier.minify(html, options));
}

function minifyCSS() {
    return textTransform('CSS minification', css => {
        const result = new CleanCSS({ level: 1 }).minify(css);
        if (result.errors.length) throw new Error(result.errors.join('; '));
        return result.styles;
    });
}

// Keep the old `gulp connect` and `gulp connectDist` workflows without the
// BrowserSync/resp-modifier -> unpatched minimatch dependency chain.
// Vite is a development-only HTTP server; production UI output still comes
// from the existing Gulp distribution build, not Vite bundling.
function startDevServer(baseDir, port) {
    return async function serve() {
        const server = await createServer({
            configFile: false,
            root: baseDir,
            appType: 'mpa',
            server: {
                host: '127.0.0.1',
                port,
                strictPort: true,
                open: !process.env.CI
            }
        });
        await server.listen();
        server.printUrls();
        // The listener keeps Gulp alive until Ctrl+C; close it on termination.
        process.once('SIGTERM', () => { void server.close(); });
    };
}

var paths = {
    app: {
        templatesSource: './src/views/*.tpl.html',
        templatesDestination: './src/js/templates',
        source: './src/js/**/*.js'
    },
    all: [
        './src/js/**/*.js'
    ],
    dist: {
        js: ['js/app.min.js', 'js/requirejs.min.js'],
        css: 'css/main.min.css'
    }
};

var htmlMinOpts = {
    //collapseBooleanAttributes: true,
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true
};

var rjsOpts = {
    baseUrl: './src/js/',
    name: 'bootstrap',
    findNestedDependencies: true,
    out: 'app.min.js',
    shim: {
        'angular': {
            exports: 'angular'
        },
        'ngCookies': {
            deps: ['angular'],
            exports: 'ngCookies'
        },
        'uiRouter': {
            deps: ['angular']
        },
        'ngToastr': {
            deps: ['angular'],
            exports: 'ngToastr'
        },
        'uiAce': {
            deps: ['angular', 'ace']
        },
        'uiUtils': {
            deps: ['angular']
        },
        'sprintf': {
            exports: 'sprintf'
        }
    },
    priority: [
        'angular'
    ],
    paths: {
        'domReady': '../bower_components/requirejs-domready/domReady',
        'angular': '../bower_components/angular/angular',
        'ngCookies': '../bower_components/angular-cookies/angular-cookies',
        'uiRouter': '../bower_components/angular-ui-router/release/angular-ui-router',
        'ngToastr': '../bower_components/angular-toastr/dist/angular-toastr',
        'uiUtils': '../bower_components/angular-ui-utils/ui-utils',
        'jQuery': '../bower_components/jQuery/dist/jquery',
        'sprintf': '../bower_components/sprintf/src/sprintf',
        'uiAce': '../bower_components/angular-ui-ace/ui-ace',
        'ace': '../bower_components/ace-builds/src-min-noconflict/ace',
        'angular-clipboard': '../bower_components/angular-clipboard/angular-clipboard',
        'es-ui': './app'
    }
};

gulp.task('compile-sass', function () {
  return gulp.src('./src/scss/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('./src/css'));
});

gulp.task('dist-min-css', function () {
    return gulp.src('./src/css/*.css')
        .pipe(minifyCSS())
        .pipe(concat('main.min.css'))
        .pipe(gulp.dest('./es-dist/css/'));
});

gulp.task('dist-copy-images', gulp.parallel(
    function copyImages() {
        return gulp.src('./src/images/*', { encoding: false }).pipe(gulp.dest('./es-dist/images/'));
    },
    function copyRootIcons() {
        return gulp.src('./src/*.png', { encoding: false }).pipe(gulp.dest('./es-dist/'));
    }
));

gulp.task('dist-copy-fonts', function () {
    return gulp.src('./src/fonts/**/*', { encoding: false })
    .pipe(gulp.dest('./es-dist/fonts'));
});

gulp.task('dist-js', gulp.parallel(
    function bundleRequireJs() {
        return gulp.src('./src/bower_components/requirejs/*.js')
            .pipe(concat('requirejs.min.js'))
            .pipe(terser())
            .pipe(gulp.dest('./es-dist/js/'));
    },
    function copyAceModules() {
        // Ace modules are already minified and must remain separate assets.
        return gulp.src([
            './src/bower_components/ace-builds/src-min-noconflict/ace.js',
            './src/bower_components/ace-builds/src-min-noconflict/mode-javascript.js',
            './src/bower_components/ace-builds/src-min-noconflict/theme-monokai.js',
            './src/bower_components/ace-builds/src-min-noconflict/mode-json.js',
            './src/bower_components/ace-builds/src-min-noconflict/worker-javascript.js',
            './src/bower_components/ace-builds/src-min-noconflict/worker-json.js'
        ]).pipe(gulp.dest('./es-dist/js/ace'));
    },
    function bundleApp() {
        return rjs(rjsOpts)
            .pipe(wrap({ src: './config/ace_workaround.txt' }))
            .pipe(terser())
            .pipe(gulp.dest('./es-dist/js/'));
    }
));



/**
 * Creates JS version of HTML tpl files used
 * by ES UI
 **/

function templateForModule (moduleSource, moduleDest, moduleName) {
    return gulp.src(moduleSource)
        .pipe(cache('html'))
        .pipe(htmlmin(htmlMinOpts))
        .pipe(ngHtml2Js({
            moduleName: moduleName,
            prefix: ''
        }))
        .pipe(concat('templates.js'))
        .pipe(wrap('define([\'angular\'], function (angular) {\'use strict\'; <%= contents %> });'))
        .pipe(gulp.dest(moduleDest));
}

gulp.task('html', gulp.parallel(
    function htmlBase() {
        return templateForModule('./src/views/*.tpl.html', './src/js/templates', 'es-ui.templates');
    },
    function htmlProjections() {
        return templateForModule('./src/js/modules/projections/views/*.tpl.html', './src/js/modules/projections/templates', 'es-ui.projections.templates');
    },
    function htmlSecurity() {
        return templateForModule('./src/js/modules/security/views/*.tpl.html', './src/js/modules/security/templates', 'es-ui.security.templates');
    },
    function htmlDashboard() {
        return templateForModule('./src/js/modules/dashboard/views/*.tpl.html', './src/js/modules/dashboard/templates', 'es-ui.dashboard.templates');
    },
    function htmlClusterStatus() {
        return templateForModule('./src/js/modules/clusterstatus/views/*.tpl.html', './src/js/modules/clusterstatus/templates', 'es-ui.clusterstatus.templates');
    },
    function htmlStreams() {
        return templateForModule('./src/js/modules/streams/views/*.tpl.html', './src/js/modules/streams/templates', 'es-ui.streams.templates');
    },
    function htmlUsers() {
        return templateForModule('./src/js/modules/users/views/*.tpl.html', './src/js/modules/users/templates', 'es-ui.users.templates');
    },
    function htmlAdmin() {
        return templateForModule('./src/js/modules/admin/views/*.tpl.html', './src/js/modules/admin/templates', 'es-ui.admin.templates');
    },
    function htmlCompeting() {
        return templateForModule('./src/js/modules/competing/views/*.tpl.html', './src/js/modules/competing/templates', 'es-ui.competing.templates');
    }
));

/**
 * Executes ESLint verification against code
 **/
gulp.task('lint', async function lint() {
    const eslint = new ESLint();
    const results = await eslint.lintFiles(paths.all);
    const formatter = await eslint.loadFormatter('stylish');
    const output = formatter.format(results);
    if (output) process.stdout.write(output);
    if (results.some(result => result.errorCount > 0)) {
        throw new Error('ESLint reported errors');
    }
});

/**
 * Dev task, executes watches for templates, js files (lint)
 * unit tests, and web browser to test "normally"
 **/
gulp.task('dev', function (done) {

    // whenever templates changes, re-run templates
    gulp.watch(paths.app.templatesSource, gulp.series('html'));
    // whenever code changes, re-run ESLint
    gulp.watch(paths.all, gulp.series('lint'));
    done();
});

gulp.task('watch-lint', function (done) {
    gulp.watch(paths.all, gulp.series('lint'));
    done();
});




gulp.task('connect', startDevServer('src', 8000));
gulp.task('connectDist', startDevServer('es-dist', 8001));

// Gulp 5 must wait for the generated templates and assets before producing index.html.
gulp.task('dist', gulp.series(
    gulp.parallel('html', 'compile-sass'),
    gulp.parallel('dist-min-css', 'dist-copy-images', 'dist-js', 'dist-copy-fonts'),
    function distIndex() {
        return gulp.src('./src/index.html')
            .pipe(htmlreplace({
                css: paths.dist.css,
                js: {
                    src: [paths.dist.js],
                    tpl: '<script data-main="%s" src="%s"></script>'
                }
            }))
            .pipe(htmlmin(htmlMinOpts))
            .pipe(gulp.dest('./es-dist/'));
    }
));

gulp.task('default', gulp.series('dev'));
