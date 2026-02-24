
"use client";

import { useAuth } from "@/hooks/useAuth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-24 h-24 text-primary">
                <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="256" cy="256" r="240" stroke="currentColor" strokeWidth="20" />
                    <path d="M256 40V120" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                    <path d="M256 472V392" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                    <path d="M472 256H392" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                    <path d="M120 256H40" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                    <path d="M256 256L358 154" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                </svg>
            </div>
        </div>
    );
  }

  if (!user) {
    redirect("/auth");
  }

  return <>{children}</>;
}
