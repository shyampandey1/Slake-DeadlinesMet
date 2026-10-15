"use client";

import TaskHistory from "@/components/TaskHistory";
import AuthWrapper from "@/components/AuthWrapper";
import HamburgerMenu from "@/components/HamburgerMenu";

function AnalyticsPageComponent() {
    return (
        <div className="flex flex-col h-screen">
            <header className="fixed top-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm border-b border-border/50 z-10">
                <div className="w-full flex h-20 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-xl sm:text-2xl font-bold font-headline text-foreground/90">Analytics &amp; Neural Memory Bank</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">Log Book, Scribing Journal, and Semantic Behavioral Insights.</p>
                    </div>
                    <HamburgerMenu />
                </div>
            </header>
            <main className="flex-1 overflow-y-auto overflow-x-hidden pt-24 pb-20 min-w-0">
                <div className="w-full max-w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4 min-w-0 overflow-x-hidden">
                    <TaskHistory />
                </div>
            </main>
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <AuthWrapper>
            <AnalyticsPageComponent />
        </AuthWrapper>
    );
}
