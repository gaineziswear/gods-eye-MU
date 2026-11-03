import { createStandaloneApplication } from './standalone/application.js';
import { describeError } from './standalone/errors.js';

const application = createStandaloneApplication({
  googleApiKey: import.meta.env.GOOGLE_MAPS_API_KEY,
  cesiumToken: import.meta.env.CESIUM_ION_TOKEN,
  allowQaRegistration: import.meta.env.DEV,
});

application.start().catch((error) => {
  console.error("God's Eye View initialization failed:", error);
  const loadingScreen = document.getElementById('loading-screen');
  const loaderStatus = loadingScreen?.querySelector('.loader-status');
  if (loaderStatus) {
    loaderStatus.textContent = `3D globe unavailable: ${describeError(error)}`;
    loaderStatus.style.color = '#ff9e8b';
    loaderStatus.setAttribute('role', 'alert');
  }

  // A failed WebGL context must not strand users behind an error-only loader.
  // Keep the actual 3D globe error visible and offer working, clearly labelled
  // Atlas/simulator routes that do not depend on Cesium/WebGL.
  if (
    loadingScreen &&
    !loadingScreen.querySelector('[data-startup-fallback]')
  ) {
    const fallback = document.createElement('section');
    fallback.dataset.startupFallback = 'true';
    fallback.setAttribute('aria-label', 'Alternative project tools');
    fallback.style.cssText =
      'max-width:520px;margin:18px auto 0;padding:16px;border:1px solid #3b5661;' +
      'border-radius:8px;background:rgba(8,17,22,.94);color:#e6edf0;text-align:left';
    const note = document.createElement('p');
    note.textContent =
      'The 3D view could not start in this browser session. You can still open the Atlas health panel or run the independent 2D scenario simulator.';
    note.style.cssText =
      'font-size:13px;line-height:1.5;color:#b8c8ce;margin:0 0 12px';
    const links = document.createElement('div');
    links.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
    for (const [label, href] of [
      ['Open Tsiaro Atlas', '/atlas.html'],
      ['Open Atlas Lab simulator'...[truncated]