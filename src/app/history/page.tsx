
"use client";

import TaskHistory from "@/components/TaskHistory";
import AuthWrapper from "@/components/AuthWrapper";
import HamburgerMenu from "@/components/HamburgerMenu";

function HistoryPageComponent() {
    return (
        <div className="flex flex-col h-screen">
            <header className="fixed top-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm border-b border-border/50 z-10">
                <div className="container mx-auto flex h-20 max-w-4xl items-center justify-between p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-xl font-bold font-headline text-foreground/80">Task History</h1>
                        <p className="text-sm text-muted-foreground">Review your accomplishments and progress.</p>
                    </div>
                    <HamburgerMenu />
                </div>
            </header>
            <main className="flex-1 overflow-y-auto pt-24 pb-20">
                <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
                    <TaskHistory />
                </div>
            </main>
        </div>
    );
}

export default function HistoryPage() {
    return (
        <AuthWrapper>
            <HistoryPageComponent />
        </AuthWrapper>
    );
}
