"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import type { Patient } from "@/lib/types/patient";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function PatientsList({
  patients,
  initialSearch,
  showInactive,
}: {
  patients: Patient[];
  initialSearch: string;
  showInactive: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) params.set("q", search.trim());
    else params.delete("q");
    router.push(`/pacientes?${params.toString()}`);
  }

  function toggleInactive() {
    const params = new URLSearchParams(searchParams.toString());
    if (showInactive) params.delete("all");
    else params.set("all", "1");
    router.push(`/pacientes?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Pacientes
          </h1>
          <p className="text-sm text-muted-foreground">
            Inventario compartido de la clínica
          </p>
        </div>
        <Link href="/pacientes/nuevo" className={cn(buttonVariants())}>
          Nuevo paciente
        </Link>
      </div>

      <form onSubmit={applyFilters} className="flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, documento o teléfono"
          className="max-w-md"
        />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        <Button type="button" variant="outline" onClick={toggleInactive}>
          {showInactive ? "Solo activos" : "Incluir inactivos"}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No hay pacientes todavía
                </TableCell>
              </TableRow>
            ) : (
              patients.map((p) => (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell>
                    <Link
                      href={`/pacientes/${p.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.last_name}, {p.first_name}
                    </Link>
                  </TableCell>
                  <TableCell>{p.document_id}</TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? "secondary" : "outline"}>
                      {p.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
