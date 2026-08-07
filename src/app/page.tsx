export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <div className="max-w-lg text-center">
        <p className="text-sm font-medium tracking-wide text-teal-700 uppercase dark:text-teal-400">
          PrismaApp
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Clínica odontológica
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Esqueleto inicial. Si ves esta página en Vercel, el deploy funciona.
        </p>
      </div>
    </main>
  );
}
