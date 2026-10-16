/**
 * Explicit nested route bridge for Vercel's file-based function router.
 * Some Vercel routing configurations do not send multi-segment paths through
 * api/[...path].js, so the realtime endpoints get a dedicated nested catch-all.
 */
export { default } from '../[...path].js';
