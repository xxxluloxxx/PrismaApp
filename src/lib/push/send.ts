import webpush from "web-push";

import { createServiceClient } from "@/lib/supabase/service";
import type { PushSubscriptionRow } from "@/lib/types/push-subscription";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

function getStatusCode(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  return undefined;
}

function configureWebPush(): void {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    throw new Error("Falta configurar VAPID para las notificaciones push");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function getActiveAdminProfileIds(): Promise<string[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "administrador")
      .eq("is_active", true);

    if (error) {
      console.error(
        "No se pudieron consultar los administradores para push:",
        error.message
      );
      return [];
    }

    return [...new Set((data ?? []).map((profile) => String(profile.id)))];
  } catch (error) {
    console.error(
      "Falló la consulta de administradores para push:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

export async function sendPushToProfiles(
  profileIds: string[],
  payload: PushPayload
): Promise<void> {
  const uniqueProfileIds = [...new Set(profileIds.filter(Boolean))];
  if (uniqueProfileIds.length === 0) return;

  try {
    configureWebPush();

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("profile_id", uniqueProfileIds);

    if (error) {
      console.error(
        "No se pudieron consultar las suscripciones push:",
        error.message
      );
      return;
    }

    const subscriptions = (data ?? []) as PushSubscriptionRow[];
    await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth_key,
              },
            },
            JSON.stringify(payload)
          );
        } catch (sendError) {
          const statusCode = getStatusCode(sendError);
          if (statusCode === 404 || statusCode === 410) {
            const { error: deleteError } = await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", subscription.id);

            if (deleteError) {
              console.error(
                "No se pudo eliminar una suscripción push expirada:",
                deleteError.message
              );
            }
            return;
          }

          console.error("Falló un envío push:", sendError);
        }
      })
    );
  } catch (error) {
    console.error(
      "Falló la preparación o el envío de notificaciones push:",
      error instanceof Error ? error.message : error
    );
  }
}
