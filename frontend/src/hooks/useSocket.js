import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import client from "../api/client";
import { useToast } from "../context/ToastContext";
import { retryWithBackoff } from "../utils/retry";

export default function useSocket() {
  const [busLocations, setBusLocations] = useState({});
  const [delayMessages, setDelayMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const { error: showError, warning: showWarning, success: showSuccess } = useToast();

  const socket = useMemo(() => {
    return io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      withCredentials: true,
    });
  }, []);

  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const syncLatestLocations = async () => {
      try {
        await retryWithBackoff(
          () => client.get("/buses/locations/latest"),
          {
            maxRetries: 3,
            initialDelayMs: 1000,
            onRetry: () => setIsRetrying(true),
          }
        ).then(({ data }) => {
          setIsRetrying(false);
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
        });
      } catch (err) {
        setIsRetrying(false);
        showError("Failed to fetch bus locations after multiple attempts");
      }
    };

    const syncRecentDelays = async () => {
      try {
        await retryWithBackoff(() => client.get("/buses/delays/recent"), {
          maxRetries: 2,
          initialDelayMs: 800,
        }).then(({ data }) => {
          setDelayMessages(data.slice(0, 10));
        });
      } catch (err) {
        // Silently fail for delays - not critical
      }
    };

    const onConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      showSuccess("Connected to live updates");
      syncLatestLocations();
      syncRecentDelays();
    };

    const onDisconnect = () => {
      setIsConnected(false);
      showWarning("Connection lost. Attempting to reconnect...");
    };

    const onConnectError = (error) => {
      setConnectionError(error.message);
      showError(`Connection failed: ${error.message}`);
      console.error("[Socket] Connection error:", error.message);
    };

    const onError = (error) => {
      const message = error.message || error;
      showError(message);
      console.error("[Socket] Socket error:", message);
    };

    const onBusLocation = (payload = {}) => {
      if (!payload.busId) return;

      setBusLocations((prev) => ({
        ...prev,
        [payload.busId]: {
          ...payload,
          bus: payload.busId,
        },
      }));
    };

    const onBusStatus = (payload = {}) => {
      if (!payload.busId) return;
      setBusLocations((prev) => {
        const current = prev[payload.busId] || {};
        const latitude = Number(payload.currentLocation?.latitude ?? current.latitude);
        const longitude = Number(payload.currentLocation?.longitude ?? current.longitude);
        return {
          ...prev,
          [payload.busId]: {
            ...current,
            bus: payload.busId,
            busId: payload.busId,
            status: payload.status ?? current.status,
            latitude: Number.isFinite(latitude) ? latitude : current.latitude,
            longitude: Number.isFinite(longitude) ? longitude : current.longitude,
            updatedAt: payload.updatedAt || current.updatedAt,
          },
        };
      });
    };

    const onDelay = (payload) => {
      setDelayMessages((prev) => [payload, ...prev].slice(0, 10));
      if (payload.message) {
        showWarning(payload.message);
      }
    };

    syncLatestLocations();
    syncRecentDelays();

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("error", onError);
    socket.on("busLocationUpdated", onBusLocation);
    socket.on("busStatusUpdated", onBusStatus);
    socket.on("delayNotification", onDelay);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("error", onError);
      socket.off("busLocationUpdated", onBusLocation);
      socket.off("busStatusUpdated", onBusStatus);
      socket.off("delayNotification", onDelay);
    };
  }, [socket, showError, showWarning, showSuccess]);

  return {
    socket,
    busLocations,
    delayMessages,
    isConnected,
    connectionError,
    isRetrying,
  };
}
