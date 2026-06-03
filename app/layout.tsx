import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import { AppProvider } from "@/providers/app-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Progress Tracker",
  description: "A calm, local-first PWA for two friends tracking weight, meals, and workouts.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <PwaRegister />
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
