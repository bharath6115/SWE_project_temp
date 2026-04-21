export default function BusSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="rounded bg-white p-4 shadow">
      <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      <div className="mt-4 space-y-2">
        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );
}

export function BusListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded bg-white p-3 shadow animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}

export function ConnectionSkeleton() {
  return (
    <div className="inline-block rounded px-3 py-1 text-sm bg-gray-200 text-gray-400 animate-pulse">
      Connecting...
    </div>
  );
}
