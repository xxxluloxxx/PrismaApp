import { PatientForm } from "@/components/pacientes/patient-form";

export default function NuevoPacientePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Nuevo paciente
        </h1>
        <p className="text-sm text-muted-foreground">
          Alta en el inventario compartido de la clínica
        </p>
      </div>
      <PatientForm />
    </div>
  );
}
