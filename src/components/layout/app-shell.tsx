"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

import { navForProfile } from "@/components/layout/nav-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function NavLinks({
  profile,
  onNavigate,
}: {
  profile: Profile;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = navForProfile(profile);

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
            )}
          >
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

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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
          <NavLinks profile={profile} />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b px-4 py-3 lg:px-6">
          <Sheet>
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
                <SheetTitle className="font-heading">PrismaApp</SheetTitle>
              </SheetHeader>
              <div className="p-3">
                <NavLinks profile={profile} />
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
        </header>
        <main className="flex flex-1 flex-col p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
