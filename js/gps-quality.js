/** GPS quality and freshness helpers; accuracy is the browser-reported radius in metres. */
export function classifyGpsAccuracy(accuracy) {
  if (!Number.isFinite(accuracy) || accuracy < 0) return 'unknown';
  if (accuracy <= 20) return 'good';
  if (accuracy <= 100) return 'fair';
  return 'poor';
}

export function isGpsFixFresh(timestamp, now = Date.now(), maxAgeMs = 30000) {
  if (!Number.isFinite(timestamp) || !Number.isFinite(now) || !Number.isFinite(maxAgeMs) || maxAgeMs < 0) return false;
  const age = now - timestamp;
  return age >= -60000 && age <= maxAgeMs;
}

export function gpsFixAgeMs(timestamp, now = Date.now()) {
  if (!Number.isFinite(timestamp) || !Number.isFinite(now)) return null;
  return Math.max(0, now - timestamp);
}
