// src/app/faq/page.tsx
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqData = [
  {
    id: "faq1",
    question: "What is CardFeed?",
    answer: "CardFeed is a dynamic platform for discovering, reading, and sharing blog posts on a wide variety of topics. It's a community where users can engage with content, share their insights, and connect with others who have similar interests."
  },
  {
    id: "faq2",
    question: "How do I create an account?",
    answer: "You can create an account by clicking the 'Sign Up' button on the homepage or login page. You'll need to provide your first name, last name, email address, and create a password. Alternatively, you can sign up using your Google, Twitter, or Facebook accounts for a quicker process."
  },
  {
    id: "faq3",
    question: "Is CardFeed free to use?",
    answer: "Yes, CardFeed is completely free for readers and contributors. You can browse, read, comment, like, share, and create posts without any subscription fees."
  },
  {
    id: "faq4",
    question: "How can I create a post?",
    answer: "Once logged in, you can click the 'Create Post' button, which is prominently displayed on the homepage. This will take you to the post creation page where you can write your title, content, add formatting, and then publish it after selecting a category and optional cover image."
  },
  {
    id: "faq5",
    question: "What kind of content can I post?",
    answer: "You can post articles, stories, tutorials, opinion pieces, and more across various categories like technology, travel, food, etc. All content should adhere to our community guidelines, which prohibit hate speech, harassment, and illegal content."
  },
  {
    id: "faq6",
    question: "How do I find trending posts or specific categories?",
    answer: "The homepage features a 'Trending Now' section showcasing the most liked posts. There's also a 'Popular Categories' section. You can use the search bar at the top of the page to search for specific topics, authors, or keywords."
  },
  {
    id: "faq7",
    question: "Can I comment on posts?",
    answer: "Yes! We encourage interaction. You can leave comments on any post. Click the 'Comment' button on a blog card to open the comment modal, where you can type and submit your comment."
  },
  {
    id: "faq8",
    question: "How is my data handled?",
    answer: "We take your privacy seriously. Please refer to our Privacy Policy page for detailed information on how we collect, use, and protect your personal data."
  }
];

export default function FaqPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8">
        <Card className="max-w-3xl mx-auto shadow-xl my-8 bg-card">
          <CardHeader className="text-center border-b pb-6">
            <div className="mx-auto mb-4 flex items-center justify-center text-primary">
              <HelpCircle className="h-16 w-16" />
            </div>
            <CardTitle className="text-4xl font-bold text-primary">Frequently Asked Questions</CardTitle>
            <CardDescription className="text-muted-foreground text-lg mt-2">
              Find answers to common questions about CardFeed.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-10 text-card-foreground">
            {faqData.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((item) => (
                  <AccordionItem value={item.id} key={item.id}>
                    <AccordionTrigger className="text-lg hover:text-primary text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground text-center">No FAQs available at the moment. Please check back later.</p>
            )}
            <div className="mt-10 text-center">
              <h3 className="text-xl font-semibold text-primary mb-2">Still have questions?</h3>
              <p className="text-muted-foreground">
                If you can&apos;t find the answer you&apos;re looking for, feel free to <a href="/contact" className="text-primary hover:underline">contact us</a>.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
