/* eslint-env node */
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/consistent-type-exports': 'error',

    // Enforced via TS
    '@typescript-eslint/no-unused-vars': 'off',

    // `any` has legitimate use cases in this lib
    '@typescript-eslint/no-explicit-any': 'off',
  },
  env: {
    browser: true,
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
    project: './tsconfig.json',
  },

  root: true,
}
