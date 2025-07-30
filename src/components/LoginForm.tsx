
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { mockLogin } from "@/lib/mockAuth";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { TriangleAlert } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

interface LoginFormProps {
    onBack?: () => void;
}

export default function LoginForm({ onBack }: LoginFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth();
  const { setMockUser, setIsOffline } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push("/");
    } catch (error: any) {
        console.warn("Firebase login failed:", error.message);
        
        // Specific check for database not existing error
        if (error.code === 'failed-precondition' || error.message.includes('database')) {
             const mockUser = mockLogin("user@test.com", "password123");
             if (mockUser) {
                setMockUser(mockUser);
                setIsOffline(true);
                router.push("/");
                toast({
                    title: "Switched to Guest Mode",
                    description: "Firebase is unavailable. You are using the app with local data.",
                });
                return;
             }
        }
        
        // General fallback for other auth errors
        const mockUser = mockLogin(values.email, values.password);
        if (mockUser) {
            setMockUser(mockUser);
            router.push("/");
            toast({
                title: "Using Mock Login",
                description: "Firebase is unavailable. You are logged in with a temporary local account.",
            });
        } else {
             toast({
                title: "Login Failed",
                description: "The credentials provided are invalid for both Firebase and the local fallback.",
                variant: "destructive",
            });
        }
    }
  }

  return (
    <div className="flex flex-col justify-center h-full">
      <CardHeader className="pt-12">
        <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
        <CardDescription>Log in to your DeadlinesMet account.</CardDescription>
      </CardHeader>
      <CardContent>
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-right">
                <Button variant="link" type="button" className="p-0 h-auto text-xs">
                    Forgot Password?
                </Button>
            </div>
            <Button type="submit" className="w-full !mt-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              Log In
            </Button>
          </form>
        </Form>
      </CardContent>
    </div>
  );
}
