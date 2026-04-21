import { useToast } from "../context/ToastContext";

const toastStyles = {
  success: "bg-green-500 text-white",
  error: "bg-red-500 text-white",
  warning: "bg-yellow-500 text-white",
  info: "bg-blue-500 text-white",
};

const toastIcons = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

export default function Toast() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded shadow-lg animate-slide-in ${toastStyles[toast.type]}`}
        >
          <span className="text-lg">{toastIcons[toast.type]}</span>
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="hover:opacity-75 transition"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
