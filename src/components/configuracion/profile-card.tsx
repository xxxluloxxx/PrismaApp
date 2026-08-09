"use client";

import { Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { updateOwnProfile } from "@/lib/supabase/own-profile";
import type { Profile } from "@/lib/types/profile";
import { cn } from "@/lib/utils";

export function ProfileCard({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [savedFullName, setSavedFullName] = useState(profile.full_name);
  const [savedPhone, setSavedPhone] = useState(profile.phone ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty =
    fullName.trim() !== savedFullName.trim() ||
    phone.trim() !== savedPhone.trim();

  async function handleSave() {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setNameError("El nombre es obligatorio");
      return;
    }
    setNameError(null);
    setSaving(true);

    const nextPhone = phone.trim() === "" ? null : phone.trim();
    const supabase = createClient();
    const result = await updateOwnProfile(supabase, {
      full_name: trimmedName,
      phone: nextPhone,
    });

    setSaving(false);

    if (result.error || !result.profile) {
      toast.error(result.message ?? "No se pudo actualizar el perfil");
      return;
    }

    setFullName(result.profile.full_name);
    setPhone(result.profile.phone ?? "");
    setSavedFullName(result.profile.full_name);
    setSavedPhone(result.profile.phone ?? "");
    toast.success("Perfil actualizado");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Tu nombre y teléfono de contacto</CardDescription>
      </CardHeader>
      <CardContent
        className={cn("space-y-4", saving && "pointer-events-none opacity-80")}
      >
        <div className="space-y-2">
          <Label htmlFor="profile-full-name">Nombre completo</Label>
          <Input
            id="profile-full-name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (nameError) setNameError(null);
            }}
            disabled={saving}
            autoComplete="name"
          />
          {nameError && (
            <p className="text-xs text-destructive">{nameError}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-phone">Teléfono</Label>
          <Input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+593 99 999 9999"
            disabled={saving}
            autoComplete="tel"
          />
        </div>
        <div className="space-y-1">
          <Label className="flex items-center gap-1.5 text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            Correo electrónico
          </Label>
          <p className="text-sm text-muted-foreground">
            {profile.email ?? "—"}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          disabled={!dirty || saving}
          onClick={() => void handleSave()}
        >
          {saving && <Loader2 className="animate-spin" />}
          Guardar cambios
        </Button>
      </CardFooter>
    </Card>
  );
}
