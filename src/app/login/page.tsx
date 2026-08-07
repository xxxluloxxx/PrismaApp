import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");
  } catch {
    // Sin env de Supabase: mostrar login igual (dev / primer deploy).
  }

  return (
    <main className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.72_0.09_200_/_0.35),_transparent_55%),linear-gradient(160deg,_oklch(0.28_0.04_250),_oklch(0.18_0.03_250))]"
      />
      <div className="relative mb-8 flex flex-col items-center text-center">
        <p className="font-heading text-4xl font-semibold tracking-tight text-white">
          PrismaApp
        </p>
        <p className="mt-2 text-sm text-white/70">
          Gestión de clínica odontológica
        </p>
      </div>

      <Card className="relative w-full max-w-md border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>
            Accede con tu correo del equipo de la clínica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
