// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import nodePlugin from 'eslint-plugin-n';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore build output and dependencies
  {
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.js'],
  },

  // Only lint TypeScript files
  {
    files: ['**/*.ts'],
  },

  // TypeScript recommended rules (moderate strictness)
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // Configure TypeScript parser for .ts files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Node.js best practices for TypeScript files
  {
    files: ['**/*.ts'],
    plugins: {
      n: nodePlugin,
    },
    rules: {
      // Disable rules that conflict with TypeScript
      'n/no-missing-import': 'off', // TypeScript handles this better
      'n/no-unpublished-import': 'off', // Too restrictive for backend apps

      // Node.js specific rules
      'n/no-deprecated-api': 'error',
    },
  },

  // Custom rules for code quality (TypeScript files only)
  {
    files: ['**/*.ts'],
    rules: {
      // Console usage - warn but allow in backend
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      // Modern JavaScript/TypeScript
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'warn',
      'prefer-arrow-callback': 'warn',

      // TypeScript specific
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },

  // Prettier config must be LAST to disable conflicting formatting rules
  prettierConfig
);
