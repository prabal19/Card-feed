// src/app/about/page.tsx
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, History, Newspaper } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8">
        <Card className="max-w-4xl mx-auto shadow-xl my-8 bg-card">
          <CardHeader className="text-center border-b pb-6">
            <div className="mx-auto mb-4 flex items-center justify-center text-primary">
              <Newspaper className="h-16 w-16" />
            </div>
            <CardTitle className="text-4xl font-bold text-primary">About CardFeed</CardTitle>
            <p className="text-muted-foreground text-lg mt-2">
              Discover the story behind your favorite content platform.
            </p>
          </CardHeader>
          <CardContent className="space-y-10 p-6 md:p-10 text-card-foreground">
            <section className="text-center">
              <p className="text-lg leading-relaxed">
                Welcome to CardFeed, your daily source for engaging articles, insightful discussions, and trending topics from around the globe. We believe in the power of shared knowledge and diverse perspectives to inspire, educate, and entertain.
              </p>
            </section>

            <section>
              <div className="flex items-center justify-center mb-4">
                <Target className="h-10 w-10 text-primary mr-3" />
                <h2 className="text-3xl font-semibold text-primary">Our Mission</h2>
              </div>
              <p className="text-lg leading-relaxed text-center">
                Our mission is to create a vibrant and inclusive community where individuals can freely share their ideas, discover new interests, and connect with like-minded people. We strive to provide a platform that is both user-friendly and rich in high-quality content, fostering a culture of curiosity and continuous learning.
              </p>
            </section>

            <section>
              <div className="flex items-center justify-center mb-4">
                 <History className="h-10 w-10 text-primary mr-3" />
                <h2 className="text-3xl font-semibold text-primary">Our Story</h2>
              </div>
              <p className="text-lg leading-relaxed text-center">
                Founded in 2024, CardFeed was born from a simple idea: to make discovering and sharing knowledge easier and more enjoyable. We noticed a gap in how information was being consumed and decided to build a platform that prioritizes quality, community, and user experience. From humble beginnings, we've grown into a bustling hub for creators and readers alike, constantly evolving to meet the needs of our dynamic community.
              </p>
            </section>
            
            <section>
              <div className="flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-primary mr-3" />
                <h2 className="text-3xl font-semibold text-primary">Our Team (Placeholder)</h2>
              </div>
              <p className="text-lg leading-relaxed text-center">
                CardFeed is powered by a passionate team of developers, designers, and content enthusiasts dedicated to building the best possible platform for our users. We are a diverse group united by our love for knowledge and technology. (More details about the team would go here in a real scenario).
              </p>
            </section>

             <section className="text-center pt-6 border-t">
                <h3 className="text-2xl font-semibold text-primary mb-3">Join Our Community</h3>
                <p className="text-lg leading-relaxed">
                    Whether you're here to read, write, or simply explore, we're thrilled to have you. Create an account today to start your CardFeed journey!
                </p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
