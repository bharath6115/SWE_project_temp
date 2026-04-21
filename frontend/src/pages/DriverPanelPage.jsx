import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";

const LOCATION_THROTTLE_MS = Number(import.meta.env.VITE_LOCATION_THROTTLE_MS || 3000);
const LOCATION_SEND_INTERVAL_MS = Math.max(LOCATION_THROTTLE_MS, 3000) + 250;

export default function DriverPanelPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [bus, setBus] = useState(null);
  const [status, setStatus] = useState("running");
  const [tripActive, setTripActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [geoStatus, setGeoStatus] = useState("idle");
  const [geoError, setGeoError] = useState("");
  const [lastLocationAt, setLastLocationAt] = useState(null);

  useEffect(() => {
    const loadAssignedBus = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await client.get("/buses");
        const assigned = data.find((entry) => entry.driver?._id === user?.id);
        setBus(assigned || null);
        setTripActive(Boolean(assigned?.isTripActive));
        setStatus(assigned?.status || "running");
      } catch (loadError) {
        setError(
          loadError.response?.data?.message || "Failed to load assigned bus.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadAssignedBus();
  }, [user]);

  useEffect(() => {
    if (!tripActive || !bus) return undefined;
    if (!socket?.connected) return undefined;
    if (!navigator.geolocation) {
      setGeoStatus("unsupported");
      setGeoError("Geolocation is not supported in this browser.");
      return undefined;
    }

    let inFlight = false;
    const interval = setInterval(() => {
      if (inFlight) return;
      inFlight = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoStatus("ok");
          setGeoError("");
          setLastLocationAt(new Date().toISOString());
          socket.emit("locationUpdate", {
            busId: bus._id,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            status,
            speedKmph:
              Number.isFinite(position.coords.speed) && position.coords.speed >= 0
                ? position.coords.speed * 3.6
                : null,
          });
          inFlight = false;
        },
        (positionError) => {
          setGeoStatus("error");
          if (positionError.code === 1) {
            setGeoError(
              "Location permission denied. Please enable location access.",
            );
            return;
          }
          if (positionError.code === 2) {
            setGeoError(
              "Location unavailable. Check GPS/network and try again.",
            );
            return;
          }
          if (positionError.code === 3) {
            setGeoError("Location request timed out. Retrying automatically.");
            return;
          }
          setGeoError("Unable to fetch location.");
          inFlight = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        },
      );
    }, LOCATION_SEND_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [tripActive, socket, user, bus, status]);

  useEffect(() => {
    if (!socket) return;

    const handleSocketError = (error) => {
      console.error("[Driver] Socket error:", error);
      const message = (error.message || "").toLowerCase();
      if (message.includes("too many updates")) {
        setGeoError("Location updates too frequent. Waiting...");
      } else if (message.includes("not assigned")) {
        setGeoError("Error: Not assigned to this bus");
      } else {
        setGeoError(error.message || "Failed to send location");
      }
    };

    socket.on("error", handleSocketError);
    return () => socket.off("error", handleSocketError);
  }, [socket]);

  const updateTrip = async (isTripActive) => {
    if (!bus) return;
    setError("");
    setFeedback("");
    try {
      await client.patch(`/buses/${bus._id}`, { isTripActive, status });
      setTripActive(isTripActive);
      setFeedback(isTripActive ? "Trip started." : "Trip stopped.");
    } catch (updateError) {
      setError(
        updateError.response?.data?.message || "Failed to update trip state.",
      );
    }
  };

  const updateStatus = async (nextStatus) => {
    if (!bus) return;
    setError("");
    setFeedback("");
    try {
      await client.patch(`/buses/${bus._id}`, { status: nextStatus });
      setStatus(nextStatus);
      setFeedback(`Status updated to ${nextStatus}.`);
    } catch (updateError) {
      setError(
        updateError.response?.data?.message || "Failed to update status.",
      );
    }
  };

  if (loading) {
    return <main className="p-4">Loading driver panel...</main>;
  }

  if (error && !bus) {
    return <main className="p-4 text-red-700">{error}</main>;
  }

  if (!bus) {
    return <main className="p-4">No bus assigned to your driver account.</main>;
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="rounded bg-white p-4 shadow">
        <h2 className="text-xl font-semibold">Driver Panel</h2>
        {error && (
          <p className="mt-2 rounded bg-red-100 p-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {feedback && (
          <p className="mt-2 rounded bg-green-100 p-2 text-sm text-green-700">
            {feedback}
          </p>
        )}
        <p className="mt-2 text-sm">Assigned Bus: {bus.number}</p>
        <p className="text-sm">Current Status: {status}</p>
        <p className="text-sm">Trip: {tripActive ? "Active" : "Inactive"}</p>
        <p className="text-sm">
          Location sync:{" "}
          {geoStatus === "ok"
            ? "Running"
            : geoStatus === "unsupported"
              ? "Unsupported"
              : geoStatus === "error"
                ? "Issue detected"
                : "Waiting"}
        </p>
        {lastLocationAt && (
          <p className="text-xs text-slate-600">
            Last location sent: {new Date(lastLocationAt).toLocaleTimeString()}
          </p>
        )}
        {geoError && (
          <p className="mt-2 rounded bg-yellow-100 p-2 text-sm text-yellow-800">
            {geoError}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => updateTrip(true)}
            className="rounded bg-green-600 px-3 py-2 text-white"
          >
            Start Trip
          </button>
          <button
            onClick={() => updateTrip(false)}
            className="rounded bg-gray-700 px-3 py-2 text-white"
          >
            Stop Trip
          </button>
          <button
            onClick={() => updateStatus("running")}
            className="rounded bg-blue-600 px-3 py-2 text-white"
          >
            Running
          </button>
          <button
            onClick={() => updateStatus("delayed")}
            className="rounded bg-yellow-600 px-3 py-2 text-white"
          >
            Delayed
          </button>
          <button
            onClick={() => updateStatus("stopped")}
            className="rounded bg-red-600 px-3 py-2 text-white"
          >
            Stopped
          </button>
        </div>
      </div>
    </main>
  );
}
