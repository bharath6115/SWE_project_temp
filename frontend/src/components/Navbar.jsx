import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
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
              <path d="M8 6h11l2 7H5l2-7h1z" />
              <path d="M16 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
              <path d="M7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
              <path d="M19 13v4H5v-4" />
              <path d="M5 7l2 6" />
              <path d="M19 7l-2 6" />
            </svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">CampusBus</h1>
        </div>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            to="/student"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-standard ${
              isActive("/student") ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Live Map
          </Link>
          <Link
            to="/driver"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-standard ${
              isActive("/driver") ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Driver Panel
          </Link>
          <Link
            to="/admin"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-standard ${
              isActive("/admin") ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Admin Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-500 md:block">
                Hello, <span className="font-semibold text-slate-900">{user.name}</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white transition-standard hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition-standard hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
