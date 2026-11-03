export function isPublicSourceHostname(hostname) {
  const host = String(hostname || '')
    .toLowerCase()
    .replaceAll('[', '')
    .replaceAll(']', '');
  const nonPublicSuffixes = [
    'localhost',
    'local',
    'internal',
    'test',
    'invalid',
    'example',
  ];
  if (
    !host ||
    nonPublicSuffixes.some(
      (suffix) => host === suffix || host.endsWith('.' + suffix),
    )
  )
    return false;
  const ipv4Literal = /^[0-9.]+$/.test(host);
  const ipv6Literal = host.includes(':');
  const version = ipv6Literal ? 6 : ipv4Literal ? 4 : 0;
  if (ipv4Literal && !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return false;
  if (version === 4) {
    const octets = host.split('.').map(Number);
    const [a, b, c] = octets;
    if (
      octets.length !== 4 ||
      octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
    )
      return false;
    if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && (b === 0 || b === 168)) return false;
    if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
      return false;
    if (a === 203 && b === 0 && c === 113) return false;
    return true;
  }
  if (version === 6) {
    // Accept only global-unicast 2000::/3; reject special-use transition/documentation ranges.
    if (!/^[23][0-9a-f]{0,3}:/i.test(host)) return false;
    if (
      host.startsWith('2001:db8:') ||
      host.startsWith('2001:10:') ||
      host.startsWith('2001:20:') ||
      host.startsWith('2002:') ||
      host.startsWith('2001:0:')
    )
      return false;
    return true;
  }
  return version === 0;
}

export function parseFreeModelAllowlist(value) {
  const seen = new Set();
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) =>
      /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-...[truncated]