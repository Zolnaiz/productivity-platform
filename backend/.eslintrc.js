module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/**', 'node_modules/**'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    'prettier/prettier': ['error', {
      'endOfLine': 'auto',
    }],
    'no-console': ['warn', { 
      allow: ['warn', 'error', 'info'] 
    }],
    'curly': ['error', 'all'],
    'eqeqeq': ['error', 'always'],
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'object-shorthand': ['error', 'always'],
    'quotes': ['error', 'single', { 
      'avoidEscape': true,
      'allowTemplateLiterals': true 
    }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'indent': ['error', 2, { 
      'SwitchCase': 1 
    }],
    'max-len': ['error', { 
      'code': 100,
      'ignoreComments': true,
      'ignoreUrls': true,
      'ignoreTemplateLiterals': true,
      'ignoreStrings': true 
    }],
    'array-bracket-spacing': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'space-before-blocks': ['error', 'always'],
    'space-before-function-paren': ['error', {
      'anonymous': 'always',
      'named': 'never',
      'asyncArrow': 'always'
    }],
    'keyword-spacing': ['error', { 
      'before': true, 
      'after': true 
    }],
    'space-infix-ops': 'error',
    'eol-last': ['error', 'always'],
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', { 
      'max': 1, 
      'maxEOF': 0 
    }],
    'padded-blocks': ['error', 'never'],
    'brace-style': ['error', '1tbs', { 
      'allowSingleLine': true 
    }],
    'camelcase': ['error', { 
      'properties': 'never' 
    }],
    'new-cap': ['error', { 
      'newIsCap': true,
      'capIsNew': false 
    }],
    'no-nested-ternary': 'error',
    'no-unneeded-ternary': 'error',
    'operator-assignment': ['error', 'always'],
    'prefer-template': 'error',
    'template-curly-spacing': ['error', 'never'],
    'no-useless-concat': 'error',
    'no-useless-escape': 'error',
    'no-useless-return': 'error',
    'no-else-return': ['error', { 
      'allowElseIf': false 
    }],
    'no-implicit-coercion': 'error',
    'no-lonely-if': 'error',
    'no-unreachable': 'error',
    'require-await': 'error',
    'no-return-await': 'error',
    'prefer-promise-reject-errors': 'error',
    'no-throw-literal': 'error',
    'no-catch-shadow': 'error',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'no-undef': 'off',
    '@typescript-eslint/no-undef': 'off',
    'import/order': 'off',
  },
  overrides: [
    {
      files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
      rules: {
        'max-len': 'off',
        'no-console': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
    {
      files: ['src/**/*.dto.ts', 'src/**/*.entity.ts'],
      rules: {
        'max-classes-per-file': 'off',
      },
    },
  ],
};