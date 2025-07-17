import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateAgo(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    // Remove "about " from the beginning of the string
    return formatDistanceToNow(date, { addSuffix: true }).replace('about ', '');
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid date';
  }
}

export function generateSlug(title: string): string {
  if (!title) return 'untitled';
  
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars (alphanumeric, underscore, hyphen)
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
  
  return slug || 'untitled'; // If slug becomes empty after processing, default to 'untitled'
}


export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}
