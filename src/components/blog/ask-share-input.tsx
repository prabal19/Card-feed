// src/components/blog/ask-share-input.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageSquareText, Send } from 'lucide-react';

export function AskShareInput() {
  const [inputValue, setInputValue] = useState('');
  const router = useRouter(); // Initialize useRouter

  const handlePost = () => {
    // Navigate to create post page with inputValue as a query parameter
    if (inputValue.trim()) {
      router.push(`/create-post?initialContent=${encodeURIComponent(inputValue)}`);
    } else {
      router.push('/create-post');
    }
    setInputValue(''); // Clear input after navigating
  };

  return (
    <Card className="shadow-md">
      <CardContent className="p-4 space-y-3">
        <Textarea
          placeholder="Share Your thoughts..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="min-h-[60px] resize-none"
        />
        <div className="flex flex-wrap gap-2 justify-end">
          
          <Button onClick={handlePost}>
            <Send className="mr-2 h-4 w-4" />
            Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
