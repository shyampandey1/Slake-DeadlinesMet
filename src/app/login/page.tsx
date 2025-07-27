
"use client";

import { redirect, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            redirect('/');
        }
    }, [user, loading]);

    if(loading || user) {
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <LoginForm onBack={() => router.push('/auth')} />
            </Card>
        </main>
    )
}
