import type { Category } from '@/types'; // Removed Post type import

export const categories: Category[] = [
  { id: '1', name: 'Technology', slug: 'technology' },
  { id: '2', name: 'Travel', slug: 'travel' },
  { id: '3', name: 'Food', slug: 'food' },
  { id: '4', name: 'Lifestyle', slug: 'lifestyle' },
  { id: '5', name: 'Business', slug: 'business' },
  { id: '6', name: 'Health & Wellness', slug: 'health-wellness' },
  { id: '7', name: 'Finance', slug: 'finance' },
  { id: '8', name: 'Education', slug: 'education' },
  { id: '9', name: 'Arts & Culture', slug: 'arts-culture' },
  { id: '10', name: 'Sports', slug: 'sports' },
  { id: '11', name: 'Science', slug: 'science' },
  { id: '12', name: 'Home & Garden', slug: 'home-garden' },
  { id: '13', name: 'Automotive', slug: 'automotive' },
  { id: '14', name: 'Pets', slug: 'pets' },
  { id: '15', name: 'Gaming', slug: 'gaming' },
];

// Removed the static 'posts' array. Posts will be fetched from MongoDB.
