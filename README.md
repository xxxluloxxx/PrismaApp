# PrismaApp

Gestión de clínica odontológica.

Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase + PWA.

## Desarrollo

```bash
npm install
cp .env.example .env.local
# Completa las claves de tu proyecto Supabase
npm run dev
```

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo |
| `npm run build` | Build producción |
| `npm run start` | Servir build |
| `npm run lint` | ESLint |

## Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com/dashboard) (o pausa otro free-tier y crea PrismaApp).
2. Settings → API: copia URL, anon key y service_role a `.env.local`.
3. Aplica migraciones:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```
   Alternativa: pegar en orden los SQL de `supabase/migrations/` en el SQL Editor.
4. Crea el primer usuario en Authentication → Users, luego promueve admin:
   ```sql
   update public.profiles
   set role = 'administrador'
   where email = 'tu@correo.com';
   ```

## Fases

Ver `../Plan/Fases-Proyecto.md` y `../Plan/Modelo-Datos.md`.
