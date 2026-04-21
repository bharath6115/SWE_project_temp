import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import client from "../api/client";

const socketClient = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
  autoConnect: true,
});

export default function useSocket() {
  const [busLocations, setBusLocations] = useState({});
  const [delayMessages, setDelayMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(socketClient.connected);

  const socket = useMemo(() => socketClient, []);

  useEffect(() => {
    const syncLatestLocations = async () => {
      try {
        const { data } = await client.get("/buses/locations/latest");
        setBusLocations((prev) => {
          const next = { ...prev };
          data.forEach((entry) => {
            const busId = entry.bus?._id || entry.bus;
            const latitude = entry.latitude ?? entry.point?.coordinates?.[1];
            const longitude = entry.longitude ?? entry.point?.coordinates?.[0];
            if (!busId || latitude == null || longitude == null) return;
            next[busId] = {
              ...entry,
              bus: busId,
              busId,
              latitude: Number(latitude),
              longitude: Number(longitude),
              updatedAt: entry.updatedAt || entry.createdAt,
            };
          });
          return next;
        });
      } catch {
        // Use socket stream as primary source when sync fallback fails.
      }
    };

    const onBusLocation = (payload = {}) => {
      const busId = payload.bus || payload.busId;
      if (!busId) return;
      setBusLocations((prev) => ({ ...prev, [busId]: { ...payload, bus: busId } }));
    };

    const onDelay = (payload) => {
      setDelayMessages((prev) => [payload, ...prev].slice(0, 10));
    };

    const syncRecentDelays = async () => {
      try {
        const { data } = await client.get("/buses/delays/recent");
        setDelayMessages(data.slice(0, 10));
      } catch {
        // Keep live delay stream even if history fetch fails.
      }
    };

    const onConnect = () => {
      setIsConnected(true);
      syncLatestLocations();
      syncRecentDelays();
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    syncLatestLocations();
    syncRecentDelays();
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("busLocationUpdated", onBusLocation);
    socket.on("locationUpdate", onBusLocation);
    socket.on("delayNotification", onDelay);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("busLocationUpdated", onBusLocation);
      socket.off("locationUpdate", onBusLocation);
      socket.off("delayNotification", onDelay);
    };
  }, [socket]);

  return { socket, busLocations, delayMessages, isConnected };
}
