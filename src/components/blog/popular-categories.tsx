// src/components/blog/popular-categories.tsx
'use client';

import type { Category } from '@/types'; 
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { Separator } from '../ui/separator';

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
    <div>
      <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-3">
          Popular Categories
      </h3>
      <div>
        {displayedCategories.length > 0 ? (
          <ul className="space-y-1">
            {displayedCategories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`} 
                  className="flex items-center gap-3 p-2 -ml-2 rounded-none hover:bg-accent transition-colors cursor-pointer group"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                    <Image
                      src={category.src || 'https://placehold.co/40x40.png'}
                      alt={category.name}
                      width={32}
                      height={32}
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
      </div>
    </div>
  );
}
