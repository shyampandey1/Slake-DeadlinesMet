
"use client";

import TaskForm from '@/components/TaskForm';
import AuthWrapper from '@/components/AuthWrapper';
import HamburgerMenu from '@/components/HamburgerMenu';
import { CheckCircle } from 'lucide-react';

function HomeComponent() {

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="absolute top-4 right-4 z-10">
        <HamburgerMenu />
      </div>
      <div className="w-full max-w-2xl mt-24">
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-10 h-10 text-yellow-500 flex-shrink-0" />
            <div>
              <h1 className="text-xl font-bold font-headline">DeadlinesMet</h1>
              <p className="text-muted-foreground sm:text-base">
                Focus on one task at a time. Set your goal and go.
              </p>
            </div>
          </div>
        </header>

        <section className="mb-8">
          <TaskForm />
        </section>
      </div>
    </main>
  );
}

export default function Home() {
    return (
        <AuthWrapper>
            <HomeComponent />
        </AuthWrapper>
    )
}
