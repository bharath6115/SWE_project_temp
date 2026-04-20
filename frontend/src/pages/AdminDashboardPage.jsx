import { useEffect, useState } from "react";
import client from "../api/client";
import useSocket from "../hooks/useSocket";

export default function AdminDashboardPage() {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [newRoute, setNewRoute] = useState({ name: "", code: "" });
  const [newBus, setNewBus] = useState({ number: "", route: "" });
  const { busLocations } = useSocket();

  const load = async () => {
    const [routesRes, busesRes, driversRes] = await Promise.all([
      client.get("/routes"),
      client.get("/buses"),
      client.get("/users/drivers"),
    ]);
    setRoutes(routesRes.data);
    setBuses(busesRes.data);
    setDrivers(driversRes.data);
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const createRoute = async (event) => {
    event.preventDefault();
    await client.post("/routes", { ...newRoute, stops: [] });
    setNewRoute({ name: "", code: "" });
    await load();
  };

  const createBus = async (event) => {
    event.preventDefault();
    await client.post("/buses", newBus);
    setNewBus({ number: "", route: "" });
    await load();
  };

  const assign = async (busId, driverId) => {
    await client.post("/buses/assign-driver", { busId, driverId });
    await load();
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
      <section className="grid gap-4 md:grid-cols-2">
        <form onSubmit={createRoute} className="rounded bg-white p-4 shadow">
          <h3 className="mb-2 font-semibold">Create Route</h3>
          <input className="mb-2 w-full rounded border p-2" placeholder="Name" value={newRoute.name} onChange={(e) => setNewRoute((p) => ({ ...p, name: e.target.value }))} />
          <input className="mb-2 w-full rounded border p-2" placeholder="Code" value={newRoute.code} onChange={(e) => setNewRoute((p) => ({ ...p, code: e.target.value }))} />
          <button className="rounded bg-blue-600 px-3 py-2 text-white">Add Route</button>
        </form>
        <form onSubmit={createBus} className="rounded bg-white p-4 shadow">
          <h3 className="mb-2 font-semibold">Create Bus</h3>
          <input className="mb-2 w-full rounded border p-2" placeholder="Bus Number" value={newBus.number} onChange={(e) => setNewBus((p) => ({ ...p, number: e.target.value }))} />
          <select className="mb-2 w-full rounded border p-2" value={newBus.route} onChange={(e) => setNewBus((p) => ({ ...p, route: e.target.value }))}>
            <option value="">Select route</option>
            {routes.map((route) => (
              <option key={route._id} value={route._id}>
                {route.name}
              </option>
            ))}
          </select>
          <button className="rounded bg-blue-600 px-3 py-2 text-white">Add Bus</button>
        </form>
      </section>
      <section className="rounded bg-white p-4 shadow">
        <h3 className="mb-2 font-semibold">Buses</h3>
        <div className="space-y-2">
          {buses.map((bus) => {
            const live = busLocations[bus._id];
            return (
              <div key={bus._id} className="rounded border p-3">
                <p className="font-semibold">{bus.number}</p>
                <p className="text-sm">Status: {live?.status || bus.status}</p>
                <p className="text-sm">
                  Live: {live ? `${live.latitude.toFixed(4)}, ${live.longitude.toFixed(4)}` : "No live data"}
                </p>
                <select className="mt-2 rounded border p-2" defaultValue="" onChange={(e) => e.target.value && assign(bus._id, e.target.value)}>
                  <option value="">Assign driver</option>
                  {drivers.map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name} ({driver.email})
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
