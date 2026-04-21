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
        setError(loadError.response?.data?.message || "Failed to load assigned bus.");
      } finally {
        setLoading(false);
      }
    };
    if (user) loadAssignedBus();
  }, [user]);

  useEffect(() => {
    if (!tripActive || !bus || !socket?.connected) return undefined;
    if (!navigator.geolocation) {
      setGeoStatus("unsupported");
      setGeoError("Geolocation is not supported.");
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
            speedKmph: Number.isFinite(position.coords.speed) && position.coords.speed >= 0
              ? position.coords.speed * 3.6
              : null,
          });
          inFlight = false;
        },
        (pError) => {
          setGeoStatus("error");
          setGeoError(pError.message);
          inFlight = false;
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    }, LOCATION_SEND_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [tripActive, socket, bus, status]);

  const updateTrip = async (active) => {
    if (!bus) return;
    try {
      await client.patch(`/buses/${bus._id}`, { isTripActive: active, status });
      setTripActive(active);
      setFeedback(active ? "Trip started successfully" : "Trip ended");
      setTimeout(() => setFeedback(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update trip");
    }
  };

  const setBusStatus = async (s) => {
    if (!bus) return;
    try {
      await client.patch(`/buses/${bus._id}`, { status: s });
      setStatus(s);
      setFeedback(`Status updated to ${s}`);
      setTimeout(() => setFeedback(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center text-slate-500 font-medium">Initializing console...</div>;

  if (!bus) {
    return (
      <main className="mx-auto max-w-lg p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg border border-slate-100">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h10" /><circle cx="7" cy="17" r="2" /><circle cx="15" cy="17" r="2" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Bus Assigned</h2>
          <p className="mt-2 text-slate-500">Please contact the administrator to assign a vehicle to your account.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl border border-slate-100">
        <div className="bg-slate-900 p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Driver Console</h2>
              <p className="text-slate-400 font-medium">Vehicle ID: {bus.number}</p>
            </div>
            <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${tripActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
              <span className={`h-2 w-2 rounded-full ${tripActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              {tripActive ? 'Active Trip' : 'Off Duty'}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {error && <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">{error}</div>}
          {feedback && <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-600 border border-emerald-100">{feedback}</div>}

          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Trip Controls</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => updateTrip(true)}
                disabled={tripActive}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-600 p-6 text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z"/></svg>
                <span className="font-bold">Start Trip</span>
              </button>
              <button 
                onClick={() => updateTrip(false)}
                disabled={!tripActive}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-900 p-6 text-white transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12"/></svg>
                <span className="font-bold">End Trip</span>
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Status Updates</h3>
            <div className="flex flex-wrap gap-3">
              {['running', 'delayed', 'stopped'].map((s) => (
                <button
                  key={s}
                  onClick={() => setBusStatus(s)}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold capitalize transition-all ${
                    status === s 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-slate-50 p-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={`h-10 w-10 flex items-center justify-center rounded-xl ${geoStatus === 'ok' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                   </div>
                   <div>
                      <p className="text-sm font-bold text-slate-900">Live GPS Link</p>
                      <p className="text-xs text-slate-500">{geoStatus === 'ok' ? 'Transmitting coordinates' : 'Searching for signal...'}</p>
                   </div>
                </div>
                {lastLocationAt && <span className="text-[10px] font-bold text-slate-400 uppercase">Last sync: {new Date(lastLocationAt).toLocaleTimeString()}</span>}
             </div>
             {geoError && <p className="mt-3 text-xs font-semibold text-amber-600">Note: {geoError}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
