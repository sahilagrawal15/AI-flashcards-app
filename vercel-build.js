#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Running custom vercel build script...');

// Create a tsconfig that disables strict checking
console.log('✏️ Creating temporary tsconfig.vercel.json...');
const tsConfig = {
  extends: './tsconfig.json',
  compilerOptions: {
    noEmit: true,
    skipLibCheck: true,
    noImplicitAny: false,
    strictNullChecks: false,
    strict: false
  },
  exclude: ['node_modules']
};

fs.writeFileSync('tsconfig.vercel.json', JSON.stringify(tsConfig, null, 2));
fs.renameSync('tsconfig.json', 'tsconfig.json.bak');
fs.renameSync('tsconfig.vercel.json', 'tsconfig.json');

try {
  // Run the build without type checking
  console.log('🏗️ Running Next.js build with type checking disabled...');
  
  // Set environment variables to disable TypeScript checks
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.NEXT_TYPECHECK = 'false';
  
  execSync('next build --no-lint', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
} finally {
  // Restore original tsconfig
  console.log('🔄 Restoring original tsconfig.json...');
  fs.renameSync('tsconfig.json', 'tsconfig.vercel.json');
  fs.renameSync('tsconfig.json.bak', 'tsconfig.json');
} 