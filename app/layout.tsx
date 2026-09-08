import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050508",
};

export const metadata: Metadata = {
  title: "GAZIOAI",
  description: "GAZIOAI — your AI assistant",
  applicationName: "GAZIOAI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GAZIOAI",
  },
  formatDetection: { telephone: false },
  manifest: "/manifest.json",

  icons: {
    icon: [
      {
        url: "/launchericon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/launchericon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/launchericon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${ibmPlexMono.variable} antialiased`}>
        <TooltipProvider>{children}</TooltipProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
