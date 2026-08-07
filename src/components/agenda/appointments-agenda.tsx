import Link from "next/link";

import type { AppointmentWithRelations } from "@/lib/types/appointment";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/appointment";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function AppointmentsAgenda({
  appointments,
}: {
  appointments: AppointmentWithRelations[];
}) {
  const grouped = new Map<string, AppointmentWithRelations[]>();
  for (const appt of appointments) {
    const day = new Date(appt.starts_at).toLocaleDateString("es-EC", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const list = grouped.get(day) ?? [];
    list.push(appt);
    grouped.set(day, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Agenda
          </h1>
          <p className="text-sm text-muted-foreground">
            Citas de la clínica (próximos 30 días)
          </p>
        </div>
        <Link href="/agenda/nueva" className={cn(buttonVariants())}>
          Agendar cita
        </Link>
      </div>

      {appointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay citas en este rango.</p>
      ) : (
        Array.from(grouped.entries()).map(([day, items]) => (
          <section key={day} className="flex flex-col gap-2">
            <h2 className="font-heading text-lg font-semibold capitalize">{day}</h2>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((appt) => {
                    const start = new Date(appt.starts_at);
                    const end = new Date(appt.ends_at);
                    return (
                      <TableRow key={appt.id}>
                        <TableCell>
                          <Link
                            href={`/agenda/${appt.id}`}
                            className="font-medium hover:underline"
                          >
                            {start.toLocaleTimeString("es-EC", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            –{" "}
                            {end.toLocaleTimeString("es-EC", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Link>
                        </TableCell>
                        <TableCell>{appt.patient_name}</TableCell>
                        <TableCell>{appt.doctor_name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {APPOINTMENT_STATUS_LABELS[appt.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
