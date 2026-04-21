import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const user = await login(form);
      showSuccess("Login successful!");
      if (user.role === "driver") navigate("/driver");
      else if (user.role === "admin") navigate("/admin");
      else navigate("/student");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Login failed";
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full rounded border p-2"
          placeholder="Email"
          value={form.email}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, email: event.target.value }))
          }
          type="email"
          required
        />
        <input
          className="w-full rounded border p-2"
          placeholder="Password"
          value={form.password}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, password: event.target.value }))
          }
          type="password"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-blue-600 p-2 text-white"
        >
          Login
        </button>
      </form>
    </div>
  );
}
