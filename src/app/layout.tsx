import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito, Space_Grotesk, Orbitron } from "next/font/google"; // Updated
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { ProfileProvider } from "@/hooks/useProfile";
import PageTransitionWrapper from "@/components/PageTransitionWrapper";
import { TimerUIProvider } from "@/hooks/useTimerUI";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunito = Nunito({
    variable: "--font-nunito",
    subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
    variable: "--font-space-grotesk",
    subsets: ["latin"],
});

const orbitron = Orbitron({
    variable: "--font-orbitron",
    subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeadlinesMet",
  description: "Your personal space to conquer tasks and achieve goals.",
};

import { ThemeProvider } from "@/hooks/useTheme";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} ${spaceGrotesk.variable} ${orbitron.variable} antialiased selection:bg-primary/30 min-h-screen overflow-x-hidden`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <AuthProvider>
                <ProfileProvider>
                    <TimerUIProvider>
                        <PageTransitionWrapper>
                            {children}
                        </PageTransitionWrapper>
                        <BottomNav />
                    </TimerUIProvider>
                    <Toaster />
                    <ServiceWorkerRegistrar />
                </ProfileProvider>
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
