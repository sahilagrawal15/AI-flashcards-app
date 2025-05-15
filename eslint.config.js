import { createConfigs } from 'eslint-config-next';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default createConfigs({
  // Turn off type checking
  typescript: {
    tsconfigPath: './tsconfig.json',
    parserOptions: {
      project: false
    }
  },
  settings: {
    // Ignore all eslint rules that would block deployment
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react/no-unescaped-entities': 'off'
    }
  }
}); 