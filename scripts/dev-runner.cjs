const { execSync } = require('child_process');

try {
  execSync('pnpm tsc-alias', { stdio: 'inherit' });
  execSync('node ./public/dist/index.js NODE=production', { stdio: 'inherit' });
} catch (err) {
  process.exit(1);
}
