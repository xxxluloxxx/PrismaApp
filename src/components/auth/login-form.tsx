"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("email not confirmed")
  ) {
    return "Correo o contraseña incorrectos";
  }
  if (lower.includes("too many requests") || lower.includes("rate")) {
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo";
  }
  return "No pudimos iniciar sesión. Inténtalo de nuevo";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(mapAuthError(signInError.message));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("No pudimos iniciar sesión. Inténtalo de nuevo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          placeholder="tu@clinica.com"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          placeholder="••••••••"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Iniciando sesión…
          </>
        ) : (
          "Iniciar sesión"
        )}
      </Button>
    </form>
  );
}
