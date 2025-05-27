
// src/app/actions/post.actions.ts
'use server';

import clientPromise from '@/lib/mongodb';
import type { Post, Comment, UserSummary, User, CreatePostInput as CreatePostInputType,  UpdatePostData } from '@/types'; 
import { ObjectId, UpdateFilter as MongoUpdateFilter } from 'mongodb'; // Removed Document import
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
    imageUrl: post.imageUrl || undefined, // Ensure undefined if not present
    comments: Array.isArray(post.comments) ? post.comments.map(mapCommentToDto) : [],
    date: post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
    status: post.status || 'pending', 
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
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
      return mapPostToDto(postFromDb);
    }
    return null;
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    return null;
  }
}

export type CreatePostActionInput = CreatePostInputType;

export async function createPost(data: CreatePostActionInput): Promise<Post | null> {
  try {
    const db = await getDb();
    const postsCollection = db.collection<Omit<Post, 'id' | '_id'>>('posts');

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
        imageUrl: author.profileImageUrl || undefined
    };
    
    let finalExcerpt = data.excerpt;
    if (!finalExcerpt || finalExcerpt.trim() === '') {
        finalExcerpt = data.content.substring(0, 150) + (data.content.length > 150 ? '...' : '');
    }


    const newPostData: Omit<Post, '_id' | 'id'> = {
      title: data.title,
      content: data.content,
      excerpt: finalExcerpt,
      category: data.categorySlug,
      author: authorSummary,
      imageUrl: data.imageUrl || '', 
      date: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      shares: 0,
      comments: [],
      status: data.status || 'pending', 
      updatedAt: new Date().toISOString(),
    };

    const result = await postsCollection.insertOne(newPostData as any);

    revalidatePath('/');
    revalidatePath(`/category/${data.categorySlug}`);
    revalidatePath(`/posts/${result.insertedId.toString()}`); 
    revalidatePath(`/profile/${data.authorId}`);
    revalidatePath('/admin/blogs'); 

    const createdPostDoc = await db.collection('posts').findOne({_id: result.insertedId});
    return createdPostDoc ? mapPostToDto(createdPostDoc) : null;

  } catch (error) {
    console.error('Error creating post:', error);
    if (error instanceof Error && error.message === "Blocked users cannot create posts.") {
        throw error; 
    }
    return null;
  }
}

export async function updatePostAndSetPending(postId: string, data: UpdatePostData): Promise<Post | null> {
  try {
    if (!ObjectId.isValid(postId)) {
      console.error('Invalid ObjectId for updatePostAndSetPending:', postId);
      return null;
    }
    const db = await getDb();
    const postsCollection = db.collection<Post>('posts');

    const postToUpdate = await postsCollection.findOne({ _id: new ObjectId(postId) as any });
    if (!postToUpdate) {
      console.error(`Post with ID ${postId} not found for update.`);
      return null;
    }

    // Check if the author is blocked (important if this action can be called by non-admins later)
    // For now, assuming this is initiated by user editing their own post, or admin.
    // If initiated by user, the create-post page should check if the user is blocked before allowing submission.
    // If admin initiated, this check might be skipped or handled differently.

    let finalExcerpt = data.excerpt;
    if (!finalExcerpt || finalExcerpt.trim() === '') {
        finalExcerpt = data.content.substring(0, 150) + (data.content.length > 150 ? '...' : '');
    }

    const updatePayload: MongoUpdateFilter<Post> = {
      $set: {
        title: data.title,
        content: data.content,
        excerpt: finalExcerpt,
        category: data.categorySlug,
        imageUrl: data.imageUrl || undefined,
        status: 'pending', // Crucially set status to pending
        updatedAt: new Date().toISOString(),
      },
    };

    const result = await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) as any },
      updatePayload,
      { returnDocument: 'after' }
    );

    if (result) {
      const updatedPost = mapPostToDto(result);
      revalidatePath('/');
      revalidatePath(`/posts/${updatedPost.id}/${generateSlug(updatedPost.title)}`);
      if (updatedPost.category) revalidatePath(`/category/${updatedPost.category}`);
      if (updatedPost.author?.id) revalidatePath(`/profile/${updatedPost.author.id}`);
      revalidatePath('/admin/blogs');
      
      // Optionally notify admin about a re-submitted post for review, if needed.
      // Or notify user that their edited post is pending review.

      return updatedPost;
    }
    return null;
  } catch (error) {
    console.error('Error updating post and setting to pending:', error);
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
    const postsCollection = db.collection<Post>('posts');

    const result = await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) as any },
      { $set: { status: status, updatedAt: new Date().toISOString() } }, 
      { returnDocument: 'after' }
    );

    if (result) {
      const updatedPost = mapPostToDto(result);
      revalidatePath('/'); 
      revalidatePath('/admin/blogs'); 
      if (updatedPost.category) revalidatePath(`/category/${updatedPost.category}`);
      if (updatedPost.author?.id) revalidatePath(`/profile/${updatedPost.author.id}`);

      if ((status === 'accepted' || status === 'rejected') && updatedPost.author?.id) {
        const adminActor: UserSummary = {
          id: 'admin_system', 
          name: 'CardFeed Admin',
          imageUrl: undefined, 
        };
        if (updatedPost.author.id !== adminActor.id) {
          await createNotification(
            updatedPost.author.id,
            'post_status_change',
            updatedPost.id,
            generateSlug(updatedPost.title),
            updatedPost.title,
            adminActor,
            status 
          );
        }
      }
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
    const postsCollection = db.collection<Post>('posts');

    const postBeforeUpdate = await postsCollection.findOne({ _id: new ObjectId(postId) as any });
    if (!postBeforeUpdate) {
      console.error('Post not found for liking:', postId);
      return null;
    }


    const likedByArray = Array.isArray(postBeforeUpdate.likedBy) ? postBeforeUpdate.likedBy : [];
    const alreadyLiked = likedByArray.includes(userId);

    const updateOperation: MongoUpdateFilter<Post> = { // Changed to Post
        $set: { updatedAt: new Date().toISOString() }
    };


    if (alreadyLiked) {
      updateOperation.$inc = { likes: -1 };
      updateOperation.$pull = { likedBy: userId }; // This should now be type-correct
    } else {
      updateOperation.$inc = { likes: 1 };
      updateOperation.$addToSet = { likedBy: userId }; // This should also be type-correct
    }

    const result = await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) as any },
      updateOperation, // updateOperation is now MongoUpdateFilter<Post>
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
            imageUrl: actingUser.profileImageUrl || undefined
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
    console.log("Like post result was null, post not found or not updated.");
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
    const postsCollection = db.collection<Post>('posts');
    
    const result = await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) as any },
      { $inc: { shares: 1 }, $set: {updatedAt: new Date().toISOString()} },
      { returnDocument: 'after' }
    );

    if (result) {
      const updatedPost = mapPostToDto(result);
      revalidatePath('/');
      revalidatePath(`/posts/${postId}`);
      if (updatedPost.author?.id) revalidatePath(`/profile/${updatedPost.author.id}`);
      revalidatePath('/admin/blogs');
      return updatedPost;
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
    const postsCollection = db.collection<Post>('posts');

    const actingUserSummary: UserSummary = {
        id: commentData.authorId,
        name: commentData.authorName,
        imageUrl: commentData.authorImageUrl || undefined
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
      { _id: new ObjectId(commentData.postId) as any },
      { $push: { comments: commentForDb as any }, $set: {updatedAt: new Date().toISOString()} },
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

export async function getPostsByAuthorId(authorId: string, forOwnProfileView: boolean = false): Promise<Post[]> {
  try {
    const db = await getDb();
    const postsCollection = db.collection('posts');
    const query: any = { "author.id": authorId };
    
    if (!forOwnProfileView) {
      query.status = 'accepted'; 
    }

    const postsFromDb = await postsCollection.find(query).sort({ date: -1 }).toArray();
    return postsFromDb.map(mapPostToDto);
  } catch (error) {
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


const dummyAuthors: { [key: string]: Pick<UserSummary, 'id' | 'imageUrl'> & { name: string } } = {
  "Dr. Ada Lovelace": { id: "author-ada", name: "Dr. Ada Lovelace", imageUrl: undefined },
  "Marco Polo Jr.": { id: "author-marco", name: "Marco Polo Jr.", imageUrl: undefined },
  "Julia Childish": { id: "author-julia", name: "Julia Childish", imageUrl: undefined },
  "Marie Kondoversy": { id: "author-marie", name: "Marie Kondoversy", imageUrl: undefined },
  "Elon Tusk": { id: "author-elon", name: "Elon Tusk", imageUrl: undefined },
  "Buddha Lee": { id: "author-buddha", name: "Buddha Lee", imageUrl: undefined },
  "Satoshi Notamoto": { id: "author-satoshi", name: "Satoshi Notamoto", imageUrl: undefined },
  "Prof. Xavier": { id: "author-xavier", name: "Prof. Xavier", imageUrl: undefined },
  "Banksy Not": { id: "author-banksy", name: "Banksy Not", imageUrl: undefined },
  "Dr. Dreamwell": { id: "author-dreamwell", name: "Dr. Dreamwell", imageUrl: undefined },
  "Patty Planter": {id: "author-patty", name: "Patty Planter", imageUrl: undefined},
  "Henry Ford II": {id: "author-henry", name: "Henry Ford II", imageUrl: undefined},
  "Cesar Millan Jr.": {id: "author-cesar", name: "Cesar Millan Jr.", imageUrl: undefined},
  "Ninja Turtle": {id: "author-ninja", name: "Ninja Turtle", imageUrl: undefined},
  "Pac Man": {id: "author-pacman", name: "Pac Man", imageUrl: undefined},
  "Martha Stewart Jr.": {id: "author-martha", name: "Martha Stewart Jr."} // imageUrl intentionally undefined for fallback testing
};


const dummyPostsData: Array<Omit<CreatePostActionInput, 'authorId'> & { authorName: string, dataAiHint?: string }> = [
  {
    title: "The Future of AI in Web Development",
    content: "Artificial Intelligence is rapidly changing the landscape of web development. From automated testing suites that learn and adapt, to AI-powered code generation tools that can write boilerplate or even complex algorithms, developers are finding new ways to leverage AI. This post explores the current impact and future possibilities of AI in creating more efficient, intelligent, and personalized web experiences. We'll delve into machine learning models for user behavior prediction, natural language processing for chatbots and voice interfaces, and computer vision for enhanced image handling and accessibility.",
    excerpt: "AI is transforming web development, from automated testing to code generation. Explore its impact.",
    categorySlug: "technology",
    authorName: "Dr. Ada Lovelace",
    imageUrl: "https://placehold.co/600x400.png", dataAiHint: "technology abstract",
    status: "accepted",
  },
  {
    title: "Exploring the Hidden Gems of Southeast Asia",
    content: "Southeast Asia is a treasure trove of breathtaking landscapes, rich cultures, and vibrant histories often missed by mainstream tourism. This journey takes you off the beaten path to discover untouched temples shrouded in jungle, pristine beaches accessible only by local longtail boats, and bustling local markets brimming with exotic flavors and crafts. We'll share stories from remote villages, tips for responsible travel, and a guide to the most authentic culinary experiences that this diverse region has to offer.",
    excerpt: "Discover untouched temples, pristine beaches, and vibrant markets in Southeast Asia.",
    categorySlug: "travel",
    authorName: "Marco Polo Jr.",
    imageUrl: "https://placehold.co/600x400.png", dataAiHint: "travel landscape",
    status: "accepted",
  },
  {
    title: "Mastering Sourdough: A Beginner's Guide",
    content: "Baking sourdough bread can seem daunting with its talk of starters, hydration levels, and lengthy fermentation times. However, with a little patience and this step-by-step guide, even a novice baker can achieve a delicious, crusty loaf with that signature tangy crumb. We cover everything from creating and maintaining your own sourdough starter, to kneading techniques, shaping your dough, and achieving the perfect bake in a home oven. Troubleshooting common issues is also included!",
    excerpt: "A beginner-friendly guide to baking perfect sourdough bread, from starter to a crusty loaf.",
    categorySlug: "food",
    authorName: "Julia Childish",
    imageUrl: "https://placehold.co/600x400.png", dataAiHint: "food bread",
    status: "accepted",
  },
  {
    title: "Minimalist Living: Declutter Your Life and Mind",
    content: "Minimalism is more than just an aesthetic; it's a mindset and a lifestyle choice that can lead to reduced stress, increased focus, and greater freedom. This article explores the core principles of minimalist living, offering practical tips on how to declutter your physical space, your digital life, and even your mental clutter. We'll discuss the benefits of conscious consumption, letting go of possessions that no longer serve you, and creating a home environment that supports peace and clarity.",
    excerpt: "Embrace minimalist living to reduce stress, gain focus, and declutter your home and mind.",
    categorySlug: "lifestyle",
    authorName: "Marie Kondoversy",
    imageUrl: undefined, dataAiHint: "lifestyle simple",
    status: "pending",
  },
  {
    title: "The Rise of Sustainable Business Practices",
    content: "Sustainability is no longer a buzzword but a crucial component of modern business strategy. Companies worldwide are recognizing the importance of environmental, social, and governance (ESG) factors in building long-term value and resilience. This post examines the key drivers behind the shift towards sustainable business practices, showcases innovative companies leading the way, and discusses the challenges and opportunities that lie ahead. From circular economy models to renewable energy adoption, learn how businesses are making a positive impact.",
    excerpt: "Explore how businesses are adopting sustainable practices for long-term value and impact.",
    categorySlug: "business",
    authorName: "Elon Tusk",
    imageUrl: "https://placehold.co/600x400.png", dataAiHint: "business meeting",
    status: "accepted",
  },
  {
    title: "Mindfulness Meditation for Stress Reduction",
    content: "In our fast-paced world, stress has become a common ailment. Mindfulness meditation offers a powerful, accessible tool for managing stress, enhancing self-awareness, and improving overall well-being. This guide introduces simple mindfulness techniques that can be practiced anywhere, anytime. We'll explore the science behind how meditation affects the brain and body, provide tips for starting a consistent practice, and discuss how to integrate mindfulness into daily life for lasting calm and resilience.",
    excerpt: "Learn simple mindfulness meditation techniques to manage stress and improve well-being.",
    categorySlug: "health-wellness",
    authorName: "Buddha Lee",
    imageUrl: undefined, dataAiHint: "health meditation",
    status: "accepted",
  },
  {
    title: "Understanding Cryptocurrency: Beyond Bitcoin",
    content: "Cryptocurrency is a complex and rapidly evolving field that extends far beyond Bitcoin. This article aims to demystify the world of digital currencies, explaining core concepts like blockchain technology, altcoins, decentralized finance (DeFi), and non-fungible tokens (NFTs). We'll discuss the potential benefits and risks of investing in cryptocurrencies, the regulatory landscape, and the future implications of this transformative technology on various industries.",
    excerpt: "Dive into the world of cryptocurrency, exploring blockchain, altcoins, DeFi, and NFTs.",
    categorySlug: "finance",
    authorName: "Satoshi Notamoto",
    imageUrl: "https://placehold.co/600x400.png", dataAiHint: "finance crypto",
    status: "rejected",
  },
  {
    title: "The Gamification of Learning: Engaging Students",
    content: "Gamification is transforming education by applying game design elements and principles in non-game contexts. This approach can significantly increase student engagement, motivation, and knowledge retention. This post explores various gamification techniques, such as points, badges, leaderboards, and narrative structures, and how they can be effectively integrated into curricula. We'll look at successful case studies and discuss the potential of gamified learning to create more interactive and enjoyable educational experiences.",
    excerpt: "Discover how gamification elements are revolutionizing education and student engagement.",
    categorySlug: "education",
    authorName: "Prof. Xavier",
    imageUrl: "https://placehold.co/600x400.png", dataAiHint: "education classroom",
    status: "accepted",
  },
  {
    title: "The Evolution of Street Art",
    content: "Street art has undergone a remarkable transformation from its clandestine graffiti roots to a globally recognized and celebrated art form. This article traces the journey of street art, exploring its diverse styles, influential artists, and its cultural impact on urban landscapes. We'll discuss the debates surrounding its legality and commercialization, and how street art continues to challenge conventions and provide a powerful platform for social commentary and artistic expression.",
    excerpt: "Trace the journey of street art from graffiti roots to a celebrated global art form.",
    categorySlug: "arts-culture",
    authorName: "Banksy Not",
    imageUrl: undefined, dataAiHint: "art graffiti",
    status: "accepted",
  },
  {
    title: "The Science of Sleep: Why It's Crucial",
    content: "Sleep is not a luxury but a biological necessity, crucial for our physical and mental health. This article delves into the science of sleep, explaining the different sleep stages, the role of circadian rhythms, and how sleep impacts everything from cognitive function and emotional regulation to immune response and metabolic health. We'll also provide evidence-based tips for improving sleep hygiene and discuss common sleep disorders and their treatments.",
    excerpt: "Explore the science of sleep, its importance for health, and tips for better sleep hygiene.",
    categorySlug: "science",
    authorName: "Dr. Dreamwell",
    imageUrl: "https://placehold.co/600x400.png", dataAiHint: "science lab",
    status: "pending",
  },
  {
    title: "Urban Gardening: Grow Food in Small Spaces",
    content: "You don't need a large backyard to enjoy the benefits of gardening. Urban gardening techniques allow you to grow fresh herbs, vegetables, and flowers even in small spaces like balconies, rooftops, and windowsills. This guide covers container gardening, vertical gardening, hydroponics for beginners, and tips for choosing the right plants for your urban environment. Discover the joy of harvesting your own food and greening your city life.",
    excerpt: "Learn to create thriving urban gardens on balconies, rooftops, and windowsills.",
    categorySlug: "home-garden",
    authorName: "Patty Planter",
    imageUrl: "https://placehold.co/600x400.png", dataAiHint: "garden plants",
    status: "accepted",
  },
  {
    title: "The Future of Electric Vehicles: Beyond Tesla",
    content: "Electric vehicles (EVs) are revolutionizing the automotive industry, with advancements in battery technology, charging infrastructure, and autonomous driving capabilities. While Tesla has been a dominant force, the EV market is rapidly expanding with new players and innovations. This article explores the evolving world of electric vehicles, discussing current trends, challenges like range anxiety and charging accessibility, and the potential for EVs to reshape transportation and contribute to a more sustainable future.",
    excerpt: "Explore the evolving world of electric vehicles, from battery tech to autonomous driving.",
    categorySlug: "automotive",
    authorName: "Henry Ford II",
    imageUrl: undefined, dataAiHint: "automotive car",
    status: "accepted",
  },
  {
    title: "Decoding Your Dog: Canine Behavior",
    content: "Our canine companions communicate in ways that are often misunderstood. This article helps you decode your dog's behavior by exploring common body language signals, vocalizations, and social cues. Learn to understand what your dog is trying to tell you, from tail wags and ear positions to barks and growls. We'll also cover common behavioral issues, positive reinforcement training techniques, and how to build a stronger bond with your furry friend based on mutual understanding.",
    excerpt: "Understand your dog's body language, vocalizations, and behavior for a stronger bond.",
    categorySlug: "pets",
    authorName: "Cesar Millan Jr.",
    imageUrl: "https://placehold.co/600x400.png", dataAiHint: "pets dog",
    status: "accepted",
  },
  {
    title: "The Impact of eSports on Traditional Sports",
    content: "eSports have exploded in popularity, evolving from niche competitions to a global phenomenon with massive prize pools and dedicated fan bases. This article examines the rise of eSports, its economic impact, and how it's influencing and sometimes challenging traditional sports. We'll discuss the lifestyle of professional gamers, the development of eSports leagues, and the growing recognition of eSports as a legitimate competitive field.",
    excerpt: "Examine the rise of eSports, its economic impact, and its relationship with traditional sports.",
    categorySlug: "sports",
    authorName: "Ninja Turtle",
    imageUrl: "https://placehold.co/600x400.png", dataAiHint: "sports game",
    status: "accepted",
  },
  {
    title: "Retro Gaming Revival: Classic Video Games",
    content: "Nostalgia is a powerful force, and it's fueling a major revival in retro gaming. Classic 8-bit and 16-bit video games are finding new audiences, while original hardware and emulators are in high demand. This post explores the reasons behind the retro gaming resurgence, the communities that keep these games alive, and how modern game developers are drawing inspiration from these timeless classics. We'll also look at the best ways to experience retro games today.",
    excerpt: "Explore the retro gaming revival and why classic video games are making a comeback.",
    categorySlug: "gaming",
    authorName: "Pac Man",
    imageUrl: undefined, dataAiHint: "gaming controller",
    status: "pending",
  },
  {
    title: "DIY Home Decor: Budget-Friendly Ideas",
    content: "Transform your living space without breaking the bank! This article is packed with creative and budget-friendly DIY home decor ideas. From upcycling old furniture and creating unique wall art to simple craft projects that add personality to any room, we provide step-by-step instructions and inspiration. Discover how a little creativity and effort can make your home more beautiful and reflective of your personal style, all while saving money.",
    excerpt: "Discover budget-friendly DIY home decor ideas to personalize your living space.",
    categorySlug: "home-garden",
    authorName: "Martha Stewart Jr.",
    imageUrl: "https://placehold.co/600x400.png", dataAiHint: "home decor",
    status: "accepted",
  }
];

export async function seedPosts(): Promise<{ success: boolean, count: number, message?: string }> {
  console.log('Attempting to seed database with dummy posts...');
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Seeding cannot proceed.');
    return { success: false, count: 0, message: 'MONGODB_URI not configured.' };
  }

  try {
    const userSeedResult = await seedUsers();
    console.log(`User seeding result: ${userSeedResult.message} (Count: ${userSeedResult.count})`);

    const db = await getDb();
    const postsCollection = db.collection('posts');
    let createdCount = 0;

    for (const postData of dummyPostsData) {
      const existingPost = await postsCollection.findOne({ title: postData.title });
      if (existingPost) {
        if (existingPost.status !== postData.status) {
            await postsCollection.updateOne(
                { _id: existingPost._id },
                { $set: { status: postData.status || 'accepted', updatedAt: new Date().toISOString() } } 
            );
            console.log(`Updated status for post "${postData.title}" to "${postData.status || 'accepted'}".`);
        } else {
            console.log(`Post "${postData.title}" already exists with status "${existingPost.status}". Skipping creation.`);
        }
        continue;
      }

      const authorDetails = dummyAuthors[postData.authorName];
      if (!authorDetails) {
          console.warn(`Author details for "${postData.authorName}" not found in dummyAuthors map. Skipping post "${postData.title}".`);
          continue;
      }

      const authorExists = await getUserProfile(authorDetails.id);
      if (!authorExists) {
          console.warn(`Author with ID "${authorDetails.id}" (${postData.authorName}) not found via getUserProfile. Skipping post "${postData.title}". Ensure users are seeded correctly or IDs match.`);
          continue;
      }
      if (authorExists.isBlocked) {
           console.warn(`Author with ID "${authorDetails.id}" (${postData.authorName}) is blocked. Skipping post creation for "${postData.title}".`);
           continue;
      }


      const category = allStaticCategories.find(c => c.slug === postData.categorySlug) ||
                       allStaticCategories[Math.floor(Math.random() * allStaticCategories.length)];

      const result = await createPost({
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt, 
        categorySlug: category.slug,
        authorId: authorDetails.id,
        imageUrl: postData.imageUrl,
        status: postData.status || 'pending', 
      });

      if (result) {
        createdCount++;
        console.log(`Created post: "${result.title}" by author ID: ${authorDetails.id} with status: ${result.status}`);
      } else {
        console.warn(`Failed to create post: "${postData.title}" (Author ID: ${authorDetails.id})`);
      }
    }

    if (createdCount > 0) {
      revalidatePath('/');
      revalidatePath('/admin/blogs');
      allStaticCategories.forEach(cat => revalidatePath(`/category/${cat.slug}`));
      console.log(`Successfully created/updated ${createdCount} posts and revalidated paths.`);
    } else if (dummyPostsData.length > 0) {
      console.log('No new posts were created. They may already exist and statuses were up-to-date, or author data was missing/mismatched, or authors were blocked.');
    } else {
      console.log('No dummy posts data provided to seed.');
    }

    return { success: true, count: createdCount, message: `Seeded/Updated ${createdCount} posts.` };
  } catch (error) {
    console.error('Error seeding posts:', error);
    return { success: false, count: 0, message: `Error seeding posts: ${error instanceof Error ? error.message : String(error)}` };
  }
}


