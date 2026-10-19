#!/usr/bin/env node
/**
 * Build-time contract gate for the deployed God’s Eye + Tsiaro Atlas bundle.
 * This validates shipped artifacts and route entrypoints, not live feed health.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readRequired(relativePath) {
  const absolutePath = path.join(root, relativePath);
  assert.ok(existsSync(absolutePath), 'Missing required artifact: ' + relativePath);
  const content = readFileSync(absolutePath, 'utf8');
  assert.ok(content.trim().length > 0, 'Required artifact is empty: ' + relativePath);
  return content;
}

function requirePattern(content, pattern, label, file) {
  assert.match(content, pattern, 'Missing ' + label + ' in ' + file);
}

const pages = [
  {
    file: 'dist/index.html',
    checks: [
      [/ <title>God.s Eye View<\/title>/i, 'application title'],
      [/\/assets\/[^"']+\.js/i, 'compiled Vite JavaScript entry'],
    ],
  },
  {
    file: 'dist/atlas.html',
    checks: [
      [/Live service diagnostics/i, 'service diagnostics panel'],
      [/Test public endpoints/i, 'public endpoint test control'],
      [/\/api\/health/i, 'health endpoint probe'],
      [/\/api\/capabilities/i, 'capability endpoint probe'],
      [/NOT CONNECTED/i, 'disconnected-feed state'],
      [/no Safe City access claimed/i, 'Safe City access disclaimer'],
    ],
  },
  {
    file: 'dist/simulator.html',
    checks: [
      [/synthetic/i, 'synthetic-data label'],
      [/scenario/i, 'scenario interface'],
      [/No feeds are contacted by the simulator/i, 'offline simulator disclaimer'],
    ],
  },
];

for (const page of pages) {
  const content = readRequired(page.file);
  for (const [pattern, label] of page.checks) {
    requirePattern(content, pattern, label, page.file);
  }
}

const apiFiles = [
  {
    file: 'api/[...path].js',
    checks: [
      [/pathname === '\/api\/health'/, 'health route'],
      [/providerMiddlewareRegistered/, 'provider registration diagnostic'],
      [/unknown_api_route/, 'explicit unknown-route response'],
    ],
  },
  {
    file: 'api/capabilities.js',
    checks: [
      [/secretValuesReturned:\s*false/, 'secret-safe capability response'],
      [/restrictedGovernmentFeeds/, 'restricted-feed boundary'],
      [/not-integrated/, 'unintegrated official-feed status'],
    ],
  },
  {
    file: 'api/celestrak/[...path].js',
    checks: [[/export\s+\{\s*default\s*\}\s+from\s+['"]\.\.\/\[\.\.\.path\]\.js['"]/, 'nested CelesTrak route bridge']],
  },
  {
    file: 'api/realtime/[...path].js',
    checks: [[/export\s+\{\s*default\s*\}\s+from\s+['"]\.\.\/\[\.\.\.path\]\.js['"]/, 'nested Realtime route bridge']],
  },
];

for (const item of apiFiles) {
  const content = readRequired(item.file);
  for (const [pattern, label] of item.checks) {
    requirePattern(content, pattern, label, item.file);
  }
}

console.log(
  'PASS: built God’s Eye app, Atlas diagnostics, synthetic simulator, and Vercel API route contracts are present.',
);
console.log(
  'NOTE: this is a packaging gate only; live feeds, browser WebGL, microphone access, and SSO-protected runtime still require separate verification.',
);
