/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: ['./configs/.eslintrc.js'],
    ignorePatterns: ['**/{node_modules,lib}'],
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: 'tsconfig.json'
    }
};