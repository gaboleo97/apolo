"use client";

import { useState } from "react";
import { cn } from "./utils";
import Link from "next/link";

const menuItems = [
  { icon: "📊", label: "Dashboard", href: "/" },
  { icon: "📦", label: "Inventario", href: "/inventory" },
  { icon: "🛒", label: "Ventas", href: "/sales" },
  { icon: "📋", label: "Compras", href: "/purchases" },
  { icon: "🤝", label: "Proveedores", href: "/suppliers" },
  { icon: "💰", label: "Caja", href: "/cash" },
  { icon: "📊", label: "Contabilidad", href: "/accounting" },
  { icon: "⚡", label: "ARCA", href: "/arca" },
  { icon: "🤖", label: "AI Analytics", href: "/ai" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-surface transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
          <span className="text-sm font-bold text-white">A</span>
        </div>
        {!collapsed && <span className="text-base font-bold text-white">Apolo</span>}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-hover hover:text-white",
              collapsed && "justify-center px-2"
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-hover hover:text-white"
        >
          {collapsed ? "→" : "← Colapsar"}
        </button>
      </div>
    </aside>
  );
}
