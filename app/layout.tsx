import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Nexus Portal",
  description: "Le Nexus Connecté – Formulaire Intelligent",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-bg app-gradient min-h-screen">{children}</body>
    </html>
  );
}
