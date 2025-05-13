const js = require('@eslint/js');
const react = require('eslint-plugin-react');
// const globals = require('globals');

module.exports = [
  {
    files: ['**/*.js', '**/*.jsx'],
    ignores: ['node_modules/**', 'build/**', 'dist/**'],
    ...js.configs.recommended,
    plugins: {
      react,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        React: 'writable',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...react.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    },
  },
];
