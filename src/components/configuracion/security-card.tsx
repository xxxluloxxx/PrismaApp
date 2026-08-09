"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function SecurityCard() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function resetFields() {
    setPassword("");
    setConfirm("");
    setPasswordError(null);
    setConfirmError(null);
    setFormError(null);
  }

  function handleOpenChange(next: boolean) {
    if (saving) return;
    setOpen(next);
    if (!next) resetFields();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setConfirmError(null);
    setFormError(null);

    let valid = true;
    if (password.length < 8) {
      setPasswordError("Mínimo 8 caracteres");
      valid = false;
    }
    if (password !== confirm) {
      setConfirmError("Las contraseñas no coinciden");
      valid = false;
    }
    if (!valid) return;

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setFormError(error.message || "No se pudo actualizar la contraseña");
      return;
    }

    toast.success("Contraseña actualizada");
    setOpen(false);
    resetFields();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>Cambia la contraseña de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Contraseña</p>
              <p className="text-sm text-muted-foreground">••••••••</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(true)}
            >
              Cambiar contraseña
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={!saving}>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              Elige una contraseña nueva de al menos 8 caracteres.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                disabled={saving}
                autoComplete="new-password"
              />
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (confirmError) setConfirmError(null);
                }}
                disabled={saving}
                autoComplete="new-password"
              />
              {confirmError && (
                <p className="text-xs text-destructive">{confirmError}</p>
              )}
            </div>
            {formError && (
              <p className="text-xs text-destructive">{formError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Actualizar contraseña
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
