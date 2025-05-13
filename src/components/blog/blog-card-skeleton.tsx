// src/components/blog/blog-card-skeleton.tsx
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function BlogCardSkeleton() {
  return (
    <Card className="overflow-hidden shadow-lg flex flex-col h-full bg-card">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="w-1/2 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-4 w-1/4 mb-2" /> {/* Badge Skeleton */}
        <Skeleton className="h-6 w-full" /> {/* Title Skeleton */}
      </CardHeader>
      
      {/* Image Skeleton - assumed present for consistent skeleton layout */}
      <Skeleton className="relative w-full h-56 md:h-64" />
      
      <CardContent className="p-4 flex-grow space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
      
      <CardFooter className="p-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          <Skeleton className="h-8 w-16 rounded-md" /> {/* Like button Skeleton */}
          <Skeleton className="h-8 w-16 rounded-md" /> {/* Comment button Skeleton */}
        </div>
        <Skeleton className="h-8 w-20 rounded-md" /> {/* Share button Skeleton */}
      </CardFooter>
    </Card>
  );
}
