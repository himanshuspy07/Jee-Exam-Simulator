import { useState, useEffect } from "react";
import { GraduationCap, Download, History, HelpCircle, Trophy, Sparkles } from "lucide-react";

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isTestRunning: boolean;
}

export default function Navbar({ currentView, onViewChange, isTestRunning }: NavbarProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div 
          onClick={() => !isTestRunning && onViewChange("dashboard")}
          className={`flex items-center gap-3 ${isTestRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-white shadow-md shadow-brand-blue/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              JEE <span className="text-brand-blue">Exam Simulator</span>
            </h1>
            <p className="hidden text-[10px] font-medium tracking-widest text-slate-400 uppercase sm:block">
              NTA Simulated Analytics Portal
            </p>
          </div>
        </div>

        {/* Dynamic Nav Actions */}
        {!isTestRunning && (
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => onViewChange("dashboard")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                currentView === "dashboard"
                  ? "bg-slate-100 text-brand-blue"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">My Dashboard</span>
            </button>

            <button
              onClick={() => onViewChange("setup")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                currentView === "setup"
                  ? "bg-slate-100 text-brand-blue"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>New Mock Test</span>
            </button>

            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 rounded-lg bg-green-500 hover:bg-green-600 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-green-500/10 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Install PWA</span>
              </button>
            )}
          </div>
        )}

        {isTestRunning && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-medium">Exam in Progress</span>
          </div>
        )}
      </div>
    </header>
  );
}
