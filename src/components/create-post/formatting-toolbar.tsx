'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';
import clsx from 'clsx';
import { AddLinkPopup } from '@/components/create-post/add-link-popup';

interface FormattingToolbarProps {
  editor: Editor | null;
  // setContent?: (value: (prev: string) => string) => void;
}

export function FormattingToolbar({ editor }: FormattingToolbarProps) {
  const [isLinkPopupOpen, setIsLinkPopupOpen] = useState(false);
  const isActive = (format: string) => {
    if (!editor) return false;
    switch (format) {
      case 'bold':
        return editor.isActive('bold');
      case 'italic':
        return editor.isActive('italic');
      case 'underline':
        return editor.isActive('underline');
      case 'bulletList':
        return editor.isActive('bulletList');
      case 'orderedList':
        return editor.isActive('orderedList');
      case 'heading':
        return editor.isActive('heading', { level: 1 });
      default:
        return false;
    }
  };

  const handleButtonClick = (command: string) => {
    if (!editor) return;

    switch (command) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'heading':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'insertLink':
        setIsLinkPopupOpen(true);
        break;
      default:
        break;
    }
  };

  const handleLinkInsert = (linkText: string, linkUrl: string) => {
  if (!editor) return;

  let fullUrl = linkUrl;
  if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
    fullUrl = 'https://' + linkUrl;
  }

  editor
    .chain()
    .focus()
    .insertContent({
      type: 'text',
      text: linkText || fullUrl,
      marks: [
        {
          type: 'link',
          attrs: {
            href: fullUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        },
      ],
    })
    .run();

  setIsLinkPopupOpen(false);
};


  return (
    <>
    <div className="bg-card border-b sticky top-[65px] z-40">
      <div className="container mx-auto px-4 py-2 flex items-center gap-1 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleButtonClick('bold')}
          title="Bold"
          className={clsx({ 'bg-muted text-primary': isActive('bold') })}
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleButtonClick('italic')}
          title="Italic"
          className={clsx({ 'bg-muted text-primary': isActive('italic') })}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleButtonClick('underline')}
          title="Underline"
          className={clsx({ 'bg-muted text-primary': isActive('underline') })}
        >
          <Underline className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleButtonClick('heading')}
          title="Heading 1"
          className={clsx({ 'bg-muted text-primary': isActive('heading') })}
        >
          <Heading className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleButtonClick('bulletList')}
          title="Bulleted List"
          className={clsx({ 'bg-muted text-primary': isActive('bulletList') })}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleButtonClick('orderedList')}
          title="Numbered List"
          className={clsx({ 'bg-muted text-primary': isActive('orderedList') })}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />


        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleButtonClick('insertLink')}
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>

    <AddLinkPopup
        isOpen={isLinkPopupOpen}
        onClose={() => setIsLinkPopupOpen(false)}
        onSubmit={handleLinkInsert}
      />
      </>
  );
}
