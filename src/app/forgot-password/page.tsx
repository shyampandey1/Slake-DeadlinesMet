
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setEmailSent(true);
    } catch (error: any) {
      toast({
        title: "Error Sending Email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="w-full max-w-sm text-center overflow-hidden relative flex flex-col justify-center" style={{ minHeight: '520px' }}>
          <Button variant="ghost" className="absolute top-4 left-4 z-10" onClick={() => router.push('/auth')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
          
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Reset Password</CardTitle>
            <CardDescription>
                {emailSent 
                    ? "Check your inbox for a password reset link."
                    : "Enter your email to receive a password reset link."
                }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
                <Button onClick={() => router.push('/auth')} className="w-full">
                    Return to Login
                </Button>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" className="w-full !mt-6" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Send Reset Link
                        </Button>
                    </form>
                </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
