"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { transitionAppointmentAction } from "@/lib/appointments/actions";
import type {
  AppointmentStatus,
  AppointmentWithRelations,
} from "@/lib/types/appointment";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/appointment";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const NEXT: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  scheduled: ["confirmed", "cancelled", "no_show"],
  confirmed: ["completed", "cancelled", "no_show"],
};

export function AppointmentDetail({
  appointment,
}: {
  appointment: AppointmentWithRelations;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const options = NEXT[appointment.status] ?? [];

  function transition(status: AppointmentStatus) {
    startTransition(async () => {
      const result = await transitionAppointmentAction(
        appointment.id,
        status,
        appointment.updated_at
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`Estado: ${APPOINTMENT_STATUS_LABELS[status]}`);
      router.refresh();
    });
  }

  const start = new Date(appointment.starts_at);
  const end = new Date(appointment.ends_at);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Cita
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {start.toLocaleString("es-EC")} —{" "}
            {end.toLocaleTimeString("es-EC", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <Badge className="mt-2">
            {APPOINTMENT_STATUS_LABELS[appointment.status]}
          </Badge>
        </div>
        <Link href="/agenda" className={cn(buttonVariants({ variant: "ghost" }))}>
          Volver
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Paciente</p>
            <p className="font-medium">{appointment.patient_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Médico</p>
            <p className="font-medium">{appointment.doctor_name}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Motivo</p>
            <p className="font-medium">{appointment.reason || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Notas</p>
            <p className="font-medium whitespace-pre-wrap">
              {appointment.notes || "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {options.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {options.map((status) => (
            <Button
              key={status}
              variant={status === "cancelled" ? "destructive" : "secondary"}
              disabled={pending}
              onClick={() => transition(status)}
            >
              {APPOINTMENT_STATUS_LABELS[status]}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
