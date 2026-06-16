import { useRegisterSW } from "virtual:pwa-register/react";
import { Sparkles, X } from "lucide-react";

/**
 * Shows a toast when the service worker has fetched a new build, letting the
 * user reload into the latest version. Only fires on production PWA builds
 * (the service worker is inactive under `npm run dev`).
 */
export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-4 py-3 shadow-lg">
        <span className="flex items-center justify-center flex-shrink-0 text-brand-accent">
          <Sparkles className="w-5 h-5" />
        </span>
        <span className="text-[14px] text-[#0a0a0a]">A new version of ParkPal is available.</span>
        <button
          onClick={() => updateServiceWorker(true)}
          className="h-[32px] px-3 rounded-[4px] bg-brand-accent text-white text-[14px] font-medium hover:bg-[#2c971a] transition-colors flex-shrink-0"
        >
          Reload
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          aria-label="Dismiss"
          className="text-[#99A1AF] hover:text-[#0a0a0a] transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
