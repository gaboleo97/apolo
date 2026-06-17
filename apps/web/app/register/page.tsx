import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-surface p-8 glow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <span className="text-xl font-bold text-white">A</span>
            </div>
            <h1 className="text-xl font-bold text-white">Crear cuenta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Comenzá con tu prueba gratuita
            </p>
          </div>

          <form className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1.5 block w-full rounded-lg border border-border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1.5 block w-full rounded-lg border border-border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1.5 block w-full rounded-lg border border-border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover glow-sm"
            >
              Crear cuenta gratis
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="font-medium text-accent hover:text-accent-light transition-colors">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
