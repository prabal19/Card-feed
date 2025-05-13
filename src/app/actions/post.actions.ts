// src/app/actions/post.actions.ts
'use server';

import clientPromise from '@/lib/mongodb';
import type { Post, Comment, UserSummary, User } from '@/types';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { categories as allStaticCategories } from '@/lib/data';
import { seedUsers, getUserProfile } from './user.actions'; // Import user actions
import { createNotification } from './notification.actions'; // Import notification actions
import { generateSlug } from '@/lib/utils';

async function getDb() {
  const client = await clientPromise;
  return client.db(); // Use your database name if specified in MONGODB_URI, or default
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
  };
}


export async function getPosts(page = 1, limit = 8, categorySlug?: string): Promise<{ posts: Post[], hasMore: boolean, totalPosts: number }> {
  try {
    const db = await getDb();
    const postsCollection = db.collection('posts');
    
    const query: any = {};
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


export interface CreatePostInput {
  title: string;
  content: string;
  categorySlug: string;
  authorId: string; 
  imageUrl?: string; 
}

export async function createPost(data: CreatePostInput): Promise<Post | null> {
  try {
    const db = await getDb();
    const postsCollection = db.collection('posts');

    const author = await getUserProfile(data.authorId);
    if (!author) {
        console.error(`Author with ID ${data.authorId} not found.`);
        return null;
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
    };

    const result = await postsCollection.insertOne(newPostData as any); // MongoDB driver expects _id to be potentially generated
    
    revalidatePath('/');
    revalidatePath(`/category/${data.categorySlug}`);
    revalidatePath(`/posts/${result.insertedId.toString()}`); 
    revalidatePath(`/profile/${data.authorId}`); // Revalidate author's profile page

    // Fetch the inserted document to ensure it's in the correct DTO format
    const createdPost = await postsCollection.findOne({_id: result.insertedId});
    return createdPost ? mapPostToDto(createdPost) : null;

  } catch (error) {
    console.error('Error creating post:', error);
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

    const db = await getDb();
    const postsCollection = db.collection('posts');
    
    const postBeforeUpdate = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!postBeforeUpdate) {
      console.error('Post not found for liking:', postId);
      return null;
    }

    const likedByArray = Array.isArray(postBeforeUpdate.likedBy) ? postBeforeUpdate.likedBy : [];
    const alreadyLiked = likedByArray.includes(userId);
    
    let updateOperation;

    if (alreadyLiked) {
      updateOperation = {
        $inc: { likes: -1 },
        $pull: { likedBy: userId },
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
      
      // Create notification if not already liked and it's not the author's own post
      if (!alreadyLiked && updatedPost.author?.id && updatedPost.author.id !== userId) {
        const likingUser = await getUserProfile(userId);
        if (likingUser) {
          const actingUserSummary: UserSummary = {
            id: likingUser.id,
            name: `${likingUser.firstName} ${likingUser.lastName}`,
            imageUrl: likingUser.profileImageUrl
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
    
    const result = await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { $inc: { shares: 1 } },
      { returnDocument: 'after' }
    );
    
    if (result) {
      revalidatePath('/');
      revalidatePath(`/posts/${postId}`);
      if (result.author?.id) revalidatePath(`/profile/${result.author.id}`);
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
    const db = await getDb();
    const postsCollection = db.collection('posts');
    
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

      // Create notification if it's not the author's own post
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
    return null;
  }
}

export async function getCategoriesWithCounts(): Promise<Array<{ category: string, count: number }>> {
  try {
    const db = await getDb();
    const postsCollection = db.collection('posts');
    const aggregationResult = await postsCollection.aggregate([
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
    const postsFromDb = await postsCollection.find({ "author.id": authorId }).sort({ date: -1 }).toArray();
    return postsFromDb.map(mapPostToDto);
  } catch (error) {
    console.error('Error fetching posts by author ID:', error);
    return [];
  }
}

export async function searchPostsByTitleOrContent(query: string): Promise<Post[]> {
  try {
    const db = await getDb();
    const postsCollection = db.collection('posts');
    
    // Case-insensitive regex search
    const regex = new RegExp(query, 'i'); 
    
    const postsFromDb = await postsCollection.find({
      $or: [
        { title: { $regex: regex } },
        { content: { $regex: regex } },
        { "author.name": { $regex: regex } }, // Also search by author name within posts
        { category: { $regex: regex } }
      ]
    }).sort({ date: -1 }).toArray(); // Sort by date, or potentially relevance score if using text index
    
    return postsFromDb.map(mapPostToDto);
  } catch (error) {
    console.error('Error searching posts:', error);
    return [];
  }
}


const dummyAuthors: { [key: string]: Pick<UserSummary, 'id' | 'imageUrl'> & { name: string } } = {
  "Dr. Ada Lovelace": { id: "author-ada", name: "Dr. Ada Lovelace", imageUrl: "https://picsum.photos/seed/adalovelace/40/40" },
  "Marco Polo Jr.": { id: "author-marco", name: "Marco Polo Jr.", imageUrl: "https://picsum.photos/seed/marcopolo/40/40" },
  "Julia Childish": { id: "author-julia", name: "Julia Childish", imageUrl: "https://picsum.photos/seed/juliachildish/40/40" },
  "Marie Kondoversy": { id: "author-marie", name: "Marie Kondoversy", imageUrl: "https://picsum.photos/seed/mariekondoversy/40/40" },
  "Elon Tusk": { id: "author-elon", name: "Elon Tusk", imageUrl: "https://picsum.photos/seed/elontusk/40/40" },
  "Buddha Lee": { id: "author-buddha", name: "Buddha Lee", imageUrl: "https://picsum.photos/seed/buddhalee/40/40" },
  "Satoshi Notamoto": { id: "author-satoshi", name: "Satoshi Notamoto", imageUrl: "https://picsum.photos/seed/satoshinotamoto/40/40" },
  "Prof. Xavier": { id: "author-xavier", name: "Prof. Xavier", imageUrl: "https://picsum.photos/seed/profxavier/40/40" },
  "Banksy Not": { id: "author-banksy", name: "Banksy Not", imageUrl: "https://picsum.photos/seed/banksynot/40/40" },
  "Dr. Dreamwell": { id: "author-dreamwell", name: "Dr. Dreamwell", imageUrl: "https://picsum.photos/seed/drdreamwell/40/40" },
  "Patty Planter": {id: "author-patty", name: "Patty Planter", imageUrl: "https://picsum.photos/seed/pattyplanter/40/40"},
  "Henry Ford II": {id: "author-henry", name: "Henry Ford II", imageUrl: "https://picsum.photos/seed/henryfordii/40/40"},
  "Cesar Millan Jr.": {id: "author-cesar", name: "Cesar Millan Jr.", imageUrl: "https://picsum.photos/seed/cesarmillanjr/40/40"},
  "Ninja Turtle": {id: "author-ninja", name: "Ninja Turtle", imageUrl: "https://picsum.photos/seed/ninjaturtle/40/40"},
  "Pac Man": {id: "author-pacman", name: "Pac Man", imageUrl: "https://picsum.photos/seed/pacman/40/40"},
  "Martha Stewart Jr.": {id: "author-martha", name: "Martha Stewart Jr.", imageUrl: "https://picsum.photos/seed/marthastewartjr/40/40"}
};


const dummyPostsData: Array<Omit<CreatePostInput, 'authorId'> & { authorName: string }> = [
  {
    title: "The Future of AI in Web Development",
    content: "Artificial Intelligence is rapidly changing the landscape of web development. From automated testing to AI-powered code generation, the possibilities are endless. This post explores the current trends and future potential of AI in creating smarter, more efficient web applications. We'll delve into machine learning models that can predict user behavior, personalize experiences, and even assist in UI/UX design. Join us as we navigate the exciting intersection of AI and web development.",
    categorySlug: "technology",
    authorName: "Dr. Ada Lovelace",
    imageUrl: "https://picsum.photos/seed/aiwebdev/600/400"
  },
  {
    title: "Exploring the Hidden Gems of Southeast Asia",
    content: "Southeast Asia is a treasure trove of breathtaking landscapes, vibrant cultures, and culinary delights often missed by mainstream tourists. This travelogue takes you off the beaten path to discover ancient temples shrouded in jungle, pristine beaches untouched by resorts, and bustling local markets brimming with exotic flavors. Learn about sustainable travel practices and connect with the authentic spirit of this enchanting region. Pack your bags for an adventure you'll never forget!",
    categorySlug: "travel",
    authorName: "Marco Polo Jr.",
    imageUrl: "https://picsum.photos/seed/seasiatravel/600/400"
  },
    {
    title: "Mastering Sourdough: A Beginner's Guide",
    content: "Baking sourdough bread can seem daunting, but with this step-by-step guide, even beginners can achieve a perfect loaf with a tangy flavor and a beautifully crisp crust. We cover everything from creating and maintaining your starter to kneading techniques, shaping, and baking. Troubleshoot common issues and learn the science behind this ancient baking tradition. Get ready to fill your home with the irresistible aroma of freshly baked sourdough!",
    categorySlug: "food",
    authorName: "Julia Childish",
    imageUrl: "https://picsum.photos/seed/sourdoughguide/600/400"
  },
  {
    title: "Minimalist Living: Declutter Your Life and Mind",
    content: "Minimalism is more than just an aesthetic; it's a lifestyle choice that can lead to reduced stress, increased focus, and greater financial freedom. This post explores the core principles of minimalist living, offering practical tips to declutter your physical space, digital life, and even your mental landscape. Discover the joy of owning less and living more intentionally. Start your journey towards a simpler, more fulfilling life today.",
    categorySlug: "lifestyle",
    authorName: "Marie Kondoversy",
    imageUrl: "https://picsum.photos/seed/minimalistlife/600/400"
  },
  {
    title: "The Rise of Sustainable Business Practices",
    content: "Sustainability is no longer a buzzword but a critical component of modern business strategy. This article examines how companies are integrating environmentally friendly and socially responsible practices into their operations. From renewable energy adoption to ethical sourcing and circular economy models, learn about the businesses leading the charge and the benefits of building a sustainable future. Discover how conscious consumerism is driving this important shift.",
    categorySlug: "business",
    authorName: "Elon Tusk",
    imageUrl: "https://picsum.photos/seed/sustainablebiz/600/400"
  },
  {
    title: "Mindfulness Meditation for Stress Reduction",
    content: "In our fast-paced world, stress has become a common ailment. Mindfulness meditation offers a powerful tool to calm the mind, reduce anxiety, and improve overall well-being. This guide introduces simple meditation techniques suitable for beginners, explaining the science behind its benefits. Learn how to incorporate mindfulness into your daily routine for a more peaceful and centered life. Find your inner calm amidst the chaos.",
    categorySlug: "health-wellness",
    authorName: "Buddha Lee",
    imageUrl: "https://picsum.photos/seed/mindfulnessmed/600/400"
  },
  {
    title: "Understanding Cryptocurrency: Beyond Bitcoin",
    content: "Cryptocurrency is a complex and rapidly evolving field. While Bitcoin often steals the headlines, a vast ecosystem of alternative coins (altcoins), decentralized finance (DeFi) applications, and non-fungible tokens (NFTs) exists. This post breaks down the fundamentals of blockchain technology and explores the diverse applications of various cryptocurrencies. Whether you're a curious newcomer or an experienced investor, this guide will help you navigate the exciting world of digital assets.",
    categorySlug: "finance",
    authorName: "Satoshi Notamoto",
    imageUrl: "https://picsum.photos/seed/cryptounderstand/600/400"
  },
  {
    title: "The Gamification of Learning: Engaging Students",
    content: "Gamification is transforming education by applying game-design elements to learning environments. This article explores how points, badges, leaderboards, and interactive challenges can increase student motivation, engagement, and knowledge retention. Discover successful case studies and learn how educators can effectively integrate gamification strategies into their classrooms. Making learning fun is the future of education!",
    categorySlug: "education",
    authorName: "Prof. Xavier",
    imageUrl: "https://picsum.photos/seed/gamifiedlearning/600/400"
  },
  {
    title: "The Evolution of Street Art",
    content: "Street art has undergone a remarkable transformation, evolving from an underground subculture to a globally recognized art form. This piece traces the history of street art, from its graffiti roots to the elaborate murals adorning cityscapes today. We explore the works of influential artists, discuss the social and political messages often embedded in their creations, and examine the ongoing debate about its place in the art world. Discover the vibrant and dynamic world of urban art.",
    categorySlug: "arts-culture",
    authorName: "Banksy Not",
    imageUrl: "https://picsum.photos/seed/streetartevo/600/400"
  },
  {
    title: "The Science of Sleep: Why It's Crucial",
    content: "Sleep is not a luxury but a biological necessity. This article delves into the science of sleep, exploring its various stages, its impact on physical and mental health, and the consequences of sleep deprivation. Learn about common sleep disorders and discover evidence-based tips for improving your sleep hygiene. Unlock the power of a good night's rest for a healthier, more productive life.",
    categorySlug: "science",
    authorName: "Dr. Dreamwell",
    imageUrl: "https://picsum.photos/seed/sciencesleep/600/400"
  },
  {
    title: "Urban Gardening: Grow Food in Small Spaces",
    content: "You don't need a large backyard to enjoy the benefits of gardening. This guide shows you how to create thriving urban gardens on balconies, rooftops, windowsills, and even indoors. Learn about container gardening, vertical farming techniques, and choosing the right plants for your space. Discover the joy of harvesting your own fresh herbs, vegetables, and fruits, no matter how limited your space.",
    categorySlug: "home-garden",
    authorName: "Patty Planter",
    imageUrl: "https://picsum.photos/seed/urbangarden/600/400"
  },
  {
    title: "The Future of Electric Vehicles: Beyond Tesla",
    content: "Electric vehicles (EVs) are revolutionizing the automotive industry. While Tesla has been a dominant force, a new wave of innovation is emerging from traditional automakers and new startups alike. This post explores advancements in battery technology, charging infrastructure, autonomous driving features, and the diverse range of EV models entering the market. Join us for a look at the exciting road ahead for electric mobility.",
    categorySlug: "automotive",
    authorName: "Henry Ford II",
    imageUrl: "https://picsum.photos/seed/futureevs/600/400"
  },
  {
    title: "Decoding Your Dog: Canine Behavior",
    content: "Our canine companions communicate in ways that are often misunderstood. This article dives into the fascinating world of dog behavior, helping you interpret their body language, vocalizations, and social cues. Learn about common behavioral issues, positive reinforcement training techniques, and how to build a stronger bond with your furry friend. Understanding your dog is the key to a harmonious relationship.",
    categorySlug: "pets",
    authorName: "Cesar Millan Jr.",
    imageUrl: "https://picsum.photos/seed/dogbehavior/600/400"
  },
  {
    title: "The Impact of eSports on Traditional Sports",
    content: "eSports have exploded in popularity, drawing massive audiences and challenging the definition of traditional sports. This post examines the rise of competitive gaming, its economic impact, and its cultural significance. We compare eSports athletes to traditional athletes, discuss the infrastructure of professional gaming leagues, and explore the future of this rapidly growing industry. Is eSports the new frontier of athletic competition?",
    categorySlug: "sports",
    authorName: "Ninja Turtle",
    imageUrl: "https://picsum.photos/seed/esportsimpact/600/400"
  },
  {
    title: "Retro Gaming Revival: Classic Video Games",
    content: "Nostalgia is a powerful force, and it's fueling a major revival in retro gaming. This article explores why classic video games from the 8-bit and 16-bit eras are making a comeback. We look at the communities dedicated to preserving these games, the rise of retro consoles and emulators, and the enduring appeal of pixelated graphics and simple yet challenging gameplay. Join us on a trip down memory lane and rediscover the magic of retro gaming.",
    categorySlug: "gaming",
    authorName: "Pac Man",
    imageUrl: "https://picsum.photos/seed/retrogaming/600/400"
  },
  {
    title: "DIY Home Decor: Budget-Friendly Ideas",
    content: "Transform your living space without breaking the bank! This post is packed with creative and budget-friendly DIY home decor ideas. From upcycling furniture to creating unique wall art and stylish storage solutions, discover simple projects that can make a big impact. Get inspired to personalize your home and express your creativity with these easy-to-follow tutorials and tips.",
    categorySlug: "home-garden",
    authorName: "Martha Stewart Jr.",
    imageUrl: "https://picsum.photos/seed/diydecor/600/400"
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
        console.log(`Post "${postData.title}" already exists. Skipping.`);
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


      const category = allStaticCategories.find(c => c.slug === postData.categorySlug) || 
                       allStaticCategories[Math.floor(Math.random() * allStaticCategories.length)];

      const result = await createPost({
        title: postData.title,
        content: postData.content,
        categorySlug: category.slug,
        authorId: authorDetails.id,
        imageUrl: postData.imageUrl,
      });

      if (result) {
        // createPost already initializes likedBy: []
        createdCount++;
        console.log(`Created post: "${result.title}" by author ID: ${authorDetails.id}`);
      } else {
        console.warn(`Failed to create post: "${postData.title}" (Author ID: ${authorDetails.id})`);
      }
    }

    if (createdCount > 0) {
      revalidatePath('/');
      allStaticCategories.forEach(cat => revalidatePath(`/category/${cat.slug}`));
      console.log(`Successfully created ${createdCount} posts and revalidated paths.`);
    } else if (dummyPostsData.length > 0) {
      console.log('No new posts were created. They may already exist, or author data was missing/mismatched.');
    } else {
      console.log('No dummy posts data provided to seed.');
    }
    
    return { success: true, count: createdCount, message: `Seeded ${createdCount} posts.` };
  } catch (error) {
    console.error('Error seeding posts:', error);
    return { success: false, count: 0, message: `Error seeding posts: ${error instanceof Error ? error.message : String(error)}` };
  }
}
