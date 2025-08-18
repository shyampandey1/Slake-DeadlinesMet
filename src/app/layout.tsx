
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/useAuth';
import BottomNav from '@/components/BottomNav';
import { ThemeProvider } from '@/hooks/useTheme';
import { ProfileProvider } from '@/hooks/useProfile';
import { TimerUIProvider } from '@/hooks/useTimerUI';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'DeadlinesMet',
  description: 'Meet your deadlines, one task at a time.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&family=Orbitron:wght@700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="font-body antialiased select-none">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ProfileProvider>
                <TimerUIProvider>
                    <div className="flex flex-col min-h-screen">
                        <ServiceWorkerRegistrar />
                        <main className="flex-1 pb-16">{children}</main>
                        <BottomNav />
                    </div>
                </TimerUIProvider>
            </ProfileProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
