// src/components/create-post/formatting-toolbar.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  ImagePlus as ImagePlusIcon,
  Link as LinkIconLucide,
  Code2 as CodeBlockCurlyIcon, // Changed icon
  Minus,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';

interface FormattingToolbarProps {
  editor: Editor | null;
  isForAdmin?: boolean;
  onCommand: (command: string) => void; 
}

export function FormattingToolbar({ editor, isForAdmin = false, onCommand }: FormattingToolbarProps) {
  const isActive = (format: string, opts?: any) => {
    if (!editor) return false;
    return editor.isActive(format, opts);
  };

  const handleButtonClick = (command: string, isTiptapCommand = true) => {
    if (!editor && isTiptapCommand) return;

    if (isTiptapCommand && editor) {
      const chain = editor.chain().focus();
      switch (command) {
        case 'bold': chain.toggleBold().run(); break;
        case 'italic': chain.toggleItalic().run(); break;
        case 'underline': chain.toggleUnderline().run(); break;
        case 'h1': chain.toggleHeading({ level: 1 }).run(); break;
        case 'h2': chain.toggleHeading({ level: 2 }).run(); break;
        case 'h3': chain.toggleHeading({ level: 3 }).run(); break;
        case 'paragraph': chain.setParagraph().run(); break;
        case 'bulletList': chain.toggleBulletList().run(); break;
        case 'orderedList': chain.toggleOrderedList().run(); break;
        case 'horizontalRule': chain.setHorizontalRule().run(); break;
        default: break;
      }
    } else if (!isTiptapCommand) {
      onCommand(command);
    }
  };

  const stickyTopClass = isForAdmin ? 'top-0' : 'top-[65px]';

  return (
    <>
      <div className={cn("bg-card border-b sticky z-30", stickyTopClass)}>
        <div className={cn(
            "flex items-center justify-center gap-1 flex-wrap",
            isForAdmin && "max-w-none px-2" 
          )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleButtonClick('bold')}
            title="Bold"
            className={cn(isActive('bold') && 'bg-muted text-primary')}
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleButtonClick('italic')}
            title="Italic"
            className={cn(isActive('italic') && 'bg-muted text-primary')}
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleButtonClick('underline')}
            title="Underline"
            className={cn(isActive('underline') && 'bg-muted text-primary')}
          >
            <Underline className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button variant="ghost" size="sm" onClick={() => handleButtonClick('h1')} title="Heading 1" className={cn(isActive('heading', {level: 1}) && 'bg-muted text-primary')}>
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleButtonClick('h2')} title="Heading 2" className={cn(isActive('heading', { level: 2 }) && 'bg-muted text-primary')}>
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleButtonClick('h3')} title="Heading 3" className={cn(isActive('heading', { level: 3 }) && 'bg-muted text-primary')}>
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleButtonClick('paragraph')} title="Paragraph" className={cn(isActive('paragraph') && 'bg-muted text-primary')}>
            <Pilcrow className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button variant="ghost" size="sm" onClick={() => handleButtonClick('bulletList')} title="Bulleted List" className={cn(isActive('bulletList') && 'bg-muted text-primary')}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleButtonClick('orderedList')} title="Numbered List" className={cn(isActive('orderedList') && 'bg-muted text-primary')}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          {/* Blockquote button removed */}

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button variant="ghost" size="sm" onClick={() => handleButtonClick('insertImage', false)} title="Insert Image">
            <ImagePlusIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleButtonClick('insertLink', false)} title="Insert Link">
            <LinkIconLucide className="h-4 w-4" />
          </Button>
           <Button variant="ghost" size="sm" onClick={() => handleButtonClick('insertEmbed', false)} title="Insert Embed">
            <CodeBlockCurlyIcon className="h-4 w-4" /> {/* Changed to CodeBlockCurlyIcon here too for consistency, though it's for embed */}
          </Button>

          

           <Button variant="ghost" size="sm" onClick={() => handleButtonClick('horizontalRule')} title="Horizontal Rule">
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
