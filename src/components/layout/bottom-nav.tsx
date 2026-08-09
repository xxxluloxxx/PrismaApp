"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { bottomNavForProfile, type NavItem } from "@/components/layout/nav-config";
import type { Profile } from "@/lib/types/profile";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BottomLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
        active ? "text-sidebar-primary" : "text-sidebar-foreground/70"
      )}
    >
      <Icon className={cn("size-5", !active && "opacity-70")} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/**
 * Barra inferior móvil: ítems primarios según el rol (ver
 * `bottomNavForProfile`). El resto de la navegación vive en el drawer
 * lateral, disparado desde el header.
 */
export function BottomNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const items = bottomNavForProfile(profile);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-bottom))] items-stretch border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] text-sidebar-foreground lg:hidden">
      {items.map((item) => (
        <BottomLink
          key={item.href}
          item={item}
          active={isActivePath(pathname, item.href)}
        />
      ))}
    </nav>
  );
}
