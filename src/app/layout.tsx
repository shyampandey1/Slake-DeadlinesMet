import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { ProfileProvider } from "@/hooks/useProfile";
import PageTransitionWrapper from "@/components/PageTransitionWrapper";
import { TimerUIProvider } from "@/hooks/useTimerUI";
import { TimerProvider } from "@/hooks/useActiveTimer";
import HardwareBackHandler from "@/components/HardwareBackHandler";
import NotificationScheduler from "@/components/NotificationScheduler";
import FloatingTimer from "@/components/FloatingTimer";
import AgentDM from "@/components/voice/AgentDM";
import { VoiceProvider } from "@/hooks/useVoiceController";
import { ThemeProvider } from "@/hooks/useTheme";
import CoReformerSyncWatcher from "@/components/CoReformerSyncWatcher";

export const metadata: Metadata = {
  title: "DeadlinesMet",
  description: "Your personal space to conquer tasks and achieve goals.",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DeadlinesMet',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased selection:bg-primary/30 min-h-screen overflow-x-hidden font-body"
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <AuthProvider>
                <ProfileProvider>
                    <TimerUIProvider>
                        <TimerProvider>
                            <VoiceProvider>
                                <HardwareBackHandler />
                                <CoReformerSyncWatcher />
                                <AgentDM />
                                <PageTransitionWrapper>
                                    {children}
                                </PageTransitionWrapper>
                                <BottomNav />
                                <NotificationScheduler />
                                <FloatingTimer />
                            </VoiceProvider>
                        </TimerProvider>
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
