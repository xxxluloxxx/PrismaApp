"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function subscribe() {
  return () => {};
}

function useHasMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const;

export function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const mounted = useHasMounted();
  const active = mounted ? (theme ?? "system") : "system";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apariencia</CardTitle>
        <CardDescription>Tema claro, oscuro o el del sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/40 p-1"
          role="group"
          aria-label="Tema de la interfaz"
        >
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
            const selected = active === value;
            return (
              <Button
                key={value}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 gap-1.5",
                  selected &&
                    "bg-background text-foreground shadow-sm hover:bg-background"
                )}
                aria-pressed={selected}
                onClick={() => setTheme(value)}
              >
                <Icon className="size-3.5" />
                {label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
