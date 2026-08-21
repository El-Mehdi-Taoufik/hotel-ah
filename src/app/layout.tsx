import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageInitializer } from "@/components/LanguageInitializer";

export const metadata: Metadata = {
  title: "Hotel Aguelmam | Hotel Reception Management",
  description: "Premium hotel reception and operations management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full antialiased dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <LanguageProvider>
            <LanguageInitializer>
              {children}
            </LanguageInitializer>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
