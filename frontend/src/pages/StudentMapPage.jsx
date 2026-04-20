import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import BusMap from "../components/BusMap";
import useSocket from "../hooks/useSocket";

export default function StudentMapPage() {
  const [buses, setBuses] = useState([]);
  const { busLocations, delayMessages } = useSocket();

  useEffect(() => {
    client.get("/buses").then(({ data }) => setBuses(data)).catch(() => setBuses([]));
  }, []);

  const mergedBuses = useMemo(
    () =>
      buses.map((bus) => {
        const live = busLocations[bus._id];
        if (!live) return bus;
        return {
          ...bus,
          status: live.status,
          etaMinutes: live.etaMinutes,
          currentLocation: { latitude: live.latitude, longitude: live.longitude, updatedAt: live.updatedAt },
        };
      }),
    [buses, busLocations]
  );

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <h2 className="text-2xl font-semibold">Student Live Map</h2>
      <BusMap buses={mergedBuses} />
      <section className="rounded bg-white p-4 shadow">
        <h3 className="mb-2 font-semibold">Delay Notifications</h3>
        <ul className="space-y-1 text-sm">
          {delayMessages.length === 0 && <li>No delay notifications right now.</li>}
          {delayMessages.map((item) => (
            <li key={item.updatedAt}>{item.message}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
