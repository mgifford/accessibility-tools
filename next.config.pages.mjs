/**
 * next.config.pages.mjs
 *
 * Next.js configuration for the GitHub Pages static export.
 * Use this config instead of the default next.config.mjs when building
 * the browser-only SPA that will be deployed to gh-pages/app/.
 *
 * Build command:
 *   NEXT_CONFIG=next.config.pages.mjs npm run pages:build
 *
 * Or via the dedicated script:
 *   npm run pages:build
 */

import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a fully static site that can be served from any CDN / GitHub Pages
  output: 'export',

  // The SPA will be served at /app/ under the GitHub Pages root
  // Set this to match your repository name:  e.g. '/accessibility-tools/app'
  basePath: process.env.PAGES_BASE_PATH || '',

  // GitHub Pages serves files from a repo sub-directory;
  // asset prefix keeps JS/CSS loading correctly.
  assetPrefix: process.env.PAGES_BASE_PATH || '',

  reactStrictMode: false,
  images: {
    unoptimized: true // next/image requires a server for optimization
  },
  compiler: {
    emotion: true
  },
  poweredByHeader: false,
  transpilePackages: ['@mui/x-charts'],
  sassOptions: {
    includePaths: [
      path.join(__dirname, 'src'),
      path.normalize(__dirname + '/src/constants')
    ]
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack']
    });
    return config;
  }
};

export default nextConfig;
