
"use client";

import TaskForm from '@/components/TaskForm';
import AuthWrapper from '@/components/AuthWrapper';
import HamburgerMenu from '@/components/HamburgerMenu';

function HomeComponent() {

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border/50">
          <div className="container mx-auto flex h-16 max-w-4xl items-center justify-between p-4 sm:p-6 md:p-8">
            <div>
              <h1 className="text-xl font-bold font-headline text-foreground/80">DeadlinesMet</h1>
              <p className="text-sm text-muted-foreground">Focus on one task at a time. Set your goal and go.</p>
            </div>
            <HamburgerMenu />
          </div>
        </header>
      <main className="container mx-auto flex flex-col items-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl mt-8">
          <section className="mb-8">
            <TaskForm />
          </section>
        </div>
      </main>
    </>
  );
}

export default function Home() {
    return (
        <AuthWrapper>
            <HomeComponent />
        </AuthWrapper>
    )
}
