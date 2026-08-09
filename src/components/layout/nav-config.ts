import {
  BriefcaseMedical,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Smile,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { Profile } from "@/lib/types/profile";
import { isAdmin } from "@/lib/types/profile";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/pacientes", label: "Pacientes", icon: UsersRound },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/fichas", label: "Fichas", icon: ClipboardList },
  { href: "/odontograma", label: "Odontograma", icon: Smile },
  { href: "/presupuestos", label: "Presupuestos", icon: Wallet },
];

export const adminNav: NavItem[] = [
  { href: "/equipo", label: "Equipo", icon: UsersRound, adminOnly: true },
  {
    href: "/tratamientos",
    label: "Tratamientos",
    icon: BriefcaseMedical,
    adminOnly: true,
  },
];

/**
 * "Configuración" vive fuera de primaryNav/adminNav/navForProfile: no es
 * parte del drawer ni de la barra inferior, solo se accede desde el menú
 * de usuario (avatar) en el header -- ver `app-shell.tsx`.
 */
export const configuracionNav: NavItem = {
  href: "/configuracion",
  label: "Configuración",
  icon: Settings,
};

export function navForProfile(profile: Profile): NavItem[] {
  const items = [...primaryNav];
  if (isAdmin(profile)) {
    items.push(...adminNav);
  }
  return items;
}

/**
 * Ítems primarios de la barra inferior móvil (máx. 5), distintos por rol
 * según el flujo de uso diario: el médico vive en lo clínico (agenda,
 * pacientes, fichas, odontograma); el administrador pesa más lo operativo
 * (pacientes, agenda, equipo, tratamientos). El resto de la navegación
 * queda en el drawer lateral ("Más opciones"); "Configuración" vive aparte,
 * en el menú de usuario.
 */
export function bottomNavForProfile(profile: Profile): NavItem[] {
  const [inicio, pacientes, agenda, fichas, odontograma] = primaryNav;

  if (isAdmin(profile)) {
    const equipo = adminNav.find((item) => item.href === "/equipo")!;
    const tratamientos = adminNav.find(
      (item) => item.href === "/tratamientos"
    )!;
    return [inicio, pacientes, agenda, equipo, tratamientos];
  }

  return [inicio, agenda, pacientes, fichas, odontograma];
}

/**
 * Ítems que quedan fuera de la barra inferior y viven en el drawer lateral
 * ("Más opciones"), preservando el orden y los permisos de `navForProfile`.
 */
export function drawerNavForProfile(profile: Profile): NavItem[] {
  const bottomHrefs = new Set(
    bottomNavForProfile(profile).map((item) => item.href)
  );
  return navForProfile(profile).filter((item) => !bottomHrefs.has(item.href));
}
