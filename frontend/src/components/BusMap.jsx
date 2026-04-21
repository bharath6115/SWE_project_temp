import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import { useLocationContext } from "../context/LocationContext";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const movingBusIcon = L.divIcon({
  className: "bus-marker-moving",
  html: '<span class="bus-marker-moving__dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});
const defaultBusIcon = new L.Icon.Default();

function RecenterOnLocation({ center }) {
  const map = useMap();
  useEffect(() => {
    const isValidCenter =
      Array.isArray(center) &&
      center.length === 2 &&
      Number.isFinite(Number(center[0])) &&
      Number.isFinite(Number(center[1]));
    if (!isValidCenter) return;
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export default function BusMap({ buses }) {
  const { location } = useLocationContext();
  const fallbackCenter = [12.9716, 77.5946];
  const [center, setCenter] = useState(fallbackCenter);

  useEffect(() => {
    if (!location) return;
    setCenter([location.latitude, location.longitude]);
  }, [location]);

  const markerPoints = useMemo(
    () =>
      buses
        .filter((bus) => {
          const lat = Number(bus.currentLocation?.latitude);
          const lng = Number(bus.currentLocation?.longitude);
          return Number.isFinite(lat) && Number.isFinite(lng);
        })
        .map((bus) => ({
          ...bus,
          position: [Number(bus.currentLocation.latitude), Number(bus.currentLocation.longitude)],
        })),
    [buses]
  );

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      className="h-[75vh] w-full rounded-xl shadow"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterOnLocation center={center} />
      {markerPoints.map((bus) => (
        <Marker
          key={bus._id}
          position={bus.position}
          icon={bus.isMoving ? movingBusIcon : defaultBusIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{bus.number}</p>
              <p>Status: {bus.status}</p>
              <p>ETA: {bus.etaMinutes || "-"} min</p>
              {bus.isMoving ? (
                <button
                  type="button"
                  className="mt-2 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                >
                  Bus moving
                </button>
              ) : null}
            </div>
          </Popup>
        </Marker>
      ))}
      {buses.map((bus) => {
        if (!bus.route?.stops?.length) return null;
        const path = bus.route.stops
          .filter((stop) => {
            const lat = Number(stop?.latitude);
            const lng = Number(stop?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
          })
          .map((stop) => [Number(stop.latitude), Number(stop.longitude)]);
        if (path.length < 2) return null;
        return (
          <Polyline
            key={`route-${bus._id}`}
            positions={path}
            color="#2563eb"
            opacity={0.65}
            weight={3}
          />
        );
      })}
    </MapContainer>
  );
}
