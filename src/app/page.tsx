
"use client";

import { useState, useEffect } from 'react';
import TaskForm from '@/components/TaskForm';
import AuthWrapper from '@/components/AuthWrapper';
import DynamicHeader from '@/components/DynamicHeader';

function HomeComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="relative">
          <DynamicHeader currentDate={currentDate} />
          <div className="container mx-auto p-4 sm:p-6 md:p-8 relative z-10 -mt-32">
            <div className="w-full max-w-4xl mx-auto">
              <TaskForm />
            </div>
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
