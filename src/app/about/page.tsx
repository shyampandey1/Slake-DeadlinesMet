
"use client";

import AuthWrapper from "@/components/AuthWrapper";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building, Target } from "lucide-react";

function AboutPageComponent() {
    return (
        <div className="flex flex-col h-screen">
            <header className="fixed top-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm border-b border-border/50 z-10">
                <div className="container mx-auto flex h-20 max-w-4xl items-center justify-between p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-xl font-bold font-headline text-foreground/80">About the Developer</h1>
                        <p className="text-sm text-muted-foreground">Learn more about the creators of DeadlinesMet.</p>
                    </div>
                    <HamburgerMenu />
                </div>
            </header>
            <main className="flex-1 overflow-y-auto pt-24 pb-20">
                <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl space-y-8">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex justify-center items-center mb-4 text-primary">
                                <Building className="h-16 w-16" />
                            </div>
                            <CardTitle className="font-headline text-3xl">Slake Corporation</CardTitle>
                            <CardDescription className="text-lg">Engineered for Efficiency. From Complex Systems to Your Daily Focus.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 text-foreground/90">
                            <div>
                                <h2 className="font-headline text-xl mb-2">Our Story</h2>
                                <p className="text-muted-foreground">
                                    At Slake Corporation, our journey began by mastering high-efficiency systems. For years, we have been at the forefront of helping complex operations become more streamlined and intelligent by identifying bottlenecks, eliminating friction, and engineering systems that work seamlessly to achieve maximum output.
                                </p>
                                <br/>
                                <p className="text-muted-foreground">
                                    After mastering the automation of large-scale processes, we turned our attention to the most crucial system of all: the human routine. We realized the same principles of task management and efficiency could be applied to supercharge an individual's personal and professional life.
                                </p>
                                <br/>
                                <p className="text-muted-foreground">
                                    This vision led to the creation of DeadlinesMet. It is more than just a productivity app; it is the culmination of our expertise in automation, redesigned for personal workflow. We've engineered a tool that helps you automate your focus, structure your day, and take command of your time, proving that a more efficient future starts with a more productive you.
                                </p>
                            </div>

                             <div className="p-6 rounded-lg bg-card border flex items-start gap-4">
                                <Target className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <h2 className="font-headline text-xl mb-2">Our Mission</h2>
                                    <blockquote className="text-muted-foreground italic">
                                        "To empower individuals and organizations to achieve peak efficiency and unlock their full potential through intelligent and intuitive automation solutions."
                                    </blockquote>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}


export default function AboutPage() {
    return (
        <AuthWrapper>
            <AboutPageComponent />
        </AuthWrapper>
    )
}
