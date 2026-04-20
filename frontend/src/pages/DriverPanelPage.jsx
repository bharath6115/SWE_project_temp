import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";

export default function DriverPanelPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [bus, setBus] = useState(null);
  const [status, setStatus] = useState("running");
  const [tripActive, setTripActive] = useState(false);

  useEffect(() => {
    client.get("/buses").then(({ data }) => {
      const assigned = data.find((entry) => entry.driver?._id === user?.id);
      setBus(assigned || null);
      setTripActive(Boolean(assigned?.isTripActive));
      setStatus(assigned?.status || "running");
    });
  }, [user]);

  useEffect(() => {
    if (!tripActive || !bus || !navigator.geolocation) return undefined;

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("locationUpdate", {
          driverId: user.id,
          busId: bus._id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          status,
        });
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [tripActive, socket, user, bus, status]);

  const updateTrip = async (isTripActive) => {
    if (!bus) return;
    await client.patch(`/buses/${bus._id}`, { isTripActive, status });
    setTripActive(isTripActive);
  };

  const updateStatus = async (nextStatus) => {
    if (!bus) return;
    await client.patch(`/buses/${bus._id}`, { status: nextStatus });
    setStatus(nextStatus);
  };

  if (!bus) {
    return <main className="p-4">No bus assigned to your driver account.</main>;
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="rounded bg-white p-4 shadow">
        <h2 className="text-xl font-semibold">Driver Panel</h2>
        <p className="mt-2 text-sm">Assigned Bus: {bus.number}</p>
        <p className="text-sm">Current Status: {status}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => updateTrip(true)} className="rounded bg-green-600 px-3 py-2 text-white">
            Start Trip
          </button>
          <button onClick={() => updateTrip(false)} className="rounded bg-gray-700 px-3 py-2 text-white">
            Stop Trip
          </button>
          <button onClick={() => updateStatus("running")} className="rounded bg-blue-600 px-3 py-2 text-white">
            Running
          </button>
          <button onClick={() => updateStatus("delayed")} className="rounded bg-yellow-600 px-3 py-2 text-white">
            Delayed
          </button>
          <button onClick={() => updateStatus("stopped")} className="rounded bg-red-600 px-3 py-2 text-white">
            Stopped
          </button>
        </div>
      </div>
    </main>
  );
}
