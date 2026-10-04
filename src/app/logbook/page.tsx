"use client";

import TaskHistory from "@/components/TaskHistory";
import AuthWrapper from "@/components/AuthWrapper";
import HamburgerMenu from "@/components/HamburgerMenu";

export default function LogBookPage() {
  return (
    <AuthWrapper>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="fixed top-0 left-0 right-0 w-full bg-background/80 backdrop-blur-md border-b border-border/50 z-20">
          <div className="w-full flex h-20 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl sm:text-2xl font-black font-headline text-foreground tracking-tight">
                Log Book
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Review your accomplishments, habit matrix, and dynamic behavioral insights.
              </p>
            </div>
            <HamburgerMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pt-24 pb-24">
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4">
            <TaskHistory />
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
}
