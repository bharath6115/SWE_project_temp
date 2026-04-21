import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import BusMap from "../components/BusMap";
import useSocket from "../hooks/useSocket";
import BusCard from "../components/BusCard";
import { MapSkeleton } from "../components/Skeleton";

export default function StudentMapPage() {
  const [buses, setBuses] = useState([]);
  const [isLoadingBuses, setIsLoadingBuses] = useState(true);
  const [selectedBusId, setSelectedBusId] = useState(null);
  
  const { 
    socket, 
    busLocations, 
    delayMessages, 
    isConnected, 
    connectionError, 
    isRetrying 
  } = useSocket();

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
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        {isLoadingBuses ? (
          <MapSkeleton />
        ) : (
          <BusMap 
            buses={mergedBuses} 
            selectedBusId={selectedBusId} 
            onBusSelect={setSelectedBusId}
          />
        )}
      </div>

      {/* Floating UI Overlays */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col md:flex-row h-full">
        {/* Sidebar / List Section */}
        <div className="pointer-events-auto flex h-2/5 md:h-full w-full flex-col bg-white/90 p-4 shadow-2xl backdrop-blur-md md:w-80 lg:w-96 mt-auto md:mt-0 rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-r border-slate-200">
          <div className="mb-4 md:mb-6">
            <div className="md:hidden w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <h2 className="text-lg md:text-xl font-bold text-slate-900">Live Campus Map</h2>
            <div className="mt-1 md:mt-2 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-500">
                {isConnected ? "Live Connection Active" : isRetrying ? "Reconnecting..." : "Connecting..."}
              </p>
            </div>
          </div>

          {connectionError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100 italic">
              Connection issues: {connectionError}
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 md:space-y-4">
            {isLoadingBuses ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-24 md:h-32 w-full animate-pulse rounded-xl bg-slate-100" />
              ))
            ) : mergedBuses.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs md:text-sm font-medium text-slate-400">No active buses found</p>
              </div>
            ) : (
              mergedBuses.map((bus) => (
                <div 
                  key={bus._id} 
                  onClick={() => setSelectedBusId(bus._id)}
                  className={`cursor-pointer transition-all duration-200 active:scale-[0.98] ${selectedBusId === bus._id ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl' : ''}`}
                >
                  <BusCard bus={bus} />
                </div>
              ))
            )}
          </div>

          {/* Recent Delays Section - Collapsed on Mobile */}
          <div className="mt-4 border-t border-slate-100 pt-4 hidden md:block">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Recent Delays</h3>
            <div className="space-y-2">
              {delayMessages.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">No recent delays reported</p>
              ) : (
                delayMessages.slice(0, 2).map((item, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-[10px] font-medium text-amber-700 border border-amber-100">
                    <span className="mt-0.5">⚠️</span>
                    <span className="line-clamp-2">{item.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
