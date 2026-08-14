"use client";

import { Stethoscope, UserRoundSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import type { BookingDoctor, BookingTreatment } from "./types";

type OptionCardProps = {
  id: string;
  value: string;
  title: string;
  description: string;
  selected: boolean;
  icon?: React.ReactNode;
};

function OptionCard({
  id,
  value,
  title,
  description,
  selected,
  icon,
}: OptionCardProps) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent/60",
        selected && "border-primary bg-accent/70 ring-2 ring-primary/15"
      )}
    >
      <RadioGroupItem id={id} value={value} />
      {icon ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
          {description}
        </span>
      </span>
    </Label>
  );
}

type DoctorStepProps = {
  doctors: BookingDoctor[];
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
};

export function DoctorStep({
  doctors,
  value,
  onChange,
  onNext,
}: DoctorStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Elige un médico</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Puedes escoger un profesional o ver la primera hora disponible.
        </p>
      </div>

      <RadioGroup value={value} onValueChange={onChange} className="gap-3">
        <OptionCard
          id="doctor-any"
          value="any"
          title="Cualquiera disponible"
          description="Te mostraremos los horarios de todo el equipo."
          selected={value === "any"}
          icon={<UserRoundSearch aria-hidden className="size-5" />}
        />
        {doctors.map((doctor) => (
          <OptionCard
            key={doctor.id}
            id={`doctor-${doctor.id}`}
            value={doctor.id}
            title={doctor.full_name}
            description={doctor.specialty || "Odontología general"}
            selected={value === doctor.id}
            icon={<Stethoscope aria-hidden className="size-5" />}
          />
        ))}
      </RadioGroup>

      <Button
        type="button"
        size="lg"
        className="h-11 w-full"
        disabled={!value}
        onClick={onNext}
      >
        Continuar
      </Button>
    </div>
  );
}

type TreatmentStepProps = {
  treatments: BookingTreatment[];
  value: string;
  onChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  defaultDuration: number;
};

export function TreatmentStep({
  treatments,
  value,
  onChange,
  onBack,
  onNext,
  defaultDuration,
}: TreatmentStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl font-semibold">
          ¿Cuál es el motivo?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Esto nos ayuda a reservar el tiempo adecuado.
        </p>
      </div>

      <RadioGroup value={value} onValueChange={onChange} className="gap-3">
        <OptionCard
          id="treatment-unsure"
          value="unsure"
          title="No estoy seguro / otro motivo"
          description={`Reservaremos ${defaultDuration} minutos para evaluarte.`}
          selected={value === "unsure"}
        />
        {treatments.map((treatment) => (
          <OptionCard
            key={treatment.id}
            id={`treatment-${treatment.id}`}
            value={treatment.id}
            title={treatment.name}
            description={`${treatment.duration_minutes} minutos`}
            selected={value === treatment.id}
          />
        ))}
      </RadioGroup>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11"
          onClick={onBack}
        >
          Volver
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-11"
          disabled={!value}
          onClick={onNext}
        >
          Ver horarios
        </Button>
      </div>
    </div>
  );
}
