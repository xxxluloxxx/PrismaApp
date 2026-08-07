export type ClinicSettings = {
  id: boolean;
  clinic_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
  tax_rate: number;
  currency: string;
  business_hours: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
};

export type ClinicSettingsUpdate = Partial<
  Pick<
    ClinicSettings,
    | "clinic_name"
    | "phone"
    | "email"
    | "address"
    | "timezone"
    | "tax_rate"
    | "currency"
    | "business_hours"
  >
> & {
  updated_by?: string | null;
};
