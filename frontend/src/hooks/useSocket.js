import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const socketClient = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
  autoConnect: true,
});

export default function useSocket() {
  const [busLocations, setBusLocations] = useState({});
  const [delayMessages, setDelayMessages] = useState([]);

  const socket = useMemo(() => socketClient, []);

  useEffect(() => {
    const onBusLocation = (payload = {}) => {
      const busId = payload.bus || payload.busId;
      if (!busId) return;
      setBusLocations((prev) => ({ ...prev, [busId]: { ...payload, bus: busId } }));
    };

    const onDelay = (payload) => {
      setDelayMessages((prev) => [payload, ...prev].slice(0, 10));
    };

    socket.on("busLocationUpdated", onBusLocation);
    socket.on("locationUpdate", onBusLocation);
    socket.on("delayNotification", onDelay);
    return () => {
      socket.off("busLocationUpdated", onBusLocation);
      socket.off("locationUpdate", onBusLocation);
      socket.off("delayNotification", onDelay);
    };
  }, [socket]);

  return { socket, busLocations, delayMessages };
}
