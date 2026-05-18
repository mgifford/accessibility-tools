export function canonicalizeUrl(input) {
  try {
    const url = new URL(input);
    url.hash = '';
    const result = url.toString();
    return result.endsWith('/') ? result.slice(0, -1) : result;
  } catch {
    return null;
  }
}

export function getHostname(input) {
  try {
    return new URL(input).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isSameHostname(baseUrl, candidateUrl) {
  const base = getHostname(baseUrl);
  const candidate = getHostname(candidateUrl);
  return !!base && !!candidate && base === candidate;
}

export function isHttpUrl(input) {
  try {
    const protocol = new URL(input).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export function isPrivateOrInternalHostname(hostname = '') {
  const host = String(hostname).toLowerCase();
  if (!host) return true;

  if (
    host === 'localhost'
    || host === '127.0.0.1'
    || host === '0.0.0.0'
    || host.endsWith('.local')
    || host.endsWith('.internal')
  ) {
    return true;
  }

  const ipv4PrivateRanges = [/^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[0-1])\./, /^192\.168\./];
  return ipv4PrivateRanges.some(re => re.test(host));
}
