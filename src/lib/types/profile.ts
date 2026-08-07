export type UserRole = "medico" | "administrador";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  email: string | null;
  document_type: string | null;
  document_number: string | null;
  phone: string | null;
  specialty: string | null;
  created_at: string;
  updated_at: string;
};

export function isAdmin(profile: Pick<Profile, "role" | "is_active">): boolean {
  return profile.role === "administrador" && profile.is_active;
}
