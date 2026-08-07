import type { Profile } from "@/lib/types/profile";
import { isAdmin } from "@/lib/types/profile";

export type NavItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
};

export const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/pacientes", label: "Pacientes" },
  { href: "/agenda", label: "Agenda" },
  { href: "/fichas", label: "Fichas" },
  { href: "/presupuestos", label: "Presupuestos" },
];

export const adminNav: NavItem[] = [
  { href: "/equipo", label: "Equipo", adminOnly: true },
  { href: "/tratamientos", label: "Tratamientos", adminOnly: true },
  { href: "/configuracion", label: "Configuración", adminOnly: true },
];

export function navForProfile(profile: Profile): NavItem[] {
  const items = [...primaryNav];
  if (isAdmin(profile)) {
    items.push(...adminNav);
  }
  return items;
}
