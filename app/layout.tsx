import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Otra Vuelta · Segunda mano, nuevas historias",
  description: "Descubrí piezas únicas de segunda mano y reservá tus favoritas.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
