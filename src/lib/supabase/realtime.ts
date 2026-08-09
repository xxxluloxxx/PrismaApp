"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/**
 * Suscripción simple: refresca la ruta al cambiar filas (respeta RLS).
 * `onChange` es opcional y se dispara además de `router.refresh()` — útil para
 * vistas con datos client-side (ej. calendario) que no dependen del árbol de
 * Server Components y necesitan volver a pedir su propio rango.
 */
export function useRealtimeRefresh(
  table: string,
  enabled = true,
  onChange?: () => void
) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null =
      null;
    let supabase: ReturnType<typeof createClient> | null = null;

    try {
      supabase = createClient();
      channel = supabase
        .channel(`realtime:${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            if (!cancelled) {
              router.refresh();
              onChange?.();
            }
          }
        )
        .subscribe();
    } catch {
      // Sin env de Supabase: no-op
    }

    return () => {
      cancelled = true;
      if (supabase && channel) {
        void supabase.removeChannel(channel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, enabled, router]);
}
