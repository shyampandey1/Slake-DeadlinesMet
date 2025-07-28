
"use client";

import TaskForm from '@/components/TaskForm';
import AuthWrapper from '@/components/AuthWrapper';
import HamburgerMenu from '@/components/HamburgerMenu';
import InfoDisplay from '@/components/InfoDisplay';

function HomeComponent() {

  return (
    <>
      <InfoDisplay />
      <main className="container mx-auto flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
        <header className="w-full max-w-4xl flex justify-between items-center mb-12 mt-4">
          <h1 className="text-xl font-bold font-headline text-foreground/80">DeadlinesMet</h1>
          <HamburgerMenu />
        </header>

        <div className="w-full max-w-4xl">
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
