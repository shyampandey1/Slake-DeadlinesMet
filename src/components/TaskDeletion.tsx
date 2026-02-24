
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import AnimatedTrashIcon from "./AnimatedTrashIcon";
import type { UserPresetTask } from "@/types";

interface TaskDeletionProps {
  onConfirmDelete: () => Promise<void>;
  isDefault: boolean;
}

export default function TaskDeletion({ onConfirmDelete, isDefault }: TaskDeletionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete();
      // The parent component will handle unmounting this component on successful deletion.
    } catch (error) {
      console.error("Failed to delete task:", error);
      setIsDeleting(false); // Reset on error
    }
  };

  const slideDown = {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: "0%", opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
    transition: { type: "spring", stiffness: 300, damping: 30 },
  };

  if (isDefault) {
    return null; // Don't show delete UI for default tasks
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={slideDown}
        initial="initial"
        animate="animate"
        exit="exit"
        className="absolute inset-x-0 bottom-0 top-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm p-2 rounded-lg"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Button
          variant="destructive"
          className="h-full w-full flex items-center justify-center text-lg gap-3"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <>
              <AnimatedTrashIcon isHovered={isHovered} />
              <span>Delete</span>
            </>
          )}
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
