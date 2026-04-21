import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles?.length && !roles.includes(user.role)) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded border bg-white p-5 shadow">
          <h2 className="text-lg font-semibold">Access restricted</h2>
          <p className="mt-2 text-sm text-slate-700">
            This page requires one of these roles: <span className="font-semibold">{roles.join(", ")}</span>.
          </p>
          <p className="mt-1 text-sm text-slate-700">
            You are currently signed in as <span className="font-semibold">{user.role}</span>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/login" className="rounded bg-blue-600 px-3 py-2 text-sm text-white">
              Go to login
            </Link>
            <Link to="/student" className="rounded bg-slate-700 px-3 py-2 text-sm text-white">
              Back to student map
            </Link>
          </div>
        </div>
      </main>
    );
  }
  return children;
}
