"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Settings } from "lucide-react";
import { useState } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import {
  configuracionNav,
  drawerNavForProfile,
  navForProfile,
  type NavItem,
} from "@/components/layout/nav-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/profile";
import { isAdmin } from "@/lib/types/profile";
import { cn } from "@/lib/utils";

function initials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const desktopItems = navForProfile(profile);
  const drawerItems = drawerNavForProfile(profile);

  return (
    <div className="flex min-h-full flex-1 bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="border-b border-sidebar-border px-4 py-5">
          <p className="font-heading text-xl font-semibold tracking-tight text-sidebar-foreground">
            PrismaApp
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {profile.full_name}
          </p>
          <Badge variant="secondary" className="mt-2">
            {isAdmin(profile) ? "Administrador" : "Médico"}
          </Badge>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks items={desktopItems} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b px-4 py-3 lg:px-6">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="lg:hidden" />
              }
            >
              <Menu className="size-4" />
              <span className="sr-only">Menú</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b px-4 py-4 text-left">
                <SheetTitle className="font-heading">
                  Más opciones
                </SheetTitle>
              </SheetHeader>
              <div className="p-3">
                <NavLinks
                  items={drawerItems}
                  onNavigate={() => setDrawerOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium lg:hidden">
              {profile.full_name}
            </p>
            <p className="hidden text-sm text-muted-foreground lg:block">
              Clínica odontológica
            </p>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            {isAdmin(profile) ? "Admin" : "Médico"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-10 gap-2 px-2"
                  aria-label="Menú de usuario"
                />
              }
            >
              <Avatar size="sm">
                <AvatarFallback className="bg-sidebar-primary text-xs text-sidebar-primary-foreground">
                  {initials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-medium">
                  {profile.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAdmin(profile) ? "Administrador" : "Médico"}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                render={<Link href={configuracionNav.href} />}
              >
                <Settings className="size-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => void signOut()}
              >
                <LogOut className="size-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomNav profile={profile} />
    </div>
  );
}
