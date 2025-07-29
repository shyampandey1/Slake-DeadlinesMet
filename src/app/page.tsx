
"use client";

import TaskForm from '@/components/TaskForm';
import AuthWrapper from '@/components/AuthWrapper';
import HamburgerMenu from '@/components/HamburgerMenu';

function HomeComponent() {

  return (
    <div className="flex flex-col h-screen">
      <header className="fixed top-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm border-b border-border/50 z-10">
          <div className="container mx-auto flex h-16 max-w-4xl items-center justify-between p-4 sm:p-6 md:p-8">
            <div>
              <h1 className="text-xl font-bold font-headline text-foreground/80">DeadlinesMet</h1>
              <p className="text-sm text-muted-foreground">Focus on one task at a time. Set your goal and go.</p>
            </div>
            <HamburgerMenu />
          </div>
        </header>
      <main className="flex-1 overflow-y-auto pt-16 pb-20">
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-4xl mx-auto">
              <TaskForm />
            </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
    return (
        <AuthWrapper>
            <HomeComponent />
        </AuthWrapper>
    )
}
