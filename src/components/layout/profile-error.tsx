import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProfileError() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-4">
      <h1 className="font-heading text-2xl font-semibold">
        No pudimos cargar tu perfil
      </h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Tu sesión existe, pero el perfil no está disponible o está inactivo.
        Contacta al administrador de la clínica.
      </p>
      <Link href="/login" className={cn(buttonVariants())}>
        Volver al login
      </Link>
    </main>
  );
}
