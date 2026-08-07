import { toast } from "sonner";
import { Download, Smartphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type InstallPrompt = { prompt: () => Promise<void>; userChoice: Promise<unknown> };

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

/**
 * Hooks into the browser install flow. `canInstall` is true while the app is
 * installable and not already running standalone / installed. On iOS (no
 * beforeinstallprompt event) it falls back to a "Share → Add to Home Screen"
 * hint.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [standalone, setStandalone] = useState(isStandalone());

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const sync = () => setStandalone(isStandalone());
    media.addEventListener("change", sync);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast.success("Oraculum installed — it's now on your home screen.");
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferred) {
      const promptEvent = deferred as BeforeInstallPromptEvent;
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setDeferred(null);
      return;
    }
    if (isIOS()) {
      toast.info("Tap Share  →  Add to Home Screen to install Oraculum.", {
        duration: 6000,
      });
      return;
    }
    toast.info("Use your browser's “Install app” / “Add to Home Screen” option.", {
      duration: 5000,
    });
  }, [deferred]);

  const canInstall = !standalone && !installed && (deferred !== null || isIOS());
  return { canInstall, promptInstall };
}

interface InstallAppProps {
  /** Compact icon-only button (fits dense headers). */
  variant?: "icon" | "button";
  className?: string;
}

/**
 * Small install button that only appears while the app is installable.
 * Place it in headers/navs — it hides itself after installation.
 */
export function InstallApp({ variant = "button", className }: InstallAppProps) {
  const { canInstall, promptInstall } = useInstallPrompt();
  if (!canInstall) return null;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => void promptInstall()}
        title="Install Oraculum on this device"
        aria-label="Install app"
        className={cn(
          "flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:border-amber-500/50 hover:text-amber-300",
          className,
        )}
      >
        <Download className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void promptInstall()}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 transition-all hover:border-amber-500 hover:text-amber-700",
        className,
      )}
    >
      <Smartphone className="size-4" />
      Install app
    </button>
  );
}
