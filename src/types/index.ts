

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
  authProvider?: 'google' | 'email' | 'admin_created';
  role?: 'user' | 'admin';
  isBlocked?: boolean; // Added for blocking users
  createdAt?: Date | string;
  updatedAt?: Date | string;
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
  author: UserSummary;
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
  author: UserSummary;
  date: string;
  likes: number;
  likedBy?: string[];
  shares: number;
  comments: Comment[];
  status?: 'accepted' | 'pending' | 'rejected'; // New status field
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

// For profile update form (user editing their own)
export interface UpdateUserProfileInput {
  firstName?: string;
  lastName?: string;
  description?: string;
  profileImageUrl?: string;
}

// For admin updating any user's profile
export interface UpdateUserByAdminInput {
  firstName?: string;
  lastName?: string;
  email?: string; 
  description?: string;
  profileImageUrl?: string; 
  role?: 'user' | 'admin';
  isBlocked?: boolean;
}


export interface Notification {
  _id?: string;
  id: string;
  userId: string;
  type: 'like' | 'comment';
  postId: string;
  postSlug: string;
  postTitle: string;
  actingUser: UserSummary;
  isRead: boolean;
  createdAt: string;
}

export interface UserWithPostCount extends User {
  postCount?: number;
}

export interface CreateUserByAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  description?: string;
  profileImageUrl?: string;
  profileImageFile?: File;
}

export interface CreatePostInput {
  title: string;
  content: string;
  categorySlug: string;
  authorId: string;
  imageUrl?: string;
  status?: 'accepted' | 'pending' | 'rejected'; // Added for seeding/admin creation
}
