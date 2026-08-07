# Arquitectura — PrismaApp

## Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui
- **Backend de datos:** Supabase (Auth, Postgres, Storage, Realtime)
- **Hosting:** Vercel
- **PWA:** `public/manifest.json` + `public/sw.js`

## Carpetas

```
src/app/(app)/          # Rutas autenticadas
src/app/(app)/(admin)/  # Solo administrador
src/app/login/          # Auth
src/app/api/staff/      # Alta de staff (service role)
src/components/         # UI por dominio
src/lib/supabase/       # Clientes y queries
src/lib/*/actions.ts    # Server Actions
src/proxy.ts            # Guard de sesión
supabase/migrations/    # Fuente de verdad del esquema
```

## Roles

| Rol | Acceso |
|-----|--------|
| `administrador` | Todo + Equipo, Tratamientos, Configuración |
| `medico` | Pacientes, agenda, fichas, odontograma, presupuestos |

## Flujo de negocio

Paciente → Cita → Ficha (+ imágenes) → Odontograma → Presupuesto → Pagos → Dashboard

## Migraciones

Aplicar en orden `0001`…`0009` con `supabase db push` o SQL Editor.

## Bootstrap admin

```sql
update public.profiles
set role = 'administrador'
where email = 'tu@correo.com';
```

## Seguridad

- RLS en todas las tablas de negocio
- Storage `clinical-images` privado + URLs firmadas
- Service role solo en `/api/staff`
- Conflictos de edición: gana el servidor (`updated_at`)

## Alcance abierto (no MVP)

SRI / facturación electrónica, multi-clínica, PDF firmado, push VAPID, rol recepcionista, calendario visual mes completo.
