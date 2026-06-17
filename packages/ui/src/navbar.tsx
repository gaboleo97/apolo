"use client";

import { cn } from "./utils";

export function Navbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="search"
            placeholder="Buscar..."
            className="w-64 rounded-lg border border-border-input bg-background px-4 py-1.5 text-sm text-foreground placeholder:text-muted-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-white">
          Notificaciones
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            SA
          </div>
          <span className="text-sm text-foreground">Super Admin</span>
        </div>
      </div>
    </header>
  );
}
