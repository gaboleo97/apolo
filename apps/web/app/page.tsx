import Link from "next/link";

const modules = [
  {
    icon: "📦",
    title: "Inventario",
    desc: "Control de stock, productos y categorías con alertas inteligentes",
  },
  {
    icon: "🛒",
    title: "Ventas",
    desc: "Punto de venta, facturación electrónica y gestión de clientes",
  },
  {
    icon: "📋",
    title: "Compras",
    desc: "Órdenes de compra, proveedores y pagos automatizados",
  },
  {
    icon: "📊",
    title: "Contabilidad",
    desc: "Libros IVA, asientos contables y reportes financieros",
  },
  {
    icon: "🤖",
    title: "AI Analytics",
    desc: "Predicciones de demanda y detección de anomalías",
  },
  {
    icon: "🌎",
    title: "Multi-país",
    desc: "ARCA, SAT, DIAN y más integraciones fiscales",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <span className="text-lg font-bold text-white">Apolo</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-all hover:bg-accent-hover glow-sm"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-radial opacity-40" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm text-accent-light">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Plataforma modular para empresas
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Gestiona tu empresa con
            <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent"> módulos inteligentes</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Inventario, ventas, compras, contabilidad y facturación electrónica.
            Activa solo los módulos que necesites y escala cuando quieras.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-accent px-8 py-3 text-base font-medium text-white transition-all hover:bg-accent-hover glow"
            >
              Comenzar gratis
            </Link>
            <Link
              href="#modulos"
              className="rounded-lg border border-border bg-surface px-8 py-3 text-base font-medium text-white transition-all hover:bg-surface-hover"
            >
              Ver módulos
            </Link>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" className="relative px-6 pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Módulos para cada área
            </h2>
            <p className="mt-4 text-muted-foreground">
              Activá solo lo que necesitás. Pagá solo por lo que usás.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod) => (
              <div
                key={mod.title}
                className="group rounded-xl border border-border bg-surface p-6 transition-all hover:border-accent/30 hover:bg-surface-hover hover:glow-sm"
              >
                <span className="text-3xl">{mod.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-white">{mod.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-12">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          <p>© 2026 Apolo. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
