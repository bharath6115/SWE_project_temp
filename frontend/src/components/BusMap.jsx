import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import { useLocationContext } from "../context/LocationContext";
import { getRouteColor } from "../utils/colors";
import { useInterpolatedLocation } from "../hooks/useInterpolatedLocation";

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
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function InterpolatedMarker({ bus, isSelected }) {
  const pos = useInterpolatedLocation(
    Number(bus.currentLocation?.latitude),
    Number(bus.currentLocation?.longitude)
  );

  return (
    <Marker position={pos} icon={movingBusIcon}>
      <Popup className="bus-popup">
        <div className="p-1">
          <h4 className="font-bold text-slate-900">Bus {bus.number}</h4>
          <p className="text-xs text-slate-500">{bus.route?.name}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${bus.status === 'running' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span className="text-xs font-semibold capitalize">{bus.status}</span>
          </div>
          <p className="mt-1 text-xs font-medium text-indigo-600">ETA: {bus.etaMinutes || "--"} min</p>
        </div>
      </Popup>
    </Marker>
  );
}

function RecenterOnLocation({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export default function BusMap({ buses, selectedBusId, onBusSelect }) {
  const { location } = useLocationContext();
  const fallbackCenter = [12.9716, 77.5946];
  const [mapCenter, setMapCenter] = useState(fallbackCenter);

  useEffect(() => {
    if (!location) return;
    // Only recenter if no bus is selected (follow user)
    if (!selectedBusId) {
      setMapCenter([location.latitude, location.longitude]);
    }
  }, [location, selectedBusId]);

  useEffect(() => {
    if (selectedBusId) {
      const selectedBus = buses.find(b => b._id === selectedBusId);
      if (selectedBus?.currentLocation) {
        setMapCenter([selectedBus.currentLocation.latitude, selectedBus.currentLocation.longitude]);
      }
    }
  }, [selectedBusId, buses]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={15}
      zoomControl={false}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterOnLocation center={mapCenter} />
      
      {/* Route Polylines */}
      {buses.map((bus) => {
        if (!bus.route?.stops?.length) return null;
        const isSelected = bus._id === selectedBusId;
        const color = getRouteColor(bus.route._id);
        const path = bus.route.stops.map(s => [s.latitude, s.longitude]);
        
        return (
          <Polyline
            key={`route-${bus._id}`}
            positions={path}
            color={color}
            opacity={isSelected ? 0.8 : 0.3}
            weight={isSelected ? 5 : 3}
            dashArray={isSelected ? null : "5, 10"}
          />
        );
      })}

      {/* Bus Markers */}
      {buses.map((bus) => (
        <InterpolatedMarker 
          key={bus._id} 
          bus={bus} 
          isSelected={bus._id === selectedBusId} 
        />
      ))}
    </MapContainer>
  );
}
