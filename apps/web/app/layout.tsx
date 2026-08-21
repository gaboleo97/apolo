import type { Metadata } from "next";
import { ThemeRegistry } from "@apolo/ui";
import Providers from "./providers";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

export const metadata: Metadata = {
  title: "Apolo - Plataforma de Gestión Empresarial Modular",
  description:
    "Inventario, ventas, compras, contabilidad y facturación electrónica. Módulos activables para tu empresa.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <ThemeRegistry>{children}</ThemeRegistry>
        </Providers>
      </body>
    </html>
  );
}
