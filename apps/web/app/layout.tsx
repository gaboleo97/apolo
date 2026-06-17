import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Apolo - Plataforma de Gestión Empresarial",
  description: "Módulos de inventario, ventas, compras y contabilidad",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
