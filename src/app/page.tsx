
"use client";

import TaskForm from '@/components/TaskForm';
import AuthWrapper from '@/components/AuthWrapper';
import HamburgerMenu from '@/components/HamburgerMenu';
import { CheckCircle } from 'lucide-react';

function HomeComponent() {

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="absolute top-4 right-4 z-10">
        <HamburgerMenu />
      </div>
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <div className="flex justify-center items-center mb-4">
            <CheckCircle className="w-16 h-16 text-yellow-500" />
          </div>
          <p className="mt-2 text-muted-foreground sm:text-lg">
            Focus on one task at a time. Set your goal and go.
          </p>
        </header>

        <section className="mb-12">
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
