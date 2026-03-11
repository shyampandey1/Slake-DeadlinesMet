"use client";

import React, { useState, useEffect } from "react";
import DynamicHeader from "@/components/DynamicHeader";
import TaskForm from "@/components/TaskForm";
import AuthWrapper from "@/components/AuthWrapper";

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <AuthWrapper>
      <div className="flex flex-col min-h-screen bg-background pb-20">
        <DynamicHeader currentDate={currentDate} />
        <main className="flex-1 w-full max-w-4xl mx-auto p-6 sm:p-8 md:p-10 -mt-36 relative z-10">
          <TaskForm />
        </main>
      </div>
    </AuthWrapper>
  );
}
