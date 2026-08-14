import type { Metadata } from "next";

import { BookingWizard } from "@/components/reservar/booking-wizard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Reservar cita | PrismaApp",
  description: "Agenda tu cita odontológica en unos minutos, sin llamar.",
};

export const dynamic = "force-dynamic";

export default function ReservarPage() {
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
          Reserva tu cita odontológica en línea
        </p>
      </div>

      <Card className="relative w-full max-w-lg border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Agenda tu cita</CardTitle>
          <CardDescription>
            Elige médico, motivo y horario. Toma menos de dos minutos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingWizard />
        </CardContent>
      </Card>
    </main>
  );
}
