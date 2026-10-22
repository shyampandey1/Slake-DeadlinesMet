"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { importRoutineFromDMFile } from '@/lib/dmFileHandler';
import { DMRoutineFileFormat } from '@/types/routineTuner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DMDropzoneProps {
  onRoutineImported: (routine: DMRoutineFileFormat) => void;
  className?: string;
}

export function DMDropzone({ onRoutineImported, className }: DMDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (!file.name.endsWith('.dm') && !file.name.endsWith('.json')) {
        throw new Error('Please select a valid .dm or .json routine container file');
      }

      const importedRoutine = await importRoutineFromDMFile(file);
      setStatusMessage({
        type: 'success',
        text: `Successfully verified "${importedRoutine.profileName}" by ${importedRoutine.author.displayName}!`,
      });
      onRoutineImported(importedRoutine);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to import routine file.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await handleProcessFile(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleProcessFile(file);
      // Reset input value so same file can be re-selected if desired
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all duration-200 text-center backdrop-blur-md',
        isDragging
          ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
          : 'border-border/60 hover:border-emerald-500/50 bg-background/40 hover:bg-muted/30',
        className
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".dm,.json,application/json"
        className="hidden"
      />

      <div className="p-3 mb-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : (
          <UploadCloud className="w-8 h-8" />
        )}
      </div>

      <h4 className="text-sm font-bold font-headline text-foreground mb-1">
        Import Portable <span className="text-emerald-400">.dm</span> Routine
      </h4>
      <p className="text-xs text-muted-foreground mb-4 max-w-xs">
        Drag & drop any <code className="text-emerald-400 font-mono">.dm</code> or{' '}
        <code className="text-emerald-400 font-mono">.json</code> schedule file, or browse from your device.
      </p>

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isLoading}
        onClick={() => fileInputRef.current?.click()}
        className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-2"
      >
        <FileText className="w-4 h-4" />
        Select File from Device
      </Button>

      {statusMessage && (
        <div
          className={cn(
            'mt-4 p-3 rounded-xl text-xs flex items-center gap-2 max-w-sm w-full transition-all',
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          )}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span className="leading-snug break-words">{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
}
