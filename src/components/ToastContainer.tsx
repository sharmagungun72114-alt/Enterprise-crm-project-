import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm" id="toast-container">
      {toasts.map((toast) => {
        let bgColor = "bg-white border-blue-100 text-blue-900";
        let icon = <Info className="h-5 w-5 text-blue-500" />;

        if (toast.type === "success") {
          bgColor = "bg-emerald-50 border-emerald-200 text-emerald-950";
          icon = <CheckCircle className="h-5 w-5 text-emerald-600" />;
        } else if (toast.type === "error") {
          bgColor = "bg-rose-50 border-rose-200 text-rose-950";
          icon = <XCircle className="h-5 w-5 text-rose-600" />;
        } else if (toast.type === "warning") {
          bgColor = "bg-amber-50 border-amber-200 text-amber-950";
          icon = <AlertTriangle className="h-5 w-5 text-amber-600" />;
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 opacity-100 ${bgColor}`}
          >
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div className="flex-1 text-sm font-medium leading-5">{toast.message}</div>
            <button
              id={`dismiss-toast-${toast.id}`}
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 rounded-lg p-0.5 transition-colors focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
