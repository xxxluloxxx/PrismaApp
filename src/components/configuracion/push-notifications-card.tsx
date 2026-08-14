"use client";

import { BellOff, BellRing, Loader2 } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  subscribeToPushAction,
  unsubscribeFromPushAction,
} from "@/lib/push/actions";
import {
  isPushSupported,
  urlBase64ToUint8Array,
} from "@/lib/push/client";

function subscribeToMountedState() {
  return () => {};
}

function useHasMounted() {
  return useSyncExternalStore(
    subscribeToMountedState,
    () => true,
    () => false
  );
}

export function PushNotificationsCard() {
  const mounted = useHasMounted();
  const supported = mounted ? isPushSupported() : null;
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscription, setSubscription] =
    useState<PushSubscription | null>(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;

    let cancelled = false;

    void navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((activeSubscription) => {
        if (!cancelled) {
          setPermission(Notification.permission);
          setSubscription(activeSubscription);
          setChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudo comprobar el estado de las notificaciones.");
          setChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [supported]);

  async function activateNotifications() {
    setLoading(true);
    setError(null);

    try {
      let nextPermission = Notification.permission;
      if (nextPermission === "default") {
        nextPermission = await Notification.requestPermission();
        setPermission(nextPermission);
      }

      if (nextPermission !== "granted") {
        setPermission(nextPermission);
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error(
          "La clave pública de notificaciones no está configurada."
        );
      }

      const registration = await navigator.serviceWorker.ready;
      const activeSubscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));
      const serialized = activeSubscription.toJSON();
      const endpoint = serialized.endpoint;
      const p256dh = serialized.keys?.p256dh;
      const auth = serialized.keys?.auth;

      if (!endpoint || !p256dh || !auth) {
        throw new Error("El navegador devolvió una suscripción incompleta.");
      }

      const result = await subscribeToPushAction(
        { endpoint, keys: { p256dh, auth } },
        navigator.userAgent
      );

      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      setPermission("granted");
      setSubscription(activeSubscription);
      setChecked(true);
      toast.success("Notificaciones push activadas");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudieron activar las notificaciones.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function deactivateNotifications() {
    if (!subscription) return;

    setLoading(true);
    setError(null);

    try {
      const result = await unsubscribeFromPushAction(subscription.endpoint);
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      await subscription.unsubscribe();
      setSubscription(null);
      toast.success("Notificaciones push desactivadas");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudieron desactivar las notificaciones.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones push</CardTitle>
        <CardDescription>
          Recibe avisos aunque la app esté cerrada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {(supported === null || (supported && !checked)) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Comprobando disponibilidad…
          </div>
        )}

        {supported === false && (
          <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            <BellOff className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              Las notificaciones push no están disponibles en este navegador.
            </p>
          </div>
        )}

        {supported && checked && permission === "denied" && (
          <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            <BellOff className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              Las notificaciones están bloqueadas. Actívalas manualmente desde
              los permisos del sitio en la configuración de tu navegador.
            </p>
          </div>
        )}

        {supported && checked && permission === "granted" && subscription && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <BellRing
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="text-sm font-medium">Estado</span>
              <Badge variant="success">Activadas</Badge>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => void deactivateNotifications()}
            >
              {loading && <Loader2 className="animate-spin" aria-hidden />}
              Desactivar
            </Button>
          </div>
        )}

        {supported &&
          checked &&
          permission !== "denied" &&
          !(permission === "granted" && subscription) && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <BellRing className="size-4 shrink-0" aria-hidden />
                <span>
                  {permission === "granted"
                    ? "Vuelve a suscribir este navegador para recibir avisos."
                    : "Permite avisos de citas, presupuestos y pagos."}
                </span>
              </div>
              <Button
                type="button"
                disabled={loading}
                onClick={() => void activateNotifications()}
              >
                {loading && <Loader2 className="animate-spin" aria-hidden />}
                {permission === "granted"
                  ? "Volver a activar"
                  : "Activar notificaciones"}
              </Button>
            </div>
          )}

        {error && supported && permission !== "denied" && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
