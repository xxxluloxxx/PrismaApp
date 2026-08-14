"use server";

import { getCurrentProfile } from "@/lib/supabase/profile";
import {
  createPushSubscription,
  deletePushSubscription,
} from "@/lib/supabase/push-subscription";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function subscribeToPushAction(
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  },
  userAgent?: string
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const result = await createPushSubscription({
    profile_id: profile.profile.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth_key: subscription.keys.auth,
    user_agent: userAgent ?? null,
  });

  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo guardar la suscripción push",
    };
  }

  return { ok: true, id: result.data.id };
}

export async function unsubscribeFromPushAction(
  endpoint: string
): Promise<ActionResult> {
  const result = await deletePushSubscription(endpoint);
  if (result.error) {
    return {
      ok: false,
      message: result.message ?? "No se pudo eliminar la suscripción push",
    };
  }

  return { ok: true, id: endpoint };
}
