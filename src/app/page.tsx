import TaskForm from '@/components/TaskForm';
import TaskHistory from '@/components/TaskHistory';

export default function Home() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
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
