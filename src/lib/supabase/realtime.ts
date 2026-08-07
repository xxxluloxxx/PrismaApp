"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/** Suscripción simple: refresca la ruta al cambiar filas (respeta RLS). */
export function useRealtimeRefresh(table: string, enabled = true) {
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
            if (!cancelled) router.refresh();
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
  }, [table, enabled, router]);
}
