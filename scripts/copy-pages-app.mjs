/**
 * copy-pages-app.mjs
 *
 * Copies the Next.js static export output (from ./out/) into
 * ./gh-pages/app/ so it is included in the GitHub Pages deployment.
 *
 * Run after `npm run pages:build`.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const src = path.join(root, 'out');
const dest = path.join(root, 'gh-pages', 'app');

if (!fs.existsSync(src)) {
  console.error('No ./out directory found. Run `npm run pages:build` first.');
  process.exit(1);
}

fs.mkdirSync(dest, { recursive: true });

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(src, dest);
console.log(`Copied static export from ./out to ./gh-pages/app`);
