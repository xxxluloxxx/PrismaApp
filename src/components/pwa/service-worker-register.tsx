"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let updateIntervalId: number | undefined;
    let registration: ServiceWorkerRegistration | undefined;

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void registration?.update();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        registration = reg;
        updateIntervalId = window.setInterval(() => {
          void reg.update();
        }, 60_000);
      })
      .catch((error: unknown) => {
        console.error("Error al registrar el service worker:", error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (updateIntervalId !== undefined) {
        window.clearInterval(updateIntervalId);
      }
    };
  }, []);

  return null;
}
