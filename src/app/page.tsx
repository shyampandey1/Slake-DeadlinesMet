"use client";

import TaskForm from '@/components/TaskForm';
import TaskHistory from '@/components/TaskHistory';
import AuthWrapper from '@/components/AuthWrapper';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

function HomeComponent() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <span className='text-sm text-muted-foreground'>Hello, {user?.email}</span>
        <Button onClick={handleLogout} variant="outline" size="sm">Logout</Button>
      </div>
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            DeadlinesMet
          </h1>
          <p className="mt-2 text-muted-foreground sm:text-lg">
            Focus on one task at a time. Set your goal and go.
          </p>
        </header>

        <section className="mb-12">
          <TaskForm />
        </section>

        <section>
          <TaskHistory />
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
