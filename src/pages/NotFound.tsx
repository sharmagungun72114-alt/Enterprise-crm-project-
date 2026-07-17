import { Link } from "react-router-dom";
import { Building2, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center" id="notfound-page">
      <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-xl max-w-md w-full space-y-6">
        <div className="mx-auto bg-blue-50 text-blue-600 p-4 rounded-full w-16 h-16 flex items-center justify-center">
          <Search className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404 Error</h1>
          <h2 className="text-base font-bold text-slate-700">Enterprise Asset Not Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The target CRM resource or layout path you are trying to query does not exist or has been archived.
          </p>
        </div>

        <Link
          to="/"
          id="notfound-back-home"
          className="inline-flex justify-center items-center gap-2 w-full py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/10 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-150"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard Command</span>
        </Link>
      </div>
    </div>
  );
}
