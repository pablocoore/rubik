import { defineConfig } from 'vite';

// Configure base path for GitHub Pages (project pages)
// If building in GitHub Actions, infer repo name from GITHUB_REPOSITORY
const repo = process.env.GITHUB_REPOSITORY?.split('/')?.pop?.() ?? '';
const isGhPages = Boolean(process.env.GITHUB_REPOSITORY);

export default defineConfig({
  base: isGhPages && repo ? `/${repo}/` : '/',
  server: { open: true },
  build: { target: 'es2022' }
});
