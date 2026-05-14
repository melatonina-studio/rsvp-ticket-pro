import { loginAction } from "./actions";

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function errorMessage(error?: string) {
  if (error === "missing") return "Inserisci email e password.";
  if (error === "invalid") return "Credenziali non valide.";
  return "";
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const message = errorMessage(params.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/50">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
            SOTTOSUOLO ADMIN
          </div>

          <h1 className="mt-3 text-3xl font-black">Login</h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Accedi alla dashboard amministrativa della piattaforma.
          </p>
        </div>

        {message ? (
          <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {message}
          </div>
        ) : null}

        <form action={loginAction} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            Accedi
          </button>
        </form>
      </div>
    </main>
  );
}