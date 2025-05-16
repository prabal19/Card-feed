// src/app/actions/user.actions.ts
'use server';

import clientPromise from '@/lib/mongodb';
import type { User, UpdateUserProfileInput, CreateUserByAdminInput, UpdateUserByAdminInput } from '@/types';
import type { GoogleAuthData, CompleteProfileFormData } from '@/contexts/auth-context';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { deletePostsByAuthorId } from './post.actions';
import { deleteNotificationsRelatedToUser } from './notification.actions';

async function getDb() {
  const client = await clientPromise;
  return client.db();
}

function mapUserToDto(userDoc: any): User {
  const stringId = userDoc._id?.toString();
  return {
    ...userDoc,
    _id: stringId, // Ensure _id (string) is always present
    id: userDoc.id || stringId, // Fallback for 'id' field if it's not explicitly set to _id.toString()
    password: undefined, // Never send password to client
    isBlocked: userDoc.isBlocked || false, 
    createdAt: userDoc.createdAt ? new Date(userDoc.createdAt).toISOString() : undefined,
    updatedAt: userDoc.updatedAt ? new Date(userDoc.updatedAt).toISOString() : undefined,
    authProvider: userDoc.authProvider || (userDoc.googleId ? 'google' : 'email'),
  };
}


let mockUsers: User[] = [
  {
    _id: 'mock-user-123', // For consistency, ensure _id and id can be the same if it's a string representation.
    id: 'mock-user-123',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo.user@example.com',
    profileImageUrl: 'https://picsum.photos/seed/demoUser/200/200',
    description: 'A passionate writer and reader on CardFeed.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-ada',
    id: 'author-ada',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada.lovelace@example.com',
    profileImageUrl: 'https://picsum.photos/seed/adalovelace/200/200',
    description: 'Pioneering computer scientist and writer of the first algorithm. Enjoys discussing technology on CardFeed.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-marco',
    id: 'author-marco',
    firstName: 'Marco',
    lastName: 'Polo Jr.',
    email: 'marco.polo@example.com',
    profileImageUrl: 'https://picsum.photos/seed/marcopolo/200/200',
    description: 'Avid explorer and storyteller, sharing tales from distant lands and travel experiences.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
   {
    _id: 'author-julia',
    id: 'author-julia',
    firstName: 'Julia',
    lastName: 'Childish',
    email: 'julia.childish@example.com',
    profileImageUrl: 'https://picsum.photos/seed/juliachildish/200/200',
    description: 'Culinary enthusiast sharing recipes and food adventures on CardFeed.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-marie',
    id: 'author-marie',
    firstName: 'Marie',
    lastName: 'Kondoversy',
    email: 'marie.kondoversy@example.com',
    profileImageUrl: 'https://picsum.photos/seed/mariekondoversy/200/200',
    description: 'Expert in minimalist living and decluttering, inspiring a simpler lifestyle.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-elon',
    id: 'author-elon',
    firstName: 'Elon',
    lastName: 'Tusk',
    email: 'elon.tusk@example.com',
    profileImageUrl: 'https://picsum.photos/seed/elontusk/200/200',
    description: 'Visionary entrepreneur discussing sustainable business and future technologies.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-buddha',
    id: 'author-buddha',
    firstName: 'Buddha',
    lastName: 'Lee',
    email: 'buddha.lee@example.com',
    profileImageUrl: 'https://picsum.photos/seed/buddhalee/200/200',
    description: 'Spiritual guide sharing insights on mindfulness and health & wellness.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-satoshi',
    id: 'author-satoshi',
    firstName: 'Satoshi',
    lastName: 'Notamoto',
    email: 'satoshi.notamoto@example.com',
    profileImageUrl: 'https://picsum.photos/seed/satoshinotamoto/200/200',
    description: 'Cryptocurrency expert demystifying finance and blockchain technology.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-xavier',
    id: 'author-xavier',
    firstName: 'Prof.',
    lastName: 'Xavier',
    email: 'prof.xavier@example.com',
    profileImageUrl: 'https://picsum.photos/seed/profxavier/200/200',
    description: 'Educator exploring innovative teaching methods and gamification in learning.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-banksy',
    id: 'author-banksy',
    firstName: 'Banksy',
    lastName: 'Not',
    email: 'banksy.not@example.com',
    profileImageUrl: 'https://picsum.photos/seed/banksynot/200/200',
    description: 'Art enthusiast commenting on street art, culture, and its evolution.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-dreamwell',
    id: 'author-dreamwell',
    firstName: 'Dr.',
    lastName: 'Dreamwell',
    email: 'dr.dreamwell@example.com',
    profileImageUrl: 'https://picsum.photos/seed/drdreamwell/200/200',
    description: 'Scientist specializing in sleep research and its importance for well-being.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-patty',
    id: 'author-patty',
    firstName: 'Patty',
    lastName: 'Planter',
    email: 'patty.planter@example.com',
    profileImageUrl: 'https://picsum.photos/seed/pattyplanter/200/200',
    description: 'Gardening guru sharing tips for urban gardening and home decor.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-henry',
    id: 'author-henry',
    firstName: 'Henry',
    lastName: 'Ford II',
    email: 'henry.fordii@example.com',
    profileImageUrl: 'https://picsum.photos/seed/henryfordii/200/200',
    description: 'Automotive industry commentator discussing electric vehicles and future trends.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-cesar',
    id: 'author-cesar',
    firstName: 'Cesar',
    lastName: 'Millan Jr.',
    email: 'cesar.millanjr@example.com',
    profileImageUrl: 'https://picsum.photos/seed/cesarmillanjr/200/200',
    description: 'Pet behavior expert helping owners understand their canine companions.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-ninja',
    id: 'author-ninja',
    firstName: 'Ninja',
    lastName: 'Turtle',
    email: 'ninja.turtle@example.com',
    profileImageUrl: 'https://picsum.photos/seed/ninjaturtle/200/200',
    description: 'eSports analyst and commentator on the impact of gaming on sports.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-pacman',
    id: 'author-pacman',
    firstName: 'Pac',
    lastName: 'Man',
    email: 'pac.man@example.com',
    profileImageUrl: 'https://picsum.photos/seed/pacman/200/200',
    description: 'Retro gaming aficionado exploring classic video games and their revival.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-martha',
    id: 'author-martha',
    firstName: 'Martha',
    lastName: 'Stewart Jr.',
    email: 'martha.stewartjr@example.com',
    profileImageUrl: 'https://picsum.photos/seed/marthastewartjr/200/200',
    description: 'DIY expert sharing budget-friendly home decor and lifestyle ideas.',
    role: 'user',
    authProvider: 'admin_created', // Changed from 'seeded'
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  ...(process.env.NEXT_PUBLIC_ADMIN_EMAIL ? [{
    _id: 'admin-user-001',
    id: 'admin-user-001', // This id is used for initial lookup if _id is not yet an ObjectId
    firstName: 'Admin',
    lastName: 'User',
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    profileImageUrl: 'https://picsum.photos/seed/adminuser/200/200',
    description: 'CardFeed Administrator.',
    role: 'admin' as 'admin',
    authProvider: 'email' as 'email',
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }] : [])
];


export async function getUserProfile(userIdOrEmail: string): Promise<User | null> {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    let userDoc = null;
    // Prefer querying by actual MongoDB _id if userIdOrEmail is a valid ObjectId string
    if (ObjectId.isValid(userIdOrEmail)) {
        userDoc = await usersCollection.findOne({ _id: new ObjectId(userIdOrEmail) });
    }
    // If not found by _id or not a valid ObjectId, try by custom 'id' field (used by mocks)
    if (!userDoc) {
        userDoc = await usersCollection.findOne({ id: userIdOrEmail });
    }
    // If still not found, try by email
    if (!userDoc && userIdOrEmail.includes('@')) {
        userDoc = await usersCollection.findOne({ email: userIdOrEmail });
    }

    if (userDoc) {
      return mapUserToDto(userDoc);
    }
    
    // Fallback for initial seeding scenarios if mockUsers array is the source of truth for some IDs
    const mockUserFromArray = mockUsers.find(u => u.id === userIdOrEmail || u.email === userIdOrEmail);
    if (mockUserFromArray && (!userDoc || userDoc._id.toString() !== mockUserFromArray._id)) {
        console.warn(`User ${userIdOrEmail} found in mock array, but potentially not matching DB _id or not in DB. This implies potential data inconsistency or user not fully seeded.`);
        return { ...mockUserFromArray, password: undefined, isBlocked: mockUserFromArray.isBlocked || false };
    }


    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');
    const usersFromDb = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();
    return usersFromDb.map(mapUserToDto);
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}


export async function updateUserProfile(userId: string, data: UpdateUserProfileInput): Promise<User | null> {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    // userId here should be the actual MongoDB _id as a string
    if (!ObjectId.isValid(userId)) {
      console.error('Invalid ObjectId for updateUserProfile:', userId);
      return null;
    }

    const updatePayload: Partial<Omit<User, 'id' | '_id' | 'email' | 'createdAt' | 'password' | 'authProvider' | 'role'>> & { updatedAt?: Date } = {
        updatedAt: new Date()
    };
    if (data.firstName !== undefined) updatePayload.firstName = data.firstName;
    if (data.lastName !== undefined) updatePayload.lastName = data.lastName;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.profileImageUrl !== undefined) updatePayload.profileImageUrl = data.profileImageUrl;


    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) }, // Query by actual _id
      { $set: updatePayload },
      { returnDocument: 'after' }
    );

    if (result) {
      revalidatePath(`/profile/${userId}`); // Use the same ID for revalidation that's in the URL
      revalidatePath('/'); // For header updates
      revalidatePath('/admin/users');
      return mapUserToDto(result);
    }
    return null;

  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}


export async function createUser(userData: Omit<User, '_id' | 'id'> & { id?: string, password?: string }): Promise<User | null> {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');

        const existingUserByEmail = await usersCollection.findOne({ email: userData.email });
        if (existingUserByEmail) {
            console.log(`User with email ${userData.email} already exists. Updating role/authProvider if necessary.`);
            const updateOps: any = { $set: { updatedAt: new Date() }};
            let needsUpdate = false;
            if (userData.role && existingUserByEmail.role !== userData.role) {
                updateOps.$set.role = userData.role;
                needsUpdate = true;
            }
            if (userData.authProvider && existingUserByEmail.authProvider !== userData.authProvider) {
                 updateOps.$set.authProvider = userData.authProvider;
                 needsUpdate = true;
            }
             if (userData.password && existingUserByEmail.password !== userData.password) {
                updateOps.$set.password = userData.password; // Handle with care, ensure hashing in real app
                needsUpdate = true;
            }
            if (userData.isBlocked !== undefined && existingUserByEmail.isBlocked !== userData.isBlocked) {
                updateOps.$set.isBlocked = userData.isBlocked;
                needsUpdate = true;
            }


            if (needsUpdate) {
                await usersCollection.updateOne({ _id: existingUserByEmail._id }, updateOps);
            }
            return mapUserToDto(await usersCollection.findOne({ _id: existingUserByEmail._id }));
        }

        const newMongoId = new ObjectId(); // This is the true MongoDB _id
        const newUserIdString = newMongoId.toString(); // String version of _id for the 'id' field

        const userDocumentForDb: any = {
            _id: newMongoId, // Store as ObjectId
            id: newUserIdString, // Store string version of _id as 'id' field
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            profileImageUrl: userData.profileImageUrl || `https://picsum.photos/seed/${newUserIdString}/200/200`,
            description: userData.description || '',
            role: userData.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : (userData.role || 'user'),
            authProvider: userData.authProvider || (userData.googleId ? 'google' : 'email'),
            googleId: userData.googleId,
            isBlocked: userData.isBlocked || false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        if (userData.password) {
            userDocumentForDb.password = userData.password; // Store plain text for prototype, HASH in production
        }


        const insertResult = await usersCollection.insertOne(userDocumentForDb);
        if (insertResult.insertedId) {
             const insertedDoc = await usersCollection.findOne({ _id: insertResult.insertedId });
             if (insertedDoc) {
                if (userDocumentForDb.role === 'admin') {
                  revalidatePath('/admin/users');
                }
                return mapUserToDto(insertedDoc);
             }
        }
        return null;
    } catch (error) {
        console.error("Error creating user:", error);
        if (error instanceof Error && (error as any).code === 11000) { // Duplicate key error
             // Check if it's a duplicate email or duplicate id (if 'id' field has unique index)
            if ((error as any).message.includes('email_1')) {
                 throw new Error("An account with this email already exists.");
            } else if ((error as any).message.includes('id_1')) { // Assuming 'id' field also has a unique index
                 throw new Error("An account with this custom ID already exists.");
            }
            throw new Error("A unique constraint was violated (e.g., email or ID already exists).");
        }
        throw error;
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

    let profileImageUrlToSave = googleAuthData.profileImageUrl;
    if (profileFormData.profileImageFile) {
        await new Promise(res => setTimeout(res, 500)); // Simulate upload
        profileImageUrlToSave = `https://picsum.photos/seed/${googleAuthData.email}-${Date.now()}/200/200`;
    }


    if (userDoc) {
      // User exists, update their profile based on form data if needed, ensure authProvider is google
      const updatePayload: Partial<Omit<User, 'id' | '_id' | 'email' | 'createdAt'>> & { updatedAt: Date, googleId?: string, authProvider?: User['authProvider'] } = {
        firstName: profileFormData.firstName || userDoc.firstName, // Use new if provided, else existing
        lastName: profileFormData.lastName || userDoc.lastName,
        description: profileFormData.description || userDoc.description, // Use new if provided
        profileImageUrl: profileImageUrlToSave || userDoc.profileImageUrl || `https://picsum.photos/seed/${userDoc.id}/200/200`,
        authProvider: 'google', // Ensure it's marked as google auth
        isBlocked: userDoc.isBlocked || false, 
        updatedAt: new Date(),
      };
      if (googleAuthData.googleId && !userDoc.googleId) {
        updatePayload.googleId = googleAuthData.googleId;
      }
       if (!userDoc.role) { // Set role if not already set (e.g., for users created before roles)
          updatePayload.role = googleAuthData.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : 'user';
      }


      const result = await usersCollection.findOneAndUpdate(
        { _id: userDoc._id },
        { $set: updatePayload },
        { returnDocument: 'after' }
      );
      if (result) {
        revalidatePath(`/profile/${result.id}`);
        revalidatePath('/admin/users');
        return mapUserToDto(result);
      }
      return null;

    } else {
      // User does not exist, create new user
      const newMongoId = new ObjectId();
      const newUserIdString = newMongoId.toString();

      const newUserDocument = {
        _id: newMongoId, // ObjectId
        id: newUserIdString, // String version of _id
        googleId: googleAuthData.googleId,
        email: googleAuthData.email,
        firstName: profileFormData.firstName,
        lastName: profileFormData.lastName,
        description: profileFormData.description,
        profileImageUrl: profileImageUrlToSave || `https://picsum.photos/seed/${newUserIdString}/200/200`,
        role: googleAuthData.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : 'user',
        authProvider: 'google' as 'google',
        isBlocked: false, 
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertResult = await usersCollection.insertOne(newUserDocument);
      if (insertResult.insertedId) {
        const insertedDoc = await usersCollection.findOne({ _id: insertResult.insertedId });
        if (insertedDoc) {
            revalidatePath(`/profile/${insertedDoc.id}`);
            revalidatePath('/admin/users');
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
        // Try to find by email first as it should be unique
        let userInDb = await usersCollection.findOne({ email: mockUser.email });
        
        // If not found by email, and mockUser._id looks like a placeholder ID, try finding by that 'id' field
        if (!userInDb && mockUser.id && !ObjectId.isValid(mockUser.id)) {
            userInDb = await usersCollection.findOne({ id: mockUser.id });
        }


        if (!userInDb) {
             // User doesn't exist, create them
             const { _id, id, password, ...restOfMockUser } = mockUser;
             
             // For createUser, we don't pass _id. 'id' will be generated from new ObjectId if not provided in restOfMockUser.id
             // However, our mockUsers have specific 'id' strings. Let's ensure createUser handles this.
             // createUser will generate a new MongoDB _id, and use mockUser.id for the string 'id' field.

             const userToCreatePayload: Omit<User, '_id' | 'id'> & { id?: string, password?: string } = {
                 ...restOfMockUser, // This includes firstName, lastName, email, etc.
                 id: mockUser.id, // Pass the mockUser.id to be stored in the 'id' field.
                 role: mockUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : (mockUser.role || 'user'),
                 authProvider: mockUser.authProvider || 'admin_created', // Default to admin_created if not specified
                 isBlocked: mockUser.isBlocked || false,
             };
             if (mockUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
                 userToCreatePayload.password = process.env.ADMIN_PASSWORD;
             }

             try {
                const created = await createUser(userToCreatePayload);
                if (created) {
                    createdCount++;
                    console.log(`Seeded user: ${created.firstName} ${created.lastName} (ID: ${created.id}, Role: ${created.role}, Provider: ${created.authProvider})`);
                } else {
                    console.warn(`Failed to seed user via createUser: ${mockUser.firstName} ${mockUser.lastName} (ID: ${mockUser.id})`);
                }
             } catch (e: any) {
                console.warn(`Skipping seeding user ${mockUser.email} due to error: ${e.message}`);
             }
        } else {
            // User exists, check if updates are needed
            let updateNeeded = false;
            const updateOps: any = { $set: {} };

            // Ensure role is correct, especially for admin
            const expectedRole = mockUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : (mockUser.role || 'user');
            if (userInDb.role !== expectedRole) {
                updateOps.$set.role = expectedRole;
                updateNeeded = true;
            }

            // Ensure authProvider is correct
            const expectedAuthProvider = mockUser.authProvider || (userInDb.googleId ? 'google' : (expectedRole === 'admin' ? 'email' : 'admin_created'));
            if (userInDb.authProvider !== expectedAuthProvider) {
                updateOps.$set.authProvider = expectedAuthProvider;
                updateNeeded = true;
            }
            // Ensure isBlocked is initialized
            if (userInDb.isBlocked === undefined) { 
                updateOps.$set.isBlocked = false;
                updateNeeded = true;
            }
            // Ensure admin password is set if it's the admin user and password is in .env
            if (userInDb.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && process.env.ADMIN_PASSWORD && userInDb.password !== process.env.ADMIN_PASSWORD) {
                updateOps.$set.password = process.env.ADMIN_PASSWORD; // HASH in production
                updateNeeded = true;
            }
            // Ensure timestamps exist
            if (!userInDb.createdAt) {
                updateOps.$set.createdAt = new Date();
                updateNeeded = true;
            }
            if (!userInDb.updatedAt) {
                updateOps.$set.updatedAt = new Date(); // Or use existing if only other fields changed
            } else {
                 updateOps.$set.updatedAt = new Date(); // Always update updatedAt if other changes are made
            }
            // Ensure the string 'id' field matches the mockUser.id if it was used for lookup,
            // or that it matches _id.toString() if it was created fresh.
            // This is crucial if 'id' field has a unique index.
            // For simplicity, we'll rely on createUser to set 'id' correctly on creation.
            // If userInDb.id doesn't match mockUser.id (and mockUser.id was the intended unique key), it's tricky.
            // This seed script assumes email is the primary key for matching existing mock users.


            if (updateNeeded) {
                await usersCollection.updateOne({ _id: userInDb._id }, updateOps);
                console.log(`Updated fields for existing user: ${userInDb.firstName} ${userInDb.lastName}`);
            } else {
                console.log(`User ${mockUser.firstName} ${mockUser.lastName} (ID: ${userInDb.id}) already exists and is up-to-date. Skipping.`);
            }
        }
    }
    if (createdCount > 0 || mockUsers.length > 0) {
      revalidatePath('/admin/users');
      return { success: true, count: createdCount, message: `Seeded ${createdCount} new users. Existing users checked/updated.` };
    } else {
      return { success: true, count: 0, message: 'No mock users provided to seed.'};
    }
  } catch (error) {
    console.error('Error during seedUsers main loop:', error);
    return { success: false, count: 0, message: `Error seeding users: ${error instanceof Error ? error.message : String(error)}` };
  }
}


export async function createUserByAdmin(userData: CreateUserByAdminInput): Promise<User | null> {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error(`User with email ${userData.email} already exists.`);
    }

    const newMongoId = new ObjectId();
    const newUserIdString = newMongoId.toString();

    let profileImageUrl = userData.profileImageUrl;
    if(userData.profileImageFile){ // This field comes from client, not used directly in DB model
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate upload
        profileImageUrl = `https://picsum.photos/seed/${newUserIdString}-${Date.now()}/200/200`;
    } else if (!profileImageUrl) {
        profileImageUrl = `https://picsum.photos/seed/${newUserIdString}/200/200`;
    }

    const userDocumentForDb: Omit<User, '_id' | 'id'> & { _id: ObjectId, id: string, password?: string } = {
      _id: newMongoId,
      id: newUserIdString,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      profileImageUrl: profileImageUrl,
      description: userData.description || '',
      role: userData.role,
      authProvider: 'admin_created', // Explicitly set
      isBlocked: false, 
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (userData.password) {
      // SECURITY RISK: Storing password directly. In production, hash this password.
      userDocumentForDb.password = userData.password;
    }

    const insertResult = await usersCollection.insertOne(userDocumentForDb as any);
    if (insertResult.insertedId) {
      const insertedDoc = await usersCollection.findOne({ _id: insertResult.insertedId });
      if (insertedDoc) {
        revalidatePath('/admin/users');
        return mapUserToDto(insertedDoc);
      }
    }
    return null;
  } catch (error) {
    console.error("Error creating user by admin:", error);
    if (error instanceof Error) {
        if ((error as any).code === 11000) { // Duplicate key
            throw new Error("An account with this email or ID already exists.");
        }
        throw error;
    }
    throw new Error("An unknown error occurred while creating the user.");
  }
}

export async function updateUserByAdmin(userId: string, data: UpdateUserByAdminInput): Promise<User | null> {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    // userId MUST be the string representation of the MongoDB _id
    if (!ObjectId.isValid(userId)) {
      console.error('Invalid ObjectId for updateUserByAdmin:', userId);
      return null;
    }
    console.log(`[updateUserByAdmin] Received userId (should be _id string): ${userId}, data:`, data);

    const updatePayload: Partial<Omit<User, 'id' | '_id' | 'password' | 'createdAt'>> & { updatedAt: Date } = {
        updatedAt: new Date()
    };

    if (data.firstName !== undefined) updatePayload.firstName = data.firstName;
    if (data.lastName !== undefined) updatePayload.lastName = data.lastName;
    if (data.email !== undefined) updatePayload.email = data.email; // Admin can change email
    if (data.description !== undefined) updatePayload.description = data.description;
    
    if (data.profileImageUrl !== undefined) { // Can be an empty string to clear it
        updatePayload.profileImageUrl = data.profileImageUrl;
    }
    
    if (data.role !== undefined) updatePayload.role = data.role;
    if (data.isBlocked !== undefined) updatePayload.isBlocked = data.isBlocked;
    // `authProvider` should not be changed by admin here; it's set on creation or by Google Sync.

    // Check if there's anything to update other than updatedAt
    const fieldsToUpdate = Object.keys(updatePayload).filter(key => key !== 'updatedAt');
    if (fieldsToUpdate.length === 0) {
      console.log("[updateUserByAdmin] No changed fields provided for update. Fetching current user.");
      const currentUserDoc = await usersCollection.findOne({ _id: new ObjectId(userId) });
      return currentUserDoc ? mapUserToDto(currentUserDoc) : null;
    }
    
    console.log("[updateUserByAdmin] Update payload for MongoDB:", JSON.stringify(updatePayload, null, 2));

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) }, // Query by the actual MongoDB _id
      { $set: updatePayload },
      { returnDocument: 'after' }
    );
    
    console.log("[updateUserByAdmin] MongoDB findOneAndUpdate result:", result);

    if (result) {
      revalidatePath('/admin/users');
      const mappedUser = mapUserToDto(result);
      revalidatePath(`/profile/${mappedUser.id}`); // Revalidate by user.id (which is _id.toString())
      return mappedUser;
    }
    console.warn(`[updateUserByAdmin] User with _id ${userId} not found or not updated.`);
    return null;
  } catch (error) {
    console.error('[updateUserByAdmin] Error updating user by admin:', error);
    if (error instanceof Error && (error as any).code === 11000) { 
        throw new Error("This email address is already in use by another account.");
    }
    throw error;
  }
}

export async function deleteUserByAdmin(userId: string): Promise<boolean> { // userId is _id string
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    if (!ObjectId.isValid(userId)) {
      console.error('Invalid ObjectId for deleteUserByAdmin:', userId);
      return false;
    }

    const userToDelete = await usersCollection.findOne({_id: new ObjectId(userId)});
    if (!userToDelete) {
        console.warn(`User with _id ${userId} not found for deletion.`);
        return false; 
    }
    
    if (userToDelete.role === 'admin') {
        const adminCount = await usersCollection.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            throw new Error("Cannot delete the last admin account.");
        }
    }

    // Step 1: Delete posts by the user. deletePostsByAuthorId expects the user's 'id' field.
    // If user.id is _id.toString(), this is fine.
    const postsDeleted = await deletePostsByAuthorId(userToDelete.id); // userToDelete.id should be _id.toString()
    console.log(`Posts deletion result for user ${userToDelete.id}: ${postsDeleted}`);

    // Step 2: Delete notifications related to the user.
    // deleteNotificationsRelatedToUser also expects the user's 'id' field.
    const notificationsDeleted = await deleteNotificationsRelatedToUser(userToDelete.id);
    console.log(`Notifications deletion result for user ${userToDelete.id}: ${notificationsDeleted}`);
    
    // Step 3: Delete the user
    const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount && result.deletedCount > 0) {
      revalidatePath('/admin/users');
      revalidatePath('/'); 
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting user by admin:', error);
    if (error instanceof Error) throw error;
    return false;
  }
}

export async function verifyAdminCredentials(email: string, password: string): Promise<User | null> {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (email === adminEmail && password === adminPassword) {
    let adminUser = await getUserProfile(email);
    if (!adminUser) {
      adminUser = await createUser({
        id: 'admin-user-001',
        email,
        password,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        description: 'CardFeed Administrator',
        profileImageUrl: 'https://picsum.photos/seed/adminuser/200/200'
      });
    }
   if (adminUser) {
  adminUser.role = 'admin';
  }
    return adminUser;
  }

  return null;
}