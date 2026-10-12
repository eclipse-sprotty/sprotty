/** @type {import('eslint').Linter.Config} */
module.exports = {
    env: {
        browser: true,
        node: true
    },
    parser: '@typescript-eslint/parser',
    ignorePatterns: [
        '**/{node_modules,lib}',
        '**/sprotty-local-template/**/*',
        '**/lib/**/src/**/*'
    ],
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json'
    },
    plugins: [
        '@typescript-eslint'
    ],
    // Every rule is an error so that `npm run lint` fails on any finding; the lint script also passes
    // --max-warnings 0, so a rule added at `warn` level gates as well. The license header is checked
    // by test/license-header.spec.ts, not here.
    rules: {
        '@typescript-eslint/no-dynamic-delete': 'error',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-shadow': ['error', { 'hoist': 'all' }],
        'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
        'comma-dangle': ['error', { 'arrays': 'only-multiline', 'objects': 'only-multiline' }],
        'constructor-super': 'error',
        'eol-last': 'error',
        'eqeqeq': ['error', 'smart'],
        'guard-for-in': 'error',
        'keyword-spacing': ['error', { 'before': true }],
        'max-len': ['error', { 'code': 180 }],
        'no-caller': 'error',
        'no-debugger': 'error',
        'no-eval': 'error',
        'no-fallthrough': 'error',
        'no-invalid-this': 'error',
        'no-new-wrappers': 'error',
        'no-prototype-builtins': 'error',
        'no-restricted-imports': ['error', '..', '../index', '../..', '../../index'],
        'no-return-await': 'error',
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-trailing-spaces': 'error',
        'no-unsafe-finally': 'error',
        'no-var': 'error',
        'prefer-const': ['error', { 'destructuring': 'all' }],
        'prefer-object-spread': 'error',
        'radix': 'error',
        'semi': ['error', 'always'],
        'space-infix-ops': 'error',
        'spaced-comment': ['error', 'always', { 'markers': ['/'], 'exceptions': ['*'] }],
        'use-isnan': 'error'
    }
};
