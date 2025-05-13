import type { ObjectId } from 'mongodb';

export interface User {
  _id?: string; // MongoDB ID, represented as string in DTOs
  id: string; // Unique identifier for the user, typically string version of _id
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Should not be sent to client, but useful for schema
  profileImageUrl?: string;
  description?: string;
  googleId?: string; // For linking Google account
  // For social logins, store provider-specific IDs if needed
  // twitterId?: string;
  // facebookId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// A summary of user information, often embedded in posts or comments
export interface UserSummary {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface Comment {
  _id?: string; // MongoDB ID, represented as string in DTOs
  id: string; // Unique identifier for the comment, typically string version of _id
  postId: string;
  author: UserSummary; // Updated: Embed UserSummary
  text: string;
  date: string;
}

export type Post = {
  _id?: string; // MongoDB ID, represented as string in DTOs
  id: string; // Unique identifier for the post, typically string version of _id
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category: string;
  author: UserSummary; // Updated: Embed UserSummary
  date: string;
  likes: number;
  likedBy?: string[]; // Array of User IDs who liked the post
  shares: number;
  comments: Comment[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

// For profile update form
export interface UpdateUserProfileInput {
  firstName?: string;
  lastName?: string;
  description?: string;
  profileImageUrl?: string;
}

export interface Notification {
  _id?: string; // MongoDB ID, will be ObjectId in DB
  id: string; // String representation of _id
  userId: string; // The ID of the user who *receives* the notification (e.g., post author)
  type: 'like' | 'comment';
  postId: string;
  postSlug: string; // For linking to the post
  postTitle: string;
  actingUser: UserSummary; // User who triggered the notification (liked or commented)
  isRead: boolean;
  createdAt: string; // ISO date string
}
