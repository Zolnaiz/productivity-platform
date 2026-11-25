import parser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  {
    files: [
      'src/main.ts',
      'src/app.module.ts',
      'src/app.controller.ts',
      'src/app.service.ts',
      'src/operations/**/*.ts',
      'src/shared/database/**/*.ts',
      'src/shared/filters/**/*.ts',
      'src/shared/interceptors/**/*.ts',
    ],
    languageOptions: {
      parser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // `const { secret: _secret, ...rest } = value` is how this code leaves a
      // field out of an object: the named ones are dropped on purpose, so a
      // sibling of a rest element is not an unused variable.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      // Correctness rules carried over from the old .eslintrc.js, which
      // ESLint 9 never read. `== null` stays allowed: it means "null or
      // undefined", as TypeORM's IsNull() does. `curly` was not carried over:
      // a one-line `if (...) throw ...` without braces is this code's style.
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
];
