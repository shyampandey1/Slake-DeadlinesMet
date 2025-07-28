
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User, X, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ScrollArea } from "./ui/scroll-area";
import TaskHistory from "./TaskHistory";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


export default function HamburgerMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    setIsOpen(false);
    await auth.signOut();
    router.push('/auth');
  };
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" onClick={toggleMenu}>
           {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline text-2xl">Menu</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          {user && (
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3 mb-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground truncate">
                {user.email}
              </span>
            </div>
          )}
        </div>
        <ScrollArea className="flex-1 pr-4">
             <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger>
                        <div className="flex items-center gap-2">
                           <History className="h-5 w-5" />
                           <span>Task History</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <TaskHistory />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </ScrollArea>
        <SheetFooter className="mt-auto pt-4">
          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
