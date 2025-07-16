
import type { Metadata, ResolvingMetadata } from 'next'
import { getUserProfile } from '@/app/actions/user.actions';
import { UserProfileContent } from '@/components/profile/user-profile-content';
import { AppHeader } from '@/components/layout/header';
import { AppFooter } from '@/components/layout/footer';
import { Loader2, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

type Props = {
  params: { userId: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const userId = params.userId
  const user = await getUserProfile(userId)

  if (!user) {
    return {
      title: 'User Not Found',
      description: 'The user you are looking for does not exist.',
    }
  }

  const previousImages = (await parent).openGraph?.images || []
  const userImage = user.profileImageUrl || '/card.jpg';

  return {
    title: `${user.firstName} ${user.lastName} - Profile`,
    description: user.description || 'Check out this profile on CardFeed.',
    openGraph: {
      title: `${user.firstName} ${user.lastName}`,
      description: user.description || 'Check out this profile on CardFeed.',
      url: `/profile/${user.id}`,
      images: [userImage, ...previousImages],
    },
     twitter: {
      card: 'summary_large_image',
      title: `${user.firstName} ${user.lastName}`,
      description: user.description || 'Check out this profile on CardFeed.',
      images: [userImage],
    },
  }
}

export default async function UserProfilePage({ params }: Props) {
  const initialProfileUser = await getUserProfile(params.userId);

  if (!initialProfileUser) {
    return (
       <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8 text-center">
          <UserCircle className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-semibold">Profile Not Found</h1>
          <p className="text-muted-foreground">The user profile you are looking for does not exist or could not be loaded.</p>
          <Button asChild className="mt-6">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 md:pt-8">
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        }>
            <UserProfileContent initialProfileUser={initialProfileUser} />
        </Suspense>
      </main>
      <AppFooter />
    </div>
  );
}
