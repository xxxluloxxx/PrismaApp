import {
  renderToBuffer,
  type DocumentProps,
} from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { NextResponse } from "next/server";

import {
  QuotePdfDocument,
  type QuotePdfData,
} from "@/lib/quotes/quote-pdf-document";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type { QuoteStatus } from "@/lib/types/quote";

const BUCKET = "quote-pdfs";
const SIGNED_TTL = 60 * 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, error: profileError } = await getCurrentProfile();

    if (profileError === "unauthenticated") {
      return NextResponse.json(
        { error: "Debes iniciar sesión para generar el PDF." },
        { status: 401 }
      );
    }

    if (!profile || !profile.is_active) {
      return NextResponse.json(
        { error: "No tienes permiso para generar el PDF." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(
        "id, patient_id, doctor_id, issue_date, status, currency, subtotal, tax_rate, tax_amount, total, notes"
      )
      .eq("id", id)
      .single();

    if (quoteError) {
      if (quoteError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Presupuesto no encontrado." },
          { status: 404 }
        );
      }
      console.error("GET /api/quotes/[id]/pdf quote:", quoteError);
      return NextResponse.json(
        { error: "No se pudo cargar el presupuesto." },
        { status: 500 }
      );
    }

    const [
      { data: items, error: itemsError },
      { data: patient, error: patientError },
      { data: doctor, error: doctorError },
      { data: clinic, error: clinicError },
      { data: payments, error: paymentsError },
    ] = await Promise.all([
      supabase
        .from("quote_items")
        .select(
          "treatment_id, description, quantity, unit_price, line_total, done"
        )
        .eq("quote_id", id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("patients")
        .select("first_name, last_name, document_id, phone, email, address")
        .eq("id", quote.patient_id)
        .single(),
      supabase
        .from("profiles")
        .select("full_name, specialty")
        .eq("id", quote.doctor_id)
        .single(),
      supabase
        .from("clinic_settings")
        .select("clinic_name, phone, email, address, currency")
        .eq("id", true)
        .single(),
      supabase.from("payments").select("amount").eq("quote_id", id),
    ]);

    if (
      itemsError ||
      patientError ||
      doctorError ||
      clinicError ||
      paymentsError
    ) {
      console.error("GET /api/quotes/[id]/pdf related:", {
        itemsError,
        patientError,
        doctorError,
        clinicError,
        paymentsError,
      });
      return NextResponse.json(
        { error: "No se pudieron cargar los datos del presupuesto." },
        { status: 500 }
      );
    }

    if (!patient || !doctor || !clinic) {
      return NextResponse.json(
        { error: "Faltan datos relacionados del presupuesto." },
        { status: 500 }
      );
    }

    const paid = (payments ?? []).reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const balance = Math.round((Number(quote.total) - paid) * 100) / 100;

    const pdfData: QuotePdfData = {
      id: String(quote.id),
      issue_date: String(quote.issue_date),
      status: quote.status as QuoteStatus,
      currency: String(quote.currency ?? "USD"),
      subtotal: Number(quote.subtotal),
      tax_rate: Number(quote.tax_rate),
      tax_amount: Number(quote.tax_amount),
      total: Number(quote.total),
      notes: (quote.notes as string | null) ?? null,
      paid,
      balance,
      clinic: {
        clinic_name: clinic.clinic_name ?? null,
        phone: clinic.phone ?? null,
        email: clinic.email ?? null,
        address: clinic.address ?? null,
      },
      patient: {
        first_name: patient.first_name,
        last_name: patient.last_name,
        document_id: patient.document_id ?? null,
        phone: patient.phone ?? null,
        email: patient.email ?? null,
        address: patient.address ?? null,
      },
      doctor: {
        full_name: doctor.full_name,
        specialty: doctor.specialty ?? null,
      },
      items: (items ?? []).map((item) => ({
        description: String(item.description),
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        line_total: Number(item.line_total),
        done: Boolean(item.done),
      })),
    };

    const pdfBuffer = await renderToBuffer(
      createElement(QuotePdfDocument, {
        data: pdfData,
      }) as unknown as ReactElement<DocumentProps>
    );

    const path = `${quote.id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("GET /api/quotes/[id]/pdf upload:", uploadError);
      return NextResponse.json(
        { error: "No se pudo guardar el PDF." },
        { status: 500 }
      );
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_TTL);

    if (signedError || !signed?.signedUrl) {
      console.error("GET /api/quotes/[id]/pdf signed url:", signedError);
      return NextResponse.json(
        { error: "No se pudo firmar la URL del PDF." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: signed.signedUrl,
      expiresIn: SIGNED_TTL,
    });
  } catch (err) {
    console.error("GET /api/quotes/[id]/pdf unexpected:", err);
    return NextResponse.json(
      { error: "No se pudo generar el PDF." },
      { status: 500 }
    );
  }
}
