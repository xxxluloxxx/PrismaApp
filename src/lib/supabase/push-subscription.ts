import { createClient } from "@/lib/supabase/server";
import type { PushSubscriptionRow } from "@/lib/types/push-subscription";

type CreateResult =
  | { data: PushSubscriptionRow; error: null }
  | { data: null; error: "query_failed"; message?: string };

type DeleteResult =
  | { data: true; error: null }
  | { data: null; error: "query_failed"; message?: string };

export async function createPushSubscription(input: {
  profile_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  user_agent?: string | null;
}): Promise<CreateResult> {
  const supabase = await createClient();

  // Reemplaza las claves del endpoint sin necesitar una policy UPDATE.
  const { error: deleteError } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", input.endpoint);

  if (deleteError) {
    return {
      data: null,
      error: "query_failed",
      message: deleteError.message,
    };
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .insert({
      ...input,
      user_agent: input.user_agent ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      data: null,
      error: "query_failed",
      message: error?.message ?? "No se pudo guardar la suscripción push",
    };
  }

  return { data: data as PushSubscriptionRow, error: null };
}

export async function deletePushSubscription(
  endpoint: string
): Promise<DeleteResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }

  return { data: true, error: null };
}
