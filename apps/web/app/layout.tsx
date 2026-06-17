import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Apolo - Plataforma de Gestión Empresarial Modular",
  description:
    "Inventario, ventas, compras, contabilidad y facturación electrónica. Módulos activables para tu empresa.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
