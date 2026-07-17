export default function Loader({ fullPage = false }: { fullPage?: boolean }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3" id="spinner-container">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
      </div>
      <p className="text-sm font-medium text-slate-500 animate-pulse">Loading CRM systems...</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-xs" id="loader-fullpage">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-12 w-full h-full" id="loader-inline">
      {spinner}
    </div>
  );
}
