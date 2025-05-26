
// src/components/blog/popular-categories.tsx
'use client';

import type { Category } from '@/types'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { BarChartBig, ChevronRight, Image as ImageIcon } from 'lucide-react'; // Added ImageIcon

interface CategoryWithCount extends Category {
  postCount: number;
}

interface PopularCategoriesProps {
  categories: CategoryWithCount[]; 
  count?: number;
}

export function PopularCategories({ categories, count = 5 }: PopularCategoriesProps) {
  const displayedCategories = categories.slice(0, count);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChartBig className="h-5 w-5 text-primary" />
          Popular Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedCategories.length > 0 ? (
          <ul className="space-y-1">
            {displayedCategories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`} 
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-primary/10 transition-colors cursor-pointer group"
                >
                  <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                    <Image
                      src={`https://placehold.co/40x40.png`} 
                      alt={category.name}
                      width={40}
                      height={40}
                      className="object-cover"
                      data-ai-hint={category.hint || category.slug.replace(/-/g, ' ').substring(0, 20)}
                    />
                  </div>
                  <div className="flex-grow">
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{category.name}</span>
                    <span className="text-xs text-muted-foreground ml-1">({category.postCount})</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No categories to display.</p>
        )}
      </CardContent>
    </Card>
  );
}
