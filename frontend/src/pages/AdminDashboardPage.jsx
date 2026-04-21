import { useEffect, useState } from "react";
import client from "../api/client";
import useSocket from "../hooks/useSocket";

export default function AdminDashboardPage() {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [newRoute, setNewRoute] = useState({ name: "", code: "" });
  const [newBus, setNewBus] = useState({ number: "", route: "" });
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [editingBusId, setEditingBusId] = useState(null);
  const [routeDraft, setRouteDraft] = useState({ name: "", code: "", stops: [] });
  const [busDraft, setBusDraft] = useState({ number: "", route: "", status: "stopped", isTripActive: false });
  const [newStop, setNewStop] = useState({ name: "", latitude: "", longitude: "" });
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const { busLocations, isConnected } = useSocket();

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
    try {
      await client.post("/routes", { ...newRoute, stops: [] });
      setNewRoute({ name: "", code: "" });
      await load();
      setFeedback({ type: "success", message: "Route created." });
    } catch (error) {
      setFeedback({ type: "error", message: error.response?.data?.message || "Failed to create route." });
    }
  };

  const createBus = async (event) => {
    event.preventDefault();
    try {
      await client.post("/buses", newBus);
      setNewBus({ number: "", route: "" });
      await load();
      setFeedback({ type: "success", message: "Bus created." });
    } catch (error) {
      setFeedback({ type: "error", message: error.response?.data?.message || "Failed to create bus." });
    }
  };

  const assign = async (busId, driverId) => {
    try {
      await client.post("/buses/assign-driver", { busId, driverId });
      await load();
      setFeedback({ type: "success", message: "Driver assigned." });
    } catch (error) {
      setFeedback({ type: "error", message: error.response?.data?.message || "Failed to assign driver." });
    }
  };

  const beginRouteEdit = (route) => {
    setEditingRouteId(route._id);
    setRouteDraft({
      name: route.name || "",
      code: route.code || "",
      stops: route.stops || [],
    });
    setNewStop({ name: "", latitude: "", longitude: "" });
  };

  const saveRoute = async () => {
    if (!editingRouteId) return;
    const payload = {
      name: routeDraft.name,
      code: routeDraft.code,
      stops: routeDraft.stops.map((stop) => ({
        name: stop.name,
        latitude: Number(stop.latitude),
        longitude: Number(stop.longitude),
      })),
    };
    try {
      await client.patch(`/routes/${editingRouteId}`, payload);
      setEditingRouteId(null);
      setRouteDraft({ name: "", code: "", stops: [] });
      await load();
      setFeedback({ type: "success", message: "Route updated." });
    } catch (error) {
      setFeedback({ type: "error", message: error.response?.data?.message || "Failed to update route." });
    }
  };

  const deleteRoute = async (routeId) => {
    const confirmed = window.confirm("Delete this route?");
    if (!confirmed) return;
    try {
      await client.delete(`/routes/${routeId}`);
      if (editingRouteId === routeId) {
        setEditingRouteId(null);
        setRouteDraft({ name: "", code: "", stops: [] });
      }
      await load();
      setFeedback({ type: "success", message: "Route deleted." });
    } catch (error) {
      setFeedback({ type: "error", message: error.response?.data?.message || "Failed to delete route." });
    }
  };

  const addStopToDraft = () => {
    if (!newStop.name || newStop.latitude === "" || newStop.longitude === "") return;
    setRouteDraft((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          name: newStop.name,
          latitude: Number(newStop.latitude),
          longitude: Number(newStop.longitude),
        },
      ],
    }));
    setNewStop({ name: "", latitude: "", longitude: "" });
  };

  const removeStopFromDraft = (index) => {
    setRouteDraft((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));
  };

  const beginBusEdit = (bus) => {
    setEditingBusId(bus._id);
    setBusDraft({
      number: bus.number || "",
      route: bus.route?._id || "",
      status: bus.status || "stopped",
      isTripActive: Boolean(bus.isTripActive),
    });
  };

  const saveBus = async () => {
    if (!editingBusId) return;
    try {
      await client.patch(`/buses/${editingBusId}`, busDraft);
      setEditingBusId(null);
      setBusDraft({ number: "", route: "", status: "stopped", isTripActive: false });
      await load();
      setFeedback({ type: "success", message: "Bus updated." });
    } catch (error) {
      setFeedback({ type: "error", message: error.response?.data?.message || "Failed to update bus." });
    }
  };

  const deleteBus = async (busId) => {
    const confirmed = window.confirm("Delete this bus?");
    if (!confirmed) return;
    try {
      await client.delete(`/buses/${busId}`);
      if (editingBusId === busId) {
        setEditingBusId(null);
        setBusDraft({ number: "", route: "", status: "stopped", isTripActive: false });
      }
      await load();
      setFeedback({ type: "success", message: "Bus deleted." });
    } catch (error) {
      setFeedback({ type: "error", message: error.response?.data?.message || "Failed to delete bus." });
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
      <p
        className={`inline-block rounded px-3 py-1 text-sm ${
          isConnected ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        }`}
      >
        Live connection: {isConnected ? "Connected" : "Reconnecting..."}
      </p>
      {feedback.message && (
        <p
          className={`rounded p-3 text-sm ${
            feedback.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {feedback.message}
        </p>
      )}
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
        <h3 className="mb-2 font-semibold">Routes</h3>
        <div className="space-y-2">
          {routes.map((route) => {
            const isEditing = editingRouteId === route._id;
            return (
              <div key={route._id} className="rounded border p-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <input className="w-full rounded border p-2" value={routeDraft.name} onChange={(e) => setRouteDraft((p) => ({ ...p, name: e.target.value }))} placeholder="Route name" />
                    <input className="w-full rounded border p-2" value={routeDraft.code} onChange={(e) => setRouteDraft((p) => ({ ...p, code: e.target.value }))} placeholder="Route code" />
                    <div className="rounded border p-2">
                      <p className="mb-2 text-sm font-semibold">Stops</p>
                      <div className="mb-2 space-y-1">
                        {routeDraft.stops.length === 0 && <p className="text-sm text-slate-600">No stops added.</p>}
                        {routeDraft.stops.map((stop, index) => (
                          <div key={`${stop.name}-${index}`} className="flex items-center justify-between text-sm">
                            <span>{stop.name} ({Number(stop.latitude).toFixed(4)}, {Number(stop.longitude).toFixed(4)})</span>
                            <button type="button" onClick={() => removeStopFromDraft(index)} className="rounded bg-red-600 px-2 py-1 text-white">
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="grid gap-2 md:grid-cols-4">
                        <input className="rounded border p-2" placeholder="Stop name" value={newStop.name} onChange={(e) => setNewStop((p) => ({ ...p, name: e.target.value }))} />
                        <input className="rounded border p-2" placeholder="Latitude" value={newStop.latitude} onChange={(e) => setNewStop((p) => ({ ...p, latitude: e.target.value }))} />
                        <input className="rounded border p-2" placeholder="Longitude" value={newStop.longitude} onChange={(e) => setNewStop((p) => ({ ...p, longitude: e.target.value }))} />
                        <button type="button" onClick={addStopToDraft} className="rounded bg-slate-700 px-3 py-2 text-white">
                          Add Stop
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={saveRoute} className="rounded bg-blue-600 px-3 py-2 text-white">
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingRouteId(null)} className="rounded bg-slate-500 px-3 py-2 text-white">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold">{route.name} ({route.code})</p>
                    <p className="text-sm">Stops: {route.stops?.length || 0}</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => beginRouteEdit(route)} className="rounded bg-blue-600 px-3 py-2 text-white">
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteRoute(route._id)} className="rounded bg-red-600 px-3 py-2 text-white">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <section className="rounded bg-white p-4 shadow">
        <h3 className="mb-2 font-semibold">Buses</h3>
        <div className="space-y-2">
          {buses.map((bus) => {
            const live = busLocations[bus._id];
            const isEditing = editingBusId === bus._id;
            return (
              <div key={bus._id} className="rounded border p-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <input className="w-full rounded border p-2" value={busDraft.number} onChange={(e) => setBusDraft((p) => ({ ...p, number: e.target.value }))} placeholder="Bus number" />
                    <select className="w-full rounded border p-2" value={busDraft.route} onChange={(e) => setBusDraft((p) => ({ ...p, route: e.target.value }))}>
                      <option value="">Select route</option>
                      {routes.map((route) => (
                        <option key={route._id} value={route._id}>
                          {route.name}
                        </option>
                      ))}
                    </select>
                    <select className="w-full rounded border p-2" value={busDraft.status} onChange={(e) => setBusDraft((p) => ({ ...p, status: e.target.value }))}>
                      <option value="running">running</option>
                      <option value="delayed">delayed</option>
                      <option value="stopped">stopped</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={busDraft.isTripActive} onChange={(e) => setBusDraft((p) => ({ ...p, isTripActive: e.target.checked }))} />
                      Trip active
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={saveBus} className="rounded bg-blue-600 px-3 py-2 text-white">
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingBusId(null)} className="rounded bg-slate-500 px-3 py-2 text-white">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold">{bus.number}</p>
                    <p className="text-sm">Status: {live?.status || bus.status}</p>
                    <p className="text-sm">Route: {bus.route?.name || "Unassigned"}</p>
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
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => beginBusEdit(bus)} className="rounded bg-blue-600 px-3 py-2 text-white">
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteBus(bus._id)} className="rounded bg-red-600 px-3 py-2 text-white">
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
