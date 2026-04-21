import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import BusMap from "../components/BusMap";
import useSocket from "../hooks/useSocket";
import { MapSkeleton, ConnectionSkeleton, BusListSkeleton } from "../components/Skeleton";

export default function StudentMapPage() {
  const [buses, setBuses] = useState([]);
  const [isLoadingBuses, setIsLoadingBuses] = useState(true);
  const { socket, busLocations, delayMessages, isConnected, connectionError, isRetrying } =
    useSocket();

  useEffect(() => {
    setIsLoadingBuses(true);
    client
      .get("/buses")
      .then(({ data }) => setBuses(data))
      .catch(() => setBuses([]))
      .finally(() => setIsLoadingBuses(false));
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    buses.forEach((bus) => {
      socket.emit("subscribeToBus", bus._id);
    });

    return () => {
      buses.forEach((bus) => {
        socket.emit("unsubscribeFromBus", bus._id);
      });
    };
  }, [socket, buses, isConnected]);

  const mergedBuses = useMemo(
    () =>
      buses.map((bus) => {
        const live = busLocations[bus._id];
        if (!live) return bus;
        const updatedAt = live.updatedAt ? new Date(live.updatedAt).getTime() : 0;
        const isFreshUpdate = Number.isFinite(updatedAt) && Date.now() - updatedAt <= 20000;
        return {
          ...bus,
          status: live.status,
          etaMinutes: live.etaMinutes,
          isMoving: live.status === "running" && isFreshUpdate,
          currentLocation: {
            latitude: live.latitude,
            longitude: live.longitude,
            updatedAt: live.updatedAt,
          },
        };
      }),
    [buses, busLocations],
  );

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <h2 className="text-2xl font-semibold">Student Live Map</h2>

      {/* Connection Status */}
      <div className="flex items-center gap-3">
        {isConnected ? (
          <p className="inline-block rounded px-3 py-1 text-sm bg-green-100 text-green-700">
            ✓ Live connection: Connected
          </p>
        ) : isRetrying ? (
          <div className="inline-block rounded px-3 py-1 text-sm bg-yellow-100 text-yellow-700 animate-pulse">
            ⟳ Reconnecting...
          </div>
        ) : (
          <div className="inline-block rounded px-3 py-1 text-sm bg-yellow-100 text-yellow-700">
            ⟳ Connecting to live updates...
          </div>
        )}
      </div>

      {connectionError && (
        <p className="rounded bg-red-100 p-3 text-sm text-red-700">
          Connection error: {connectionError}
        </p>
      )}

      {/* Map Section */}
      {isLoadingBuses ? (
        <MapSkeleton />
      ) : (
        <BusMap buses={mergedBuses} />
      )}

      {/* Delay Notifications Section */}
      <section className="rounded bg-white p-4 shadow">
        <h3 className="mb-2 font-semibold">Delay Notifications</h3>
        {delayMessages.length === 0 ? (
          <ul className="space-y-1 text-sm">
            <li>No delay notifications right now.</li>
          </ul>
        ) : (
          <ul className="space-y-1 text-sm">
            {delayMessages.map((item) => (
              <li key={item.updatedAt} className="text-yellow-600">
                ⚠ {item.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bus List Loading State */}
      {isLoadingBuses && (
        <section className="rounded bg-white p-4 shadow">
          <h3 className="mb-3 font-semibold">Loading Buses...</h3>
          <BusListSkeleton />
        </section>
      )}
    </main>
  );
}
