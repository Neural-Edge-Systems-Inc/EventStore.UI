import globals from 'globals';

// Migrated from the historical .jshintrc. Preserve the developer lint
// workflow while using maintained packages instead of vulnerable JSHint.
export default [{
    files: ['src/js/**/*.js'],
    ignores: ['src/js/templates/templates.js', 'src/js/modules/**/templates/templates.js'],
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
        globals: {
            ...globals.browser,
            ...globals.node,
            angular: 'readonly',
            define: 'readonly',
            ace: 'readonly',
            require: 'readonly',
            alert: 'readonly',
            confirm: 'readonly',
            self: 'readonly'
        }
    },
    rules: {
        'eqeqeq': 'warn',
        'curly': 'warn',
        'no-undef': 'warn',
        'no-unused-vars': ['warn', { args: 'none', vars: 'all' }],
        'quotes': ['warn', 'single', { avoidEscape: true }],
        'no-bitwise': 'warn',
        'no-caller': 'warn'
    }
}];
