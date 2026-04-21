const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const isValidCoordinate = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

const estimateEtaMinutes = (from, to, averageSpeedKmph = 24) => {
  if (!from || !to) return null;

  const fromLat = Number(from.latitude);
  const fromLng = Number(from.longitude);
  const toLat = Number(to.latitude);
  const toLng = Number(to.longitude);
  if (!isValidCoordinate(fromLat, fromLng) || !isValidCoordinate(toLat, toLng)) {
    return null;
  }

  const speedKmph = Number(averageSpeedKmph);
  if (!Number.isFinite(speedKmph) || speedKmph <= 0) return null;

  const km = haversineDistanceKm(fromLat, fromLng, toLat, toLng);
  if (!Number.isFinite(km)) return null;

  const eta = Math.round((km / speedKmph) * 60);
  // Keep outlier ETAs from bad GPS jumps from polluting UI.
  return Math.max(1, Math.min(eta, 180));
};

module.exports = { estimateEtaMinutes };
