// src/components/create-post/formatting-toolbar.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bold, Italic, Underline, ImagePlus, Link as LinkIcon, List, ListOrdered, Quote, Code } from 'lucide-react';

interface FormattingToolbarProps {
  onCommand: (command: string) => void; // For future rich text editor integration
}

export function FormattingToolbar({ onCommand }: FormattingToolbarProps) {
  const handleButtonClick = (command: string) => {
    console.log(`Formatting command: ${command}`);
    onCommand(command);
    // In a real implementation, this would interact with a rich text editor
  };

  return (
    <div className="bg-card border-b sticky top-[65px] z-40"> {/* Assuming header height is ~65px */}
      <div className="container mx-auto px-4 py-2 flex items-center gap-1 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => handleButtonClick('bold')} title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleButtonClick('italic')} title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleButtonClick('underline')} title="Underline">
          <Underline className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button variant="ghost" size="sm" onClick={() => handleButtonClick('bulletList')} title="Bulleted List">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleButtonClick('orderedList')} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button variant="ghost" size="sm" onClick={() => handleButtonClick('blockquote')} title="Blockquote">
          <Quote className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleButtonClick('codeBlock')} title="Code Block">
          <Code className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button variant="ghost" size="sm" onClick={() => handleButtonClick('insertImage')} title="Insert Image">
          <ImagePlus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleButtonClick('insertLink')} title="Insert Link">
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
