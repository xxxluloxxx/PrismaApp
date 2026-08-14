"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateStaffAction } from "@/lib/staff/actions";
import type { Profile, UserRole } from "@/lib/types/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_LABELS: Record<UserRole, string> = {
  medico: "Médico",
  administrador: "Administrador",
};

export function StaffAdmin({ staff }: { staff: Profile[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: String(form.get("full_name") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
          specialty: String(form.get("specialty") ?? "").trim(),
          phone: String(form.get("phone") ?? "").trim(),
          role: String(form.get("role") ?? "medico"),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "No se pudo crear el usuario");
        return;
      }
      toast.success("Miembro del equipo creado");
      setShowForm(false);
      router.refresh();
    });
  }

  function toggleActive(member: Profile) {
    startTransition(async () => {
      const result = await updateStaffAction(member.id, {
        is_active: !member.is_active,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(member.is_active ? "Desactivado" : "Reactivado");
      router.refresh();
    });
  }

  function changeRole(member: Profile, role: UserRole) {
    if (role === member.role) return;
    startTransition(async () => {
      const result = await updateStaffAction(member.id, { role });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(
        role === "administrador"
          ? `${member.full_name} ahora es administrador`
          : `${member.full_name} ahora es médico`
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Equipo
          </h1>
          <p className="text-sm text-muted-foreground">
            Médicos y administradores de la clínica
          </p>
        </div>
        <Button type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cerrar" : "Invitar miembro"}
        </Button>
      </div>

      {showForm ? (
        <form
          onSubmit={(e) => void onCreate(e)}
          className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input id="full_name" name="full_name" required disabled={pending} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña temporal</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Rol</Label>
            <Select name="role" defaultValue="medico" disabled={pending}>
              <SelectTrigger id="role" size="sm" className="w-full">
                <SelectValue>
                  {(value: UserRole) => ROLE_LABELS[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medico">Médico</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="specialty">Especialidad</Label>
            <Input id="specialty" name="specialty" disabled={pending} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" disabled={pending} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creando…" : "Crear cuenta"}
            </Button>
          </div>
        </form>
      ) : null}

      {staff.length === 0 ? (
        <p className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
          Sin miembros del equipo
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:hidden">
            {staff.map((member) => (
              <Card key={member.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{member.full_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {member.email ?? "—"}
                      </span>
                    </div>
                    <Badge variant={member.is_active ? "success" : "destructive"}>
                      {member.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <Select
                    value={member.role}
                    onValueChange={(v) => changeRole(member, v as UserRole)}
                    disabled={pending}
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-full"
                      aria-label={`Rol de ${member.full_name}`}
                    >
                      <SelectValue>
                        {(value: UserRole) => ROLE_LABELS[value]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medico">Médico</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => toggleActive(member)}
                  >
                    {member.is_active ? "Desactivar" : "Activar"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.full_name}</TableCell>
                    <TableCell>{member.email ?? "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(v) => changeRole(member, v as UserRole)}
                        disabled={pending}
                      >
                        <SelectTrigger
                          size="sm"
                          aria-label={`Rol de ${member.full_name}`}
                        >
                          <SelectValue>
                            {(value: UserRole) => ROLE_LABELS[value]}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="medico">Médico</SelectItem>
                          <SelectItem value="administrador">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? "success" : "destructive"}>
                        {member.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => toggleActive(member)}
                      >
                        {member.is_active ? "Desactivar" : "Activar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
