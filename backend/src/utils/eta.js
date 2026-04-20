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

const estimateEtaMinutes = (from, to, averageSpeedKmph = 24) => {
  if (!from || !to || !averageSpeedKmph) return null;
  const km = haversineDistanceKm(from.latitude, from.longitude, to.latitude, to.longitude);
  return Math.max(1, Math.round((km / averageSpeedKmph) * 60));
};

module.exports = { estimateEtaMinutes };
