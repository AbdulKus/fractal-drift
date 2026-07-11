import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fractal Drift — Infinite 3D Worlds",
  description: "Fly through procedural 3D fractals, liminal spaces, lattices and custom GLSL distance fields.",
  other: {
    "codex-preview": "development",
  },
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
