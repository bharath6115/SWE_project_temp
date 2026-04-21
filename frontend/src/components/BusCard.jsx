import React from "react";

export default function BusCard({ bus }) {
  const statusColors = {
    running: "text-emerald-700 bg-emerald-50 border-emerald-100",
    delayed: "text-amber-700 bg-amber-50 border-amber-100",
    stopped: "text-slate-700 bg-slate-50 border-slate-100",
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-standard hover:border-indigo-200 hover:shadow-md animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Bus {bus.number}</h3>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${
                statusColors[bus.status] || statusColors.stopped
              }`}
            >
              {bus.status}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">{bus.route?.name || "No Route Assigned"}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 5 7 7-7 7" />
            <path d="M5 12h14" />
          </svg>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Next Major stop</p>
          <p className="text-sm font-semibold text-slate-700">
            {bus.route?.stops?.[0]?.name || "N/A"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Est. Arrival</p>
          <p className="text-sm font-bold text-indigo-600">
            {bus.etaMinutes ? `${bus.etaMinutes} mins` : "--"}
          </p>
        </div>
      </div>

      {bus.isMoving && (
        <div className="mt-4 flex items-center gap-2 overflow-hidden rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
          </span>
          Live updating now
        </div>
      )}
    </div>
  );
}
