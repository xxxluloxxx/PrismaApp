import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { isAdmin } from "@/lib/types/profile";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await getCurrentProfile();
  const profile = result.profile;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Hola{profile ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Base de PrismaApp lista. Los módulos clínicos llegan en las siguientes fases.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu rol</CardTitle>
          <CardDescription>
            El layout y el menú cambian según el rol (Fase 0).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {profile ? (
            <Badge>{isAdmin(profile) ? "Administrador" : "Médico"}</Badge>
          ) : null}
          {profile && isAdmin(profile) ? (
            <p className="text-sm text-muted-foreground">
              Ves secciones de Equipo, Tratamientos y Configuración.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Acceso clínico: pacientes, agenda, fichas y presupuestos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
