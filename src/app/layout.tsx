import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/useAuth';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'DeadlinesMet',
  description: 'Meet your deadlines, one task at a time.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&family=Orbitron:wght@700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
        <Script id="firebase-analytics" strategy="afterInteractive">
          {`
            // Import the functions you need from the SDKs you need
            import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
            import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
            // TODO: Add SDKs for Firebase products that you want to use
            // https://firebase.google.com/docs/web/setup#available-libraries

            // Your web app's Firebase configuration
            // For Firebase JS SDK v7.20.0 and later, measurementId is optional
            const firebaseConfig = {
              apiKey: "AIzaSyARe1wX5bw7-zbpFAq77HKNJ3vyG_Jsiew",
              authDomain: "deadlinesmet.firebaseapp.com",
              projectId: "deadlinesmet",
              storageBucket: "deadlinesmet.firebasestorage.app",
              messagingSenderId: "248085678271",
              appId: "1:248085678271:web:b39ac7355a636cfe91de0a",
              measurementId: "G-W18284JYFB"
            };

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            if (typeof window !== 'undefined') {
              const analytics = getAnalytics(app);
            }
          `}
        </Script>
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
