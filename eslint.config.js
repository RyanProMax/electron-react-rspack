// ESLint Flat Config for ESLint 9+
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules',
      '*.html',
      '*.json',
      '*.md',
      '.DS_Store',
      'release/app/dist',
      'release/build',
      '**/dist',
      'LICENSE',
    ],
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs['eslint-recommended'].overrides[0].rules,
      ...tseslint.configs.recommended.rules,
      'no-console': 'off',
      'semi': 2,
      'quotes': ['error', 'single'],
      '@typescript-eslint/no-explicit-any': 'off',
      // 'global-require': 'off',
      // 'import/no-dynamic-require': 'off',
    },
  },
]; 
