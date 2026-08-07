import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/supabase/profile";
import { createServiceClient } from "@/lib/supabase/service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { profile, error } = await getCurrentProfile();

    if (
      error === "unauthenticated" ||
      !profile ||
      profile.role !== "administrador" ||
      !profile.is_active
    ) {
      return NextResponse.json(
        { error: "No tienes permiso para realizar esta acción." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      full_name?: unknown;
      email?: unknown;
      password?: unknown;
      specialty?: unknown;
      phone?: unknown;
      role?: unknown;
    };

    const fullName =
      typeof body.full_name === "string" ? body.full_name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const specialty =
      typeof body.specialty === "string" ? body.specialty.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const role =
      body.role === "administrador" || body.role === "medico"
        ? body.role
        : "medico";

    if (!fullName) {
      return NextResponse.json(
        { error: "El nombre completo es obligatorio." },
        { status: 400 }
      );
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "El correo electrónico no es válido." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();
    const { data, error: createError } =
      await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (createError || !data.user) {
      const message = createError?.message?.toLowerCase() ?? "";
      if (
        message.includes("already") ||
        createError?.code === "email_exists"
      ) {
        return NextResponse.json(
          { error: "Ya existe una cuenta con ese correo." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "No se pudo crear la cuenta." },
        { status: 500 }
      );
    }

    const { error: profileError } = await serviceClient
      .from("profiles")
      .update({
        full_name: fullName,
        role,
        specialty: specialty || null,
        phone: phone || null,
      })
      .eq("id", data.user.id);

    if (profileError) {
      console.error("POST /api/staff profile update:", profileError);
    }

    return NextResponse.json(
      { id: data.user.id, email, full_name: fullName, role },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/staff unexpected:", err);
    return NextResponse.json(
      { error: "No se pudo crear la cuenta." },
      { status: 500 }
    );
  }
}
