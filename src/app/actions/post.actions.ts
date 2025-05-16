
// src/app/actions/post.actions.ts
'use server';

import clientPromise from '@/lib/mongodb';
import type { Post, Comment, UserSummary, User, CreatePostInput as CreatePostInputType } from '@/types'; // Updated CreatePostInput import
import { ObjectId,UpdateFilter } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { categories as allStaticCategories } from '@/lib/data';
import { seedUsers, getUserProfile } from './user.actions'; 
import { createNotification } from './notification.actions'; 
import { generateSlug } from '@/lib/utils';

async function getDb() {
  const client = await clientPromise;
  return client.db(); 
}

function mapCommentToDto(comment: any): Comment {
  return {
    ...comment,
    _id: comment._id?.toString(),
    id: comment.id?.toString() || comment._id?.toString(),
  };
}

function mapPostToDto(post: any): Post {
  return {
    ...post,
    _id: post._id?.toString(),
    id: post.id?.toString() || post._id?.toString(),
    comments: Array.isArray(post.comments) ? post.comments.map(mapCommentToDto) : [],
    date: post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
    status: post.status || 'pending', // Default to pending if status is not set
  };
}


export async function getPosts(page = 1, limit = 8, categorySlug?: string): Promise<{ posts: Post[], hasMore: boolean, totalPosts: number }> {
  try {
    const db = await getDb();
    const postsCollection = db.collection('posts');
    
    const query: any = { status: 'accepted' }; // Only fetch accepted posts for public view
    if (categorySlug) {
      query.category = categorySlug;
    }

    const skip = (page - 1) * limit;
    
    const postsFromDb = await postsCollection.find(query).sort({ date: -1 }).skip(skip).limit(limit).toArray();
    const totalPosts = await postsCollection.countDocuments(query);

    return {
      posts: postsFromDb.map(mapPostToDto),
      hasMore: skip + postsFromDb.length < totalPosts,
      totalPosts,
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], hasMore: false, totalPosts: 0 };
  }
}

export async function getAllPostsForAdmin(statusFilter?: 'accepted' | 'pending' | 'rejected'): Promise<{ posts: Post[], counts: { accepted: number, pending: number, rejected: number, all: number } }> {
  console.log('[getAllPostsForAdmin] Received statusFilter:', statusFilter);
  try {
    const db = await getDb();
    const postsCollection = db.collection('posts');

    // Get counts
    const acceptedCount = await postsCollection.countDocuments({ status: 'accepted' });
    const pendingCount = await postsCollection.countDocuments({ status: 'pending' });
    const rejectedCount = await postsCollection.countDocuments({ status: 'rejected' });
    const allCount = await postsCollection.countDocuments();

    const counts = {
      accepted: acceptedCount,
      pending: pendingCount,
      rejected: rejectedCount,
      all: allCount
    };

    const query: any = {};
    if (statusFilter) {
      query.status = statusFilter;
    }
    console.log('[getAllPostsForAdmin] MongoDB query:', query);
    const postsFromDb = await postsCollection.find(query).sort({ date: -1 }).toArray();
    console.log(`[getAllPostsForAdmin] Found ${postsFromDb.length} posts with filter "${statusFilter || 'none'}".`);
    
    return {
      posts: postsFromDb.map(mapPostToDto),
      counts: counts
    };
  } catch (error) {
    console.error('Error fetching all posts for admin:', error);
    return { posts: [], counts: { accepted: 0, pending: 0, rejected: 0, all: 0 } };
  }
}


export async function getPostById(postId: string): Promise<Post | null> {
  try {
    if (!ObjectId.isValid(postId)) {
      console.error('Invalid ObjectId for getPostById:', postId);
      return null;
    }
    const db = await getDb();
    const postsCollection = db.collection('posts');
    const postFromDb = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (postFromDb) {
      // No status check here, admin/direct link can access any post
      return mapPostToDto(postFromDb);
    }
    return null;
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    return null;
  }
}

// Renamed type alias to avoid conflict with interface name
export type CreatePostActionInput = CreatePostInputType;

export async function createPost(data: CreatePostActionInput): Promise<Post | null> {
  try {
    const db = await getDb();
    const postsCollection = db.collection('posts');

    const author = await getUserProfile(data.authorId);
    if (!author) {
        console.error(`Author with ID ${data.authorId} not found.`);
        return null;
    }
    if (author.isBlocked) {
        console.error(`Author with ID ${data.authorId} is blocked and cannot create posts.`);
        throw new Error("Blocked users cannot create posts.");
    }


    const authorSummary: UserSummary = {
        id: author.id,
        name: `${author.firstName} ${author.lastName}`,
        imageUrl: author.profileImageUrl || `https://picsum.photos/seed/${author.id}/40/40`
    };

    const newPostData: Omit<Post, '_id' | 'id'> = {
      title: data.title,
      content: data.content,
      excerpt: data.content.substring(0, 150) + (data.content.length > 150 ? '...' : ''),
      category: data.categorySlug,
      author: authorSummary,
      imageUrl: data.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(data.title)}/600/400`,
      date: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      shares: 0,
      comments: [],
      status: data.status || 'pending', // Default to 'pending' if not provided (e.g. for user submissions)
    };

    const result = await postsCollection.insertOne(newPostData as any);

    revalidatePath('/');
    revalidatePath(`/category/${data.categorySlug}`);
    revalidatePath(`/posts/${result.insertedId.toString()}`);
    revalidatePath(`/profile/${data.authorId}`);
    revalidatePath('/admin/blogs'); 

    const createdPost = await postsCollection.findOne({_id: result.insertedId});
    return createdPost ? mapPostToDto(createdPost) : null;

  } catch (error) {
    console.error('Error creating post:', error);
    if (error instanceof Error && error.message === "Blocked users cannot create posts.") {
        throw error; 
    }
    return null;
  }
}

export async function updatePostStatus(postId: string, status: 'accepted' | 'pending' | 'rejected'): Promise<Post | null> {
  try {
    if (!ObjectId.isValid(postId)) {
      console.error('Invalid ObjectId for updatePostStatus:', postId);
      return null;
    }
    const db = await getDb();
    const postsCollection = db.collection('posts');

    const result = await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { $set: { status: status, updatedAt: new Date() } }, // Also update 'updatedAt' or similar field if you track modifications
      { returnDocument: 'after' }
    );

    if (result) {
      revalidatePath('/'); // Revalidate homepage as accepted posts might change
      revalidatePath('/admin/blogs'); // Revalidate admin blogs list
      const updatedPost = mapPostToDto(result);
      if (updatedPost.category) revalidatePath(`/category/${updatedPost.category}`);
      return updatedPost;
    }
    return null;
  } catch (error) {
    console.error('Error updating post status:', error);
    return null;
  }
}


export async function likePost(postId: string, userId: string): Promise<Post | null> {
  try {
    if (!ObjectId.isValid(postId)) {
      console.error('Invalid ObjectId for likePost:', postId);
      return null;
    }
    if (!userId) {
      console.error('User ID is required to like a post.');
      return null;
    }
    const actingUser = await getUserProfile(userId);
    if (!actingUser) {
        console.error(`User with ID ${userId} not found for liking post.`);
        return null;
    }
    if (actingUser.isBlocked) {
        console.error(`User with ID ${userId} is blocked and cannot like posts.`);
        throw new Error("Blocked users cannot like posts.");
    }


    const db = await getDb();
    const postsCollection = db.collection('posts');

    const postBeforeUpdate = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!postBeforeUpdate) {
      console.error('Post not found for liking:', postId);
      return null;
    }
    if (postBeforeUpdate.status !== 'accepted') {
      // Optionally prevent liking non-accepted posts, or allow it. For now, allow.
      // console.warn(`User ${userId} attempting to like a post with status: ${postBeforeUpdate.status}`);
    }


const likedByArray = Array.isArray(postBeforeUpdate.likedBy) ? postBeforeUpdate.likedBy : [];
const alreadyLiked = likedByArray.includes(userId);

let updateOperation: UpdateFilter<Document>;

if (alreadyLiked) {
  updateOperation = {
    $inc: { likes: -1 },
    $pull: { likedBy: { $eq: userId } },  // ✅ use $eq
  };
} else {
  updateOperation = {
    $inc: { likes: 1 },
    $addToSet: { likedBy: userId },
  };
}

const result = await postsCollection.findOneAndUpdate(
  { _id: new ObjectId(postId) },
  updateOperation,
  { returnDocument: 'after' }
);


    if (result) {
      const updatedPost = mapPostToDto(result);
      revalidatePath('/');
      revalidatePath(`/posts/${postId}`);
      if (updatedPost.author?.id) revalidatePath(`/profile/${updatedPost.author.id}`);
      revalidatePath('/admin/blogs');

      if (!alreadyLiked && updatedPost.author?.id && updatedPost.author.id !== userId) {
        if (actingUser) {
          const actingUserSummary: UserSummary = {
            id: actingUser.id,
            name: `${actingUser.firstName} ${actingUser.lastName}`,
            imageUrl: actingUser.profileImageUrl
          };
          await createNotification(
            updatedPost.author.id,
            'like',
            updatedPost.id,
            generateSlug(updatedPost.title),
            updatedPost.title,
            actingUserSummary
          );
        }
      }
      return updatedPost;
    }
    return null;
  } catch (error) {
    console.error('Error liking post:', error);
    if (error instanceof Error && error.message === "Blocked users cannot like posts.") {
        throw error;
    }
    return null;
  }
}


export async function sharePost(postId: string): Promise<Post | null> {
   try {
    if (!ObjectId.isValid(postId)) {
      console.error('Invalid ObjectId for sharePost:', postId);
      return null;
    }
    const db = await getDb();
    const postsCollection = db.collection('posts');
    
    // Optionally check post status before allowing share count increment
    // const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    // if (post && post.status !== 'accepted') {
    //   console.warn(`Attempting to share a post with status: ${post.status}`);
    //   return mapPostToDto(post); // Return current post without incrementing if not accepted
    // }


    const result = await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { $inc: { shares: 1 } },
      { returnDocument: 'after' }
    );

    if (result) {
      revalidatePath('/');
      revalidatePath(`/posts/${postId}`);
      if (result.author?.id) revalidatePath(`/profile/${result.author.id}`);
      revalidatePath('/admin/blogs');
      return mapPostToDto(result);
    }
    return null;
  } catch (error) {
    console.error('Error sharing post:', error);
    return null;
  }
}

export interface AddCommentInput {
  postId: string;
  authorId: string;
  authorName: string;
  authorImageUrl?: string;
  text: string;
}

export async function addComment(commentData: AddCommentInput): Promise<Post | null> {
  try {
    if (!ObjectId.isValid(commentData.postId)) {
      console.error('Invalid ObjectId for addComment:', commentData.postId);
      return null;
    }
    const actingUser = await getUserProfile(commentData.authorId);
    if (!actingUser) {
        console.error(`User with ID ${commentData.authorId} not found for adding comment.`);
        return null;
    }
    if (actingUser.isBlocked) {
        console.error(`User with ID ${commentData.authorId} is blocked and cannot comment.`);
        throw new Error("Blocked users cannot comment.");
    }


    const db = await getDb();
    const postsCollection = db.collection('posts');

    // Optionally check post status before allowing comment
    // const postForComment = await postsCollection.findOne({ _id: new ObjectId(commentData.postId) });
    // if (postForComment && postForComment.status !== 'accepted') {
    //   console.warn(`User ${commentData.authorId} attempting to comment on a post with status: ${postForComment.status}`);
    //   // Decide if you want to prevent commenting or allow it. For now, allow.
    // }


    const actingUserSummary: UserSummary = {
        id: commentData.authorId,
        name: commentData.authorName,
        imageUrl: commentData.authorImageUrl || `https://picsum.photos/seed/${commentData.authorId}/32/32`
    };

    const commentObjectId = new ObjectId();
    const newComment: Comment = {
      _id: commentObjectId.toString(),
      id: commentObjectId.toString(),
      postId: commentData.postId,
      author: actingUserSummary,
      text: commentData.text,
      date: new Date().toISOString(),
    };

    const commentForDb = {
        ...newComment,
        _id: commentObjectId
    };

    const result = await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(commentData.postId) },
      { $push: { comments: commentForDb as any } },
      { returnDocument: 'after' }
    );

    if (result) {
      const updatedPost = mapPostToDto(result);
      revalidatePath('/');
      revalidatePath(`/posts/${commentData.postId}`);
      if (updatedPost.author?.id) revalidatePath(`/profile/${updatedPost.author.id}`);
      revalidatePath('/admin/blogs');

      if (updatedPost.author?.id && updatedPost.author.id !== commentData.authorId) {
         await createNotification(
            updatedPost.author.id,
            'comment',
            updatedPost.id,
            generateSlug(updatedPost.title),
            updatedPost.title,
            actingUserSummary
          );
      }
      return updatedPost;
    }
    return null;
  } catch (error) {
    console.error('Error adding comment:', error);
    if (error instanceof Error && error.message === "Blocked users cannot comment.") {
        throw error;
    }
    return null;
  }
}

export async function getCategoriesWithCounts(): Promise<Array<{ category: string, count: number }>> {
  try {
    const db = await getDb();
    const postsCollection = db.collection('posts');
    // Count only 'accepted' posts for public category counts
    const aggregationResult = await postsCollection.aggregate([
      { $match: { status: 'accepted' } }, 
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { category: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]).toArray();

    return aggregationResult as Array<{ category: string, count: number }>;
  } catch (error) {
    console.error('Error fetching categories with counts:', error);
    return [];
  }
}

export async function getPostsByAuthorId(authorId: string): Promise<Post[]> {
  try {
    const db = await getDb();
    const postsCollection = db.collection('posts');
    // Fetch only 'accepted' posts for public author profiles
    const postsFromDb = await postsCollection.find({ "author.id": authorId, status: 'accepted' }).sort({ date: -1 }).toArray();
    return postsFromDb.map(mapPostToDto);
  } catch (error)
{
    console.error('Error fetching posts by author ID:', error);
    return [];
  }
}

export async function deletePostsByAuthorId(authorId: string): Promise<boolean> {
  try {
    const db = await getDb();
    const postsCollection = db.collection('posts');
    const result = await postsCollection.deleteMany({ "author.id": authorId });
    console.log(`Deleted ${result.deletedCount} posts for author ID ${authorId}`);
    revalidatePath('/');
    revalidatePath('/admin/blogs');
    allStaticCategories.forEach(cat => revalidatePath(`/category/${cat.slug}`));
    revalidatePath(`/profile/${authorId}`);
    return result.acknowledged;
  } catch (error) {
    console.error(`Error deleting posts by author ID ${authorId}:`, error);
    return false;
  }
}


export async function searchPostsByTitleOrContent(query: string): Promise<Post[]> {
  try {
    const db = await getDb();
    const postsCollection = db.collection('posts');

    const regex = new RegExp(query, 'i');

    // Search only 'accepted' posts
    const postsFromDb = await postsCollection.find({
      status: 'accepted', 
      $or: [
        { title: { $regex: regex } },
        { content: { $regex: regex } },
        { "author.name": { $regex: regex } },
        { category: { $regex: regex } }
      ]
    }).sort({ date: -1 }).toArray();

    return postsFromDb.map(mapPostToDto);
  } catch (error) {
    console.error('Error searching posts:', error);
    return [];
  }
}


// export async function seedPosts(): Promise<{ success: boolean, count: number, message?: string }> {
//   console.log('Attempting to seed database with dummy posts...');
//   if (!process.env.MONGODB_URI) {
//     console.error('MONGODB_URI is not set. Seeding cannot proceed.');
//     return { success: false, count: 0, message: 'MONGODB_URI not configured.' };
//   }

//   try {
//     const userSeedResult = await seedUsers();
//     console.log(`User seeding result: ${userSeedResult.message} (Count: ${userSeedResult.count})`);

//     const db = await getDb();
//     const postsCollection = db.collection('posts');
//     let createdCount = 0;

//     for (const postData of dummyPostsData) {
//       const existingPost = await postsCollection.findOne({ title: postData.title });
//       if (existingPost) {
//         // Update status if it's different for already existing seeded posts
//         if (existingPost.status !== postData.status) {
//             await postsCollection.updateOne(
//                 { _id: existingPost._id },
//                 { $set: { status: postData.status || 'accepted' } } // Default to accepted if status is missing in dummy data
//             );
//             console.log(`Updated status for post "${postData.title}" to "${postData.status || 'accepted'}".`);
//         } else {
//             console.log(`Post "${postData.title}" already exists with status "${existingPost.status}". Skipping creation.`);
//         }
//         continue;
//       }

//       const authorDetails = dummyAuthors[postData.authorName];
//       if (!authorDetails) {
//           console.warn(`Author details for "${postData.authorName}" not found in dummyAuthors map. Skipping post "${postData.title}".`);
//           continue;
//       }

//       const authorExists = await getUserProfile(authorDetails.id);
//       if (!authorExists) {
//           console.warn(`Author with ID "${authorDetails.id}" (${postData.authorName}) not found via getUserProfile. Skipping post "${postData.title}". Ensure users are seeded correctly or IDs match.`);
//           continue;
//       }
//       if (authorExists.isBlocked) {
//            console.warn(`Author with ID "${authorDetails.id}" (${postData.authorName}) is blocked. Skipping post creation for "${postData.title}".`);
//            continue;
//       }


//       const category = allStaticCategories.find(c => c.slug === postData.categorySlug) ||
//                        allStaticCategories[Math.floor(Math.random() * allStaticCategories.length)];

//       const result = await createPost({
//         title: postData.title,
//         content: postData.content,
//         categorySlug: category.slug,
//         authorId: authorDetails.id,
//         imageUrl: postData.imageUrl,
//         status: postData.status || 'pending', // Pass status from dummy data, default to pending
//       });

//       if (result) {
//         createdCount++;
//         console.log(`Created post: "${result.title}" by author ID: ${authorDetails.id} with status: ${result.status}`);
//       } else {
//         console.warn(`Failed to create post: "${postData.title}" (Author ID: ${authorDetails.id})`);
//       }
//     }

//     if (createdCount > 0) {
//       revalidatePath('/');
//       revalidatePath('/admin/blogs');
//       allStaticCategories.forEach(cat => revalidatePath(`/category/${cat.slug}`));
//       console.log(`Successfully created/updated ${createdCount} posts and revalidated paths.`);
//     } else if (dummyPostsData.length > 0) {
//       console.log('No new posts were created. They may already exist and statuses were up-to-date, or author data was missing/mismatched, or authors were blocked.');
//     } else {
//       console.log('No dummy posts data provided to seed.');
//     }

//     return { success: true, count: createdCount, message: `Seeded/Updated ${createdCount} posts.` };
//   } catch (error) {
//     console.error('Error seeding posts:', error);
//     return { success: false, count: 0, message: `Error seeding posts: ${error instanceof Error ? error.message : String(error)}` };
//   }
// }

