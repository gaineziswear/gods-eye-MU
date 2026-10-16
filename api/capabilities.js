/**
 * Provider capability endpoint used by the Tsiaro health panel.
 * Returns configuration presence only; never exposes secret values.
 */
export default function handler(_req, res) {
  const has = (key) => Boolean(process.env[key]);
  const result = {
    status: 'ok',
    checkedAt: new Date().toISOString(),
    providers: {
      browserWebGL: { mode: 'client-capability', status: 'requires-browser-check' },
      imagery: { status: 'fallback-available', source: 'Esri World Imagery / OpenStreetMap', note: 'A working WebGL context is still required for the 3D Cesium scene.' },
      highResolution3D: { status: has('GOOGLE_MAPS_API_KEY') || has('CESIUM_ION_TOKEN') ? 'configured' : 'not-configured', credentials: ['GOOGLE_MAPS_API_KEY', 'CESIUM_ION_TOKEN'] },
      aircraft: { status: 'public-fallback-available', authenticated: has('OPENSKY_CLIENT_ID') && has('OPENSKY_CLIENT_SECRET'), credentials: ['OPENSKY_CLIENT_ID', 'OPENSKY_CLIENT_SECRET'] },
      satelliteOrbits: { status: 'public-source-available', source: 'CelesTrak; live API response must be tested separately' },
      satelliteImagery: { status: 'fallback-available', source: 'Esri World Imagery; high-resolution providers are optional' },
      vessels: { status: has('AISSTREAM_API_KEY') ? 'credential-present-but-worker-required' : 'not-configured', credentials: ['AISSTREAM_API_KEY'], note: 'AISStream requires a durable worker; this short-lived function does not maintain the socket.' },
      events: { status: 'public-sources-available', sources: ['USGS earthquakes', 'NASA FIRMS (key required for active fires)'], nasaFirmsConfigured: has('FIRMS_MAP_KEY') },
      weather: { status: 'public-source-available', source: 'NOAA endpoints have region-specific coverage; confirm coverage before interpreting as Mauritius local weather' },
      traffic: { status: has('TOMTOM_API_KEY') ? 'configured' : 'not-configured', credentials: ['TOMTOM_API_KEY'] },
      voice: { status: has('OPENAI_API_KEY') ? 'credential-present' : 'not-configured', credentials: ['OPENAI_API_KEY'], note: 'Microphone permission and a successful realtime session are also required.' },
      mauritiusOfficialFeeds: { status: 'not-integrated', note: 'No official Mauritius government/reservoir feed has been validated in this build.' }
    },
    privacy: {
      secretValuesReturned: false,
      restrictedGovernmentFeeds: 'not accessed; explicit authorization required',
      cctv: 'only public/authorized metadata; no claim of Safe City feed access'
    }
  };
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(result));
}
