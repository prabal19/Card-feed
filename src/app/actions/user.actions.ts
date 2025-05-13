// src/app/actions/user.actions.ts
'use server';

import clientPromise from '@/lib/mongodb';
import type { User, UpdateUserProfileInput } from '@/types';
import type { GoogleAuthData, CompleteProfileFormData } from '@/contexts/auth-context';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';

async function getDb() {
  const client = await clientPromise;
  return client.db(); // Use your database name
}

// Helper function to map DB user doc to DTO
function mapUserToDto(userDoc: any): User {
  const stringId = userDoc._id?.toString();
  return {
    ...userDoc,
    _id: stringId,
    id: userDoc.id || stringId, 
    password: undefined, // Ensure password is not sent to client
  };
}


let mockUsers: User[] = [
  {
    _id: 'mock-user-123', 
    id: 'mock-user-123', 
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo.user@example.com',
    // No password field in User DTO for client
    profileImageUrl: 'https://picsum.photos/seed/demoUser/200/200',
    description: 'A passionate writer and reader on CardFeed. Loves technology and travel.',
  },
  {
    _id: 'author-ada',
    id: 'author-ada',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada.lovelace@example.com',
    profileImageUrl: 'https://picsum.photos/seed/adalovelace/200/200',
    description: 'Pioneering computer scientist and writer of the first algorithm. Enjoys discussing technology on CardFeed.',
  },
   // ... other mock users from previous state, ensure they follow User DTO structure
    {
    _id: 'author-marco',
    id: 'author-marco',
    firstName: 'Marco',
    lastName: 'Polo Jr.',
    email: 'marco.polo@example.com',
    profileImageUrl: 'https://picsum.photos/seed/marcopolo/200/200',
    description: 'Avid explorer and storyteller, sharing tales from distant lands and travel experiences.',
  },
  {
    _id: 'author-julia',
    id: 'author-julia',
    firstName: 'Julia',
    lastName: 'Childish',
    email: 'julia.childish@example.com',
    profileImageUrl: 'https://picsum.photos/seed/juliachildish/200/200',
    description: 'Culinary enthusiast sharing recipes and food adventures on CardFeed.',
  },
  {
    _id: 'author-marie',
    id: 'author-marie',
    firstName: 'Marie',
    lastName: 'Kondoversy',
    email: 'marie.kondoversy@example.com',
    profileImageUrl: 'https://picsum.photos/seed/mariekondoversy/200/200',
    description: 'Expert in minimalist living and decluttering, inspiring a simpler lifestyle.',
  },
  {
    _id: 'author-elon',
    id: 'author-elon',
    firstName: 'Elon',
    lastName: 'Tusk',
    email: 'elon.tusk@example.com',
    profileImageUrl: 'https://picsum.photos/seed/elontusk/200/200',
    description: 'Visionary entrepreneur discussing sustainable business and future technologies.',
  },
  {
    _id: 'author-buddha',
    id: 'author-buddha',
    firstName: 'Buddha',
    lastName: 'Lee',
    email: 'buddha.lee@example.com',
    profileImageUrl: 'https://picsum.photos/seed/buddhalee/200/200',
    description: 'Spiritual guide sharing insights on mindfulness and health & wellness.',
  },
  {
    _id: 'author-satoshi',
    id: 'author-satoshi',
    firstName: 'Satoshi',
    lastName: 'Notamoto',
    email: 'satoshi.notamoto@example.com',
    profileImageUrl: 'https://picsum.photos/seed/satoshinotamoto/200/200',
    description: 'Cryptocurrency expert demystifying finance and blockchain technology.',
  },
  {
    _id: 'author-xavier',
    id: 'author-xavier',
    firstName: 'Prof.',
    lastName: 'Xavier',
    email: 'prof.xavier@example.com',
    profileImageUrl: 'https://picsum.photos/seed/profxavier/200/200',
    description: 'Educator exploring innovative teaching methods and gamification in learning.',
  },
  {
    _id: 'author-banksy',
    id: 'author-banksy',
    firstName: 'Banksy',
    lastName: 'Not',
    email: 'banksy.not@example.com',
    profileImageUrl: 'https://picsum.photos/seed/banksynot/200/200',
    description: 'Art enthusiast commenting on street art, culture, and its evolution.',
  },
  {
    _id: 'author-dreamwell',
    id: 'author-dreamwell',
    firstName: 'Dr.',
    lastName: 'Dreamwell',
    email: 'dr.dreamwell@example.com',
    profileImageUrl: 'https://picsum.photos/seed/drdreamwell/200/200',
    description: 'Scientist specializing in sleep research and its importance for well-being.',
  },
  {
    _id: 'author-patty',
    id: 'author-patty',
    firstName: 'Patty',
    lastName: 'Planter',
    email: 'patty.planter@example.com',
    profileImageUrl: 'https://picsum.photos/seed/pattyplanter/200/200',
    description: 'Gardening guru sharing tips for urban gardening and home decor.',
  },
  {
    _id: 'author-henry',
    id: 'author-henry',
    firstName: 'Henry',
    lastName: 'Ford II',
    email: 'henry.fordii@example.com',
    profileImageUrl: 'https://picsum.photos/seed/henryfordii/200/200',
    description: 'Automotive industry commentator discussing electric vehicles and future trends.',
  },
  {
    _id: 'author-cesar',
    id: 'author-cesar',
    firstName: 'Cesar',
    lastName: 'Millan Jr.',
    email: 'cesar.millanjr@example.com',
    profileImageUrl: 'https://picsum.photos/seed/cesarmillanjr/200/200',
    description: 'Pet behavior expert helping owners understand their canine companions.',
  },
  {
    _id: 'author-ninja',
    id: 'author-ninja',
    firstName: 'Ninja',
    lastName: 'Turtle', 
    email: 'ninja.turtle@example.com',
    profileImageUrl: 'https://picsum.photos/seed/ninjaturtle/200/200',
    description: 'eSports analyst and commentator on the impact of gaming on sports.',
  },
  {
    _id: 'author-pacman',
    id: 'author-pacman',
    firstName: 'Pac',
    lastName: 'Man', 
    email: 'pac.man@example.com',
    profileImageUrl: 'https://picsum.photos/seed/pacman/200/200',
    description: 'Retro gaming aficionado exploring classic video games and their revival.',
  },
  {
    _id: 'author-martha',
    id: 'author-martha',
    firstName: 'Martha',
    lastName: 'Stewart Jr.',
    email: 'martha.stewartjr@example.com',
    profileImageUrl: 'https://picsum.photos/seed/marthastewartjr/200/200',
    description: 'DIY expert sharing budget-friendly home decor and lifestyle ideas.',
  }
];


export async function getUserProfile(userIdOrEmail: string): Promise<User | null> {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    let userDoc = null;
    // Try to find by ID first (could be string _id or custom 'id' field)
    if (ObjectId.isValid(userIdOrEmail)) {
        userDoc = await usersCollection.findOne({ _id: new ObjectId(userIdOrEmail) });
    }
    if (!userDoc) {
        userDoc = await usersCollection.findOne({ id: userIdOrEmail });
    }
    // If not found by ID, try by email
    if (!userDoc && userIdOrEmail.includes('@')) {
        userDoc = await usersCollection.findOne({ email: userIdOrEmail });
    }
    
    if (userDoc) {
      return mapUserToDto(userDoc);
    }
    
    // Fallback to mock array if not in DB (useful for initial demo authors)
    const mockUserFromArray = mockUsers.find(u => u.id === userIdOrEmail || u.email === userIdOrEmail);
    if (mockUserFromArray) {
        console.warn(`User ${userIdOrEmail} found in mock array, not in DB. Consider seeding.`);
        return { ...mockUserFromArray, password: undefined }; // Ensure DTO format
    }

    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, data: UpdateUserProfileInput): Promise<User | null> {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    const updatePayload: Partial<Omit<User, 'id' | '_id' | 'email'>> = {};
    if (data.firstName) updatePayload.firstName = data.firstName;
    if (data.lastName) updatePayload.lastName = data.lastName;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.profileImageUrl !== undefined) updatePayload.profileImageUrl = data.profileImageUrl;

    const query = ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { id: userId };
    
    const result = await usersCollection.findOneAndUpdate(
      query,
      { $set: updatePayload },
      { returnDocument: 'after' }
    );

    if (result) {
      revalidatePath(`/profile/${userId}`);
      revalidatePath('/'); 
      return mapUserToDto(result);
    }
    return null; 

  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

// Used for email/password signup
export async function createUser(userData: Omit<User, '_id' | 'id'> & { id?: string, password?: string }): Promise<User | null> {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');

        const existingUserByEmail = await usersCollection.findOne({ email: userData.email });
        if (existingUserByEmail) {
            console.warn("User with this email already exists:", userData.email);
            // For signup, this should be an error. For findOrCreate, it's fine.
            // Throwing error here to be caught by signup form.
            throw new Error("An account with this email already exists.");
        }
        
        // In a real app, hash password here before saving:
        // const hashedPassword = await bcrypt.hash(userData.password, 10);
        // For mock, we'll just omit it from DB document for User schema.

        const newDbId = new ObjectId(); 
        const finalUserId = userData.id || newDbId.toString(); // Use provided ID (e.g. from mock list) or generate new one

        const userDocumentForDb = {
            _id: newDbId, 
            id: finalUserId, 
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            // Do NOT store plain password: userData.password, 
            // Store hashedPassword instead
            profileImageUrl: userData.profileImageUrl || `https://picsum.photos/seed/${finalUserId}/200/200`,
            description: userData.description || '',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const insertResult = await usersCollection.insertOne(userDocumentForDb);
        if (insertResult.insertedId) {
             const insertedDoc = await usersCollection.findOne({ _id: insertResult.insertedId });
             if (insertedDoc) {
                return mapUserToDto(insertedDoc);
             }
        }
        return null;
    } catch (error) {
        console.error("Error creating user:", error);
        if (error instanceof Error && (error as any).code === 11000) { 
            console.error("Duplicate key error, likely email or custom ID:", error.message);
            throw new Error("An account with this email or ID already exists.");
        }
        throw error; // Re-throw for UI to handle
    }
}

export async function findOrCreateUserFromGoogle({
  googleAuthData,
  profileFormData,
}: {
  googleAuthData: GoogleAuthData;
  profileFormData: CompleteProfileFormData;
}): Promise<User | null> {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    let userDoc = await usersCollection.findOne({ email: googleAuthData.email });
    
    let profileImageUrlToSave = googleAuthData.profileImageUrl; // Start with Google's image
    if (profileFormData.profileImageFile) {
        // Simulate image upload for the new file
        // In a real app: upload to storage, get URL
        await new Promise(res => setTimeout(res, 500)); // Simulate network delay
        profileImageUrlToSave = `https://picsum.photos/seed/${googleAuthData.email}-${Date.now()}/200/200`;
    }


    if (userDoc) {
      // User exists, update their profile with new details from the form
      const updatePayload: Partial<Omit<User, 'id' | '_id' | 'email'>> & { updatedAt: Date, googleId?: string } = {
        firstName: profileFormData.firstName,
        lastName: profileFormData.lastName,
        description: profileFormData.description,
        profileImageUrl: profileImageUrlToSave || userDoc.profileImageUrl || `https://picsum.photos/seed/${userDoc.id}/200/200`,
        updatedAt: new Date(),
      };
      if (googleAuthData.googleId && !userDoc.googleId) {
        updatePayload.googleId = googleAuthData.googleId; // Link Google ID if not already present
      }

      const result = await usersCollection.findOneAndUpdate(
        { _id: userDoc._id },
        { $set: updatePayload },
        { returnDocument: 'after' }
      );
      if (result) {
        revalidatePath(`/profile/${result.id}`);
        return mapUserToDto(result);
      }
      return null;

    } else {
      // User does not exist, create a new one
      const newDbId = new ObjectId();
      const finalUserId = googleAuthData.googleId || newDbId.toString(); // Prefer Google ID if available for 'id' field

      const newUserDocument = {
        _id: newDbId,
        id: finalUserId,
        googleId: googleAuthData.googleId,
        email: googleAuthData.email,
        firstName: profileFormData.firstName,
        lastName: profileFormData.lastName,
        description: profileFormData.description,
        profileImageUrl: profileImageUrlToSave || `https://picsum.photos/seed/${finalUserId}/200/200`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertResult = await usersCollection.insertOne(newUserDocument);
      if (insertResult.insertedId) {
        const insertedDoc = await usersCollection.findOne({ _id: insertResult.insertedId });
        if (insertedDoc) {
            revalidatePath(`/profile/${insertedDoc.id}`);
            return mapUserToDto(insertedDoc);
        }
      }
      return null;
    }
  } catch (error) {
    console.error('Error in findOrCreateUserFromGoogle:', error);
    if (error instanceof Error && (error as any).code === 11000) {
        throw new Error("A user with this Google ID or email might already exist with conflicting unique fields.");
    }
    throw error;
  }
}


export async function searchUsersByName(query: string): Promise<User[]> {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');
    const regex = new RegExp(query, 'i'); 
    const usersFromDb = await usersCollection.find({
      $or: [
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
        { email: { $regex: regex } }
      ]
    }).toArray();
    
    return usersFromDb.map(mapUserToDto);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}


export async function seedUsers(): Promise<{ success: boolean, count: number, message?: string }> {
  console.log('Attempting to seed database with mock users...');
   if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. User seeding cannot proceed.');
    return { success: false, count: 0, message: 'MONGODB_URI not configured.' };
  }
  
  let createdCount = 0;
  const db = await getDb();
  const usersCollection = db.collection('users');

  try {
    for (const mockUser of mockUsers) {
        let userInDb = await usersCollection.findOne({ id: mockUser.id });
        if (!userInDb) {
            userInDb = await usersCollection.findOne({ email: mockUser.email });
        }

        if (!userInDb) { 
             // For createUser, we omit _id and id might be optional if we want it generated.
             // Password is not part of User DTO, so we don't pass it to createUser.
             const { _id, id, password, ...restOfMockUser } = mockUser;
             const userToCreatePayload: Omit<User, '_id' | 'id'> & { id?: string, password?: string } = {
                 ...restOfMockUser,
                 id: id, // Pass the mockUser's string id
                 // For seeding, we might not have passwords or need them,
                 // as createUser doesn't hash/store it directly on User object.
             };
             // If createUser requires a password for hashing (even for mocks), you'd add a dummy one here.
             // userToCreatePayload.password = "mockPassword123"; 
             
             try {
                const created = await createUser(userToCreatePayload);
                if (created) {
                    createdCount++;
                    console.log(`Seeded user: ${created.firstName} ${created.lastName} (ID: ${created.id})`);
                } else {
                    console.warn(`Failed to seed user via createUser: ${mockUser.firstName} ${mockUser.lastName} (ID: ${mockUser.id})`);
                }
             } catch (e: any) {
                // Catch errors from createUser, e.g., if email already exists due to prior failed seed
                console.warn(`Skipping seeding user ${mockUser.email} due to error: ${e.message}`);
             }
        } else {
            console.log(`User ${mockUser.firstName} ${mockUser.lastName} (ID: ${mockUser.id || userInDb.id}) already exists. Skipping.`);
        }
    }
    if (createdCount > 0) {
     return { success: true, count: createdCount, message: `Seeded ${createdCount} new users.` };
    } else if (mockUsers.length > 0) {
      return { success: true, count: 0, message: 'No new users were seeded. They may already exist or seeding was skipped.' };
    } else {
      return { success: true, count: 0, message: 'No mock users provided to seed.'};
    }
  } catch (error) {
    console.error('Error during seedUsers main loop:', error);
    return { success: false, count: 0, message: `Error seeding users: ${error instanceof Error ? error.message : String(error)}` };
  }
}
