// src/app/contact/page.tsx
'use client';

import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit: SubmitHandler<ContactFormValues> = async (data) => {
    setIsSubmitting(true);
    console.log("Contact form submission:", data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us. We'll get back to you soon.",
    });
    reset(); // Reset form fields
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8">
        <Card className="max-w-4xl mx-auto shadow-xl my-8 bg-card">
          <CardHeader className="text-center border-b pb-6">
             <div className="mx-auto mb-4 flex items-center justify-center text-primary">
                <Mail className="h-16 w-16" />
            </div>
            <CardTitle className="text-4xl font-bold text-primary">Get in Touch</CardTitle>
            <CardDescription className="text-muted-foreground text-lg mt-2">
              We&apos;d love to hear from you! Send us a message or find us at our locations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-10 text-card-foreground">
            <div className="grid md:grid-cols-2 gap-10">
              <section>
                <h2 className="text-2xl font-semibold text-primary mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-foreground">Full Name</Label>
                    <Input id="name" placeholder="John Doe" {...register('name')} disabled={isSubmitting} />
                    {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-foreground">Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" {...register('email')} disabled={isSubmitting} />
                    {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="subject" className="text-foreground">Subject</Label>
                    <Input id="subject" placeholder="Regarding..." {...register('subject')} disabled={isSubmitting} />
                    {errors.subject && <p className="text-destructive text-sm mt-1">{errors.subject.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-foreground">Your Message</Label>
                    <Textarea id="message" placeholder="Write your message here..." rows={5} {...register('message')} disabled={isSubmitting} />
                    {errors.message && <p className="text-destructive text-sm mt-1">{errors.message.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Send Message
                      </>
                    )}
                  </Button>
                </form>
              </section>
              
              <section className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold text-primary mb-4">Contact Information</h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <MapPin className="h-6 w-6 text-primary mr-3 mt-1 shrink-0" />
                      <div>
                        <h3 className="font-semibold">Our Office</h3>
                        <p className="text-muted-foreground">123 CardFeed Street, Innovation City, CF 12345</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mail className="h-6 w-6 text-primary mr-3 mt-1 shrink-0" />
                      <div>
                        <h3 className="font-semibold">Email Us</h3>
                        <p className="text-muted-foreground">contact@cardfeed.com</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="h-6 w-6 text-primary mr-3 mt-1 shrink-0" />
                       <div>
                        <h3 className="font-semibold">Call Us</h3>
                        <p className="text-muted-foreground">(123) 456-7890</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-primary mb-4">Business Hours</h2>
                  <p className="text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p className="text-muted-foreground">Saturday - Sunday: Closed</p>
                </div>

                
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
