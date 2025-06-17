
import type { ObjectId } from 'mongodb';

export interface User {
  _id?: string; 
  id: string; 
  firstName: string;
  lastName: string;
  email: string;
  password?: string; 
  profileImageUrl?: string; // Can be data URI or external URL
  description?: string;
  googleId?: string; 
  authProvider?: 'google' | 'email' | 'admin_created';
  role?: 'user' | 'admin';
  isBlocked?: boolean; 
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
    website?: string;
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface UserSummary {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface Comment {
  _id?: string; 
  id: string; 
  postId: string;
  author: UserSummary;
  text: string;
  date: string;
  parentId?: string; // For replies
  likes?: number;
  likedBy?: string[];
}

export type Post = {
  _id?: string; 
  id: string; 
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string; // Can be data URI or external URL
  category: string;
  author: UserSummary;
  date: string;
  likes: number;
  likedBy?: string[];
  shares: number;
  comments: Comment[];
  status?: 'accepted' | 'pending' | 'rejected'; 
  updatedAt?: Date | string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  hint?: string;
  src?:string;
};

export interface UpdateUserProfileInput {
  firstName?: string;
  lastName?: string;
  description?: string;
  profileImageUrl?: string; // Can be data URI or external URL
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
    website?: string;
  };
}

export interface UpdateUserByAdminInput {
  firstName?: string;
  lastName?: string;
  email?: string; 
  description?: string;
  profileImageUrl?: string; // Can be data URI or external URL
  role?: 'user' | 'admin';
  isBlocked?: boolean;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
    website?: string;
  };
}


export interface Notification {
  _id?: string;
  id: string;
  userId: string;
  type: 'like' | 'comment' |'post_status_change' | 'comment_like' | 'comment_reply';
  postId: string;
  postSlug: string;
  postTitle: string;
  actingUser: UserSummary;
  isRead: boolean;
  createdAt: string;
  newStatus?: 'accepted' | 'rejected';
  commentId?: string; // For comment_like and comment_reply
  commentText?: string; // For comment_reply (text of the reply) or comment_like (text of the liked comment)
  parentCommentAuthorId?: string 
}

export interface UserWithPostCount extends User {
  postCount?: number;
}

// For admin creating a user. Admin provides URL or client converts file to data URI.
export interface CreateUserByAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  description?: string;
  profileImageUrl?: string; // Expecting a data URI or an external URL from client
  socialLinks?: { // Added for completeness, though likely not set at initial creation by admin
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
    website?: string;
  };
}

export interface CreatePostInput {
  title: string;
  content: string;
  excerpt: string; 
  categorySlug: string;
  authorId: string;
  imageUrl?: string; // Can be data URI or external URL
  status?: 'accepted' | 'pending' | 'rejected'; 
}

export interface UpdatePostData {
  title: string;
  content: string;
  excerpt: string;
  categorySlug: string;
  imageUrl?: string;
}
