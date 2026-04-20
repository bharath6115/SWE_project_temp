import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold">Campus Bus Tracker</h1>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/student">Student</Link>
          <Link to="/driver">Driver</Link>
          <Link to="/admin">Admin</Link>
          {!user ? (
            <Link to="/login" className="rounded bg-blue-500 px-3 py-1">
              Login
            </Link>
          ) : (
            <button type="button" onClick={handleLogout} className="rounded bg-red-500 px-3 py-1">
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
