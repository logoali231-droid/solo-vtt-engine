/**
 * PWA bootstrap — registers the service worker and handles updates.
 *
 * The worker is only registered in production builds: the dev preview serves
 * unbundled modules and must never be cached. On the deployed site the worker
 * gives offline play, a cached app shell and automatic updates.
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // A new worker took over — reload once to run the fresh app.
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            // New version installed while an older one was controlling the
            // page — ask it to activate, which triggers controllerchange.
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch((error) => {
        console.warn("[pwa] Service worker registration failed:", error);
      });
  });
}
