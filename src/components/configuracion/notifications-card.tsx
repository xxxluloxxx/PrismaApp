import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PLANNED_NOTIFICATIONS = [
  "Recordatorios de citas",
  "Cambios en la agenda del día",
  "Presupuestos pendientes de aprobación",
];

/**
 * Placeholder honesto: las notificaciones in-app son post-MVP en PrismaAPP
 * (ver Plan/Fases-Proyecto.md, Fase 9 lo difirió a Fase 13+). Todavía no
 * existe una tabla de preferencias ni un canal de envío, así que esta card
 * no ofrece toggles funcionales -- solo comunica qué vendrá más adelante.
 */
export function NotificationsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones</CardTitle>
        <CardDescription>Avisos dentro de la aplicación</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          <Bell className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Las notificaciones dentro de la app todavía no están disponibles.
            Estamos trabajando en esta funcionalidad para una próxima
            actualización.
          </p>
        </div>
        <ul className="space-y-2">
          {PLANNED_NOTIFICATIONS.map((item) => (
            <li
              key={item}
              className="flex items-center justify-between gap-3 text-sm text-muted-foreground"
            >
              <span>{item}</span>
              <Badge variant="secondary" className="shrink-0">
                Próximamente
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
