
// src/app/actions/user.actions.ts
'use server';

import clientPromise from '@/lib/mongodb';
import type { User, UpdateUserProfileInput, CreateUserByAdminInput, UpdateUserByAdminInput } from '@/types';
import type { GoogleAuthData, CompleteProfileFormData as ClientCompleteProfileFormData } from '@/contexts/auth-context';
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
    _id: stringId, 
    id: userDoc.id || stringId, 
    password: undefined, 
    profileImageUrl: userDoc.profileImageUrl || undefined,
    isBlocked: userDoc.isBlocked || false,
    socialLinks: userDoc.socialLinks || {},  
    createdAt: userDoc.createdAt ? new Date(userDoc.createdAt).toISOString() : undefined,
    updatedAt: userDoc.updatedAt ? new Date(userDoc.updatedAt).toISOString() : undefined,
    authProvider: userDoc.authProvider || (userDoc.googleId ? 'google' : 'email'),
  };
}


let mockUsers: User[] = [
  {
    _id: 'mock-user-123', 
    id: 'mock-user-123',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo.user@example.com',
    
    description: 'A passionate writer and reader on CardFeed.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-ada',
    id: 'author-ada',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada.lovelace@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=AL`,
    description: 'Pioneering computer scientist and writer of the first algorithm. Enjoys discussing technology on CardFeed.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-marco',
    id: 'author-marco',
    firstName: 'Marco',
    lastName: 'Polo Jr.',
    email: 'marco.polo@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=MP`,
    description: 'Avid explorer and storyteller, sharing tales from distant lands and travel experiences.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
   {
    _id: 'author-julia',
    id: 'author-julia',
    firstName: 'Julia',
    lastName: 'Childish',
    email: 'julia.childish@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=JC`,
    description: 'Culinary enthusiast sharing recipes and food adventures on CardFeed.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ... (other mock users updated similarly with placehold.co)
  {
    _id: 'author-marie',
    id: 'author-marie',
    firstName: 'Marie',
    lastName: 'Kondoversy',
    email: 'marie.kondoversy@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=MK`,
    description: 'Expert in minimalist living and decluttering, inspiring a simpler lifestyle.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-elon',
    id: 'author-elon',
    firstName: 'Elon',
    lastName: 'Tusk',
    email: 'elon.tusk@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=ET`,
    description: 'Visionary entrepreneur discussing sustainable business and future technologies.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
    {
    _id: 'author-buddha',
    id: 'author-buddha',
    firstName: 'Buddha',
    lastName: 'Lee',
    email: 'buddha.lee@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=BL`,
    description: 'Spiritual guide sharing insights on mindfulness and health & wellness.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-satoshi',
    id: 'author-satoshi',
    firstName: 'Satoshi',
    lastName: 'Notamoto',
    email: 'satoshi.notamoto@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=SN`,
    description: 'Cryptocurrency expert demystifying finance and blockchain technology.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-xavier',
    id: 'author-xavier',
    firstName: 'Prof.',
    lastName: 'Xavier',
    email: 'prof.xavier@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=PX`,
    description: 'Educator exploring innovative teaching methods and gamification in learning.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-banksy',
    id: 'author-banksy',
    firstName: 'Banksy',
    lastName: 'Not',
    email: 'banksy.not@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=BN`,
    description: 'Art enthusiast commenting on street art, culture, and its evolution.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-dreamwell',
    id: 'author-dreamwell',
    firstName: 'Dr.',
    lastName: 'Dreamwell',
    email: 'dr.dreamwell@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=DD`,
    description: 'Scientist specializing in sleep research and its importance for well-being.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-patty',
    id: 'author-patty',
    firstName: 'Patty',
    lastName: 'Planter',
    email: 'patty.planter@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=PP`,
    description: 'Gardening guru sharing tips for urban gardening and home decor.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-henry',
    id: 'author-henry',
    firstName: 'Henry',
    lastName: 'Ford II',
    email: 'henry.fordii@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=HF`,
    description: 'Automotive industry commentator discussing electric vehicles and future trends.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-cesar',
    id: 'author-cesar',
    firstName: 'Cesar',
    lastName: 'Millan Jr.',
    email: 'cesar.millanjr@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=CM`,
    description: 'Pet behavior expert helping owners understand their canine companions.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-ninja',
    id: 'author-ninja',
    firstName: 'Ninja',
    lastName: 'Turtle',
    email: 'ninja.turtle@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=NT`,
    description: 'eSports analyst and commentator on the impact of gaming on sports.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-pacman',
    id: 'author-pacman',
    firstName: 'Pac',
    lastName: 'Man',
    email: 'pac.man@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=PM`,
    description: 'Retro gaming aficionado exploring classic video games and their revival.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'author-martha',
    id: 'author-martha',
    firstName: 'Martha',
    lastName: 'Stewart Jr.',
    email: 'martha.stewartjr@example.com',
    profileImageUrl: `https://placehold.co/200x200.png?text=MS`,
    description: 'DIY expert sharing budget-friendly home decor and lifestyle ideas.',
    role: 'user',
    authProvider: 'admin_created', 
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  ...(process.env.NEXT_PUBLIC_ADMIN_EMAIL ? [{
    _id: 'admin-user-001',
    id: 'admin-user-001', 
    firstName: 'Admin',
    lastName: 'User',
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    description: 'CardFeed Administrator.',
    role: 'admin' as 'admin',
    authProvider: 'email' as 'email',
    isBlocked: false,
    socialLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }] : [])
];


export async function getUserProfile(userIdOrEmail: string): Promise<User | null> {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    let userDoc = null;
    if (ObjectId.isValid(userIdOrEmail)) {
        userDoc = await usersCollection.findOne({ _id: new ObjectId(userIdOrEmail) });
    }
    if (!userDoc) {
        userDoc = await usersCollection.findOne({ id: userIdOrEmail });
    }
    if (!userDoc && userIdOrEmail.includes('@')) {
        userDoc = await usersCollection.findOne({ email: userIdOrEmail });
    }

    if (userDoc) {
      return mapUserToDto(userDoc);
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

    if (!ObjectId.isValid(userId)) {
      console.error('Invalid ObjectId for updateUserProfile with _id:', userId);
      const userByCustomId = await usersCollection.findOne({ id: userId });
      if (!userByCustomId) {
         console.error(`User not found by custom ID ${userId} either for updateUserProfile.`);
         return null;
      }
      userId = userByCustomId._id.toString(); 
    }


    const updatePayload: Partial<Omit<User, 'id' | '_id' | 'email' | 'createdAt' | 'password' | 'authProvider' | 'role'>> & { updatedAt?: Date } = {
        updatedAt: new Date()
    };
    if (data.firstName !== undefined) updatePayload.firstName = data.firstName;
    if (data.lastName !== undefined) updatePayload.lastName = data.lastName;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.profileImageUrl !== undefined) {
        updatePayload.profileImageUrl = data.profileImageUrl || undefined; 
    }
    if (data.socialLinks !== undefined) {
      const cleanSocialLinks: User['socialLinks'] = {};
      for (const [key, value] of Object.entries(data.socialLinks)) {
        if (value && value.trim() !== '') {
          cleanSocialLinks[key as keyof User['socialLinks']] = value.trim();
        }
      }
      updatePayload.socialLinks = cleanSocialLinks;
    }



    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) }, 
      { $set: updatePayload },
      { returnDocument: 'after' }
    );

    if (result) {
      const mappedUser = mapUserToDto(result);
      revalidatePath(`/profile/${mappedUser.id}`); 
      revalidatePath('/'); 
      revalidatePath('/admin/users');
      return mappedUser;
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
            console.log(`User with email ${userData.email} already exists. Updating relevant fields if necessary.`);
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
                updateOps.$set.password = userData.password; // Hash in production
                needsUpdate = true;
            }
            if (userData.isBlocked !== undefined && existingUserByEmail.isBlocked !== userData.isBlocked) {
                updateOps.$set.isBlocked = userData.isBlocked;
                needsUpdate = true;
            }
            if (userData.profileImageUrl !==undefined && existingUserByEmail.profileImageUrl !== userData.profileImageUrl) {
                updateOps.$set.profileImageUrl = userData.profileImageUrl || undefined ;
                needsUpdate = true;
            }
            if (userData.socialLinks && JSON.stringify(existingUserByEmail.socialLinks || {}) !== JSON.stringify(userData.socialLinks)) {
                updateOps.$set.socialLinks = userData.socialLinks || {};
                needsUpdate = true;
            }

            if (needsUpdate) {
                await usersCollection.updateOne({ _id: existingUserByEmail._id }, updateOps);
            }
            return mapUserToDto(await usersCollection.findOne({ _id: existingUserByEmail._id }));
        }

        const newMongoId = new ObjectId(); 
        const newUserIdString = newMongoId.toString(); 

        const userDocumentForDb: any = {
            _id: newMongoId, 
            id: newUserIdString, 
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            profileImageUrl: userData.profileImageUrl || undefined,
            description: userData.description || '',
            role: userData.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : (userData.role || 'user'),
            authProvider: userData.authProvider || (userData.googleId ? 'google' : 'email'),
            googleId: userData.googleId,
            isBlocked: userData.isBlocked || false,
            socialLinks: userData.socialLinks || {},
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        if (userData.password) {
            userDocumentForDb.password = userData.password; // Hash in production
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
        if (error instanceof Error && (error as any).code === 11000) { 
            if ((error as any).message.includes('email_1')) {
                 throw new Error("An account with this email already exists.");
            } else if ((error as any).message.includes('id_1')) { 
                 throw new Error("An account with this custom ID already exists.");
            }
            throw new Error("A unique constraint was violated (e.g., email or ID already exists).");
        }
        throw error;
    }
}

export async function findOrCreateUserFromGoogle({
  googleAuthData, // Contains original Google profileImageUrl and other Google details
  profileFormData, // Contains names, desc, and potentially new profileImageDataUri from user upload
}: {
  googleAuthData: GoogleAuthData; 
  profileFormData: ClientCompleteProfileFormData; 
}): Promise<User | null> {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    let userDoc = await usersCollection.findOne({ email: googleAuthData.email });

    // Prioritize image uploaded by user in the dialog, then Google's, then fallback
    const profileImageUrlToSave = profileFormData.profileImageUrl || undefined;


    if (userDoc) {
      const updatePayload: Partial<Omit<User, 'id' | '_id' | 'email' | 'createdAt'>> & { updatedAt: Date, googleId?: string, authProvider?: User['authProvider'], socialLinks?: User['socialLinks'] } = {
        firstName: profileFormData.firstName || userDoc.firstName, 
        lastName: profileFormData.lastName || userDoc.lastName,
        description: profileFormData.description || userDoc.description,
        profileImageUrl: profileImageUrlToSave, 
        authProvider: 'google',
        isBlocked: userDoc.isBlocked || false,
        socialLinks: userDoc.socialLinks || {}, // Preserve existing social links
        updatedAt: new Date(),
      };
      if (googleAuthData.googleId && !userDoc.googleId) {
        updatePayload.googleId = googleAuthData.googleId;
      }
       if (!userDoc.role) { // Set role if not already set
          updatePayload.role = googleAuthData.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : 'user';
      }


      const result = await usersCollection.findOneAndUpdate(
        { _id: userDoc._id },
        { $set: updatePayload },
        { returnDocument: 'after' }
      );
      if (result) {
        const mappedUser = mapUserToDto(result);
        revalidatePath(`/profile/${mappedUser.id}`);
        revalidatePath('/admin/users');
        return mappedUser;
      }
      return null;

    } else {
      // New user creation path
      const newMongoId = new ObjectId();
      const newUserIdString = newMongoId.toString();

      const newUserDocument = {
        _id: newMongoId,
        id: newUserIdString, 
        googleId: googleAuthData.googleId,
        email: googleAuthData.email,
        firstName: profileFormData.firstName, // From dialog
        lastName: profileFormData.lastName,   // From dialog
        description: profileFormData.description, // From dialog
        profileImageUrl: profileImageUrlToSave,   // Resolved image URL (could be data URI)
        role: googleAuthData.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : 'user',
        authProvider: 'google' as 'google',
        isBlocked: false, 
        socialLinks: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertResult = await usersCollection.insertOne(newUserDocument);
      if (insertResult.insertedId) {
        const insertedDoc = await usersCollection.findOne({ _id: insertResult.insertedId });
        if (insertedDoc) {
            const mappedUser = mapUserToDto(insertedDoc);
            revalidatePath(`/profile/${mappedUser.id}`);
            revalidatePath('/admin/users');
            return mappedUser;
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
        let userInDb = await usersCollection.findOne({ email: mockUser.email });
        
        if (!userInDb && mockUser.id && !ObjectId.isValid(mockUser.id)) {
            userInDb = await usersCollection.findOne({ id: mockUser.id });
        }


        if (!userInDb) {
             const { _id, password, ...restOfMockUser } = mockUser; 
             
             const userToCreatePayload: Omit<User, '_id' | 'id'> & { id?: string, password?: string } = {
                 ...restOfMockUser, 
                 id: mockUser.id, 
                 role: mockUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : (mockUser.role || 'user'),
                 authProvider: mockUser.authProvider || 'admin_created', 
                 isBlocked: mockUser.isBlocked || false,
                 profileImageUrl: mockUser.profileImageUrl || undefined,
                 socialLinks: mockUser.socialLinks || {},
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
            let updateNeeded = false;
            const updateOps: any = { $set: {} };

            const expectedRole = mockUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : (mockUser.role || 'user');
            if (userInDb.role !== expectedRole) {
                updateOps.$set.role = expectedRole;
                updateNeeded = true;
            }

            const expectedAuthProvider = mockUser.authProvider || (userInDb.googleId ? 'google' : 'admin_created');
            if (userInDb.authProvider !== expectedAuthProvider) {
                updateOps.$set.authProvider = expectedAuthProvider;
                updateNeeded = true;
            }
            if (userInDb.isBlocked === undefined || userInDb.isBlocked !== (mockUser.isBlocked || false)) { 
                updateOps.$set.isBlocked = mockUser.isBlocked || false;
                updateNeeded = true;
            }
            if (userInDb.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && process.env.ADMIN_PASSWORD && userInDb.password !== process.env.ADMIN_PASSWORD) {
                updateOps.$set.password = process.env.ADMIN_PASSWORD; 
                updateNeeded = true;
            }
            if (!userInDb.createdAt) {
                updateOps.$set.createdAt = mockUser.createdAt || new Date();
                updateNeeded = true;
            }
            if (mockUser.profileImageUrl !== undefined && userInDb.profileImageUrl !== mockUser.profileImageUrl) {
                updateOps.$set.profileImageUrl = mockUser.profileImageUrl || undefined;
                updateNeeded = true;
            }
            if (JSON.stringify(userInDb.socialLinks || {}) !== JSON.stringify(mockUser.socialLinks || {})) {
                updateOps.$set.socialLinks = mockUser.socialLinks || {};
                updateNeeded = true;
            }
            if (!userInDb.updatedAt || updateNeeded) {
                updateOps.$set.updatedAt = new Date(); 
                updateNeeded = true; 
            }
            if (userInDb.id !== mockUser.id && !ObjectId.isValid(mockUser.id)) {
                 updateOps.$set.id = mockUser.id;
                 updateNeeded = true;
            }


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

    // Use provided profileImageUrl (data URI) or fallback to placehold.co
    const profileImageUrlToSave = userData.profileImageUrl || undefined;

    const userDocumentForDb: Omit<User, '_id' | 'id'> & { _id: ObjectId, id: string, password?: string } = {
      _id: newMongoId,
      id: newUserIdString, 
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      profileImageUrl: profileImageUrlToSave,
      description: userData.description || '',
      role: userData.role,
      authProvider: 'admin_created', 
      isBlocked: false, 
      socialLinks: userData.socialLinks || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Password is now optional in CreateUserByAdminInput
    if (userData.password) {
      userDocumentForDb.password = userData.password; // Hash in production
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
        if ((error as any).code === 11000) { 
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
    if (data.email !== undefined) updatePayload.email = data.email; 
    if (data.description !== undefined) updatePayload.description = data.description;
    
    if (data.profileImageUrl !== undefined) { // profileImageUrl could be a data URI
        updatePayload.profileImageUrl = data.profileImageUrl || undefined;
    }
    
    if (data.role !== undefined) updatePayload.role = data.role;
    if (data.isBlocked !== undefined) updatePayload.isBlocked = data.isBlocked;
        if (data.socialLinks !== undefined) {
      const cleanSocialLinks: User['socialLinks'] = {};
      for (const [key, value] of Object.entries(data.socialLinks)) {
        if (value && value.trim() !== '') {
          cleanSocialLinks[key as keyof User['socialLinks']] = value.trim();
        }
      }
      updatePayload.socialLinks = cleanSocialLinks;
    }
    

    const fieldsToUpdate = Object.keys(updatePayload).filter(key => key !== 'updatedAt');
    // If profileImageUrl is explicitly set (even if to empty string to clear it), consider it a change.
     if (fieldsToUpdate.length === 0 && !Object.prototype.hasOwnProperty.call(data, 'profileImageUrl') && !Object.prototype.hasOwnProperty.call(data, 'socialLinks')) {  
      console.log("[updateUserByAdmin] No changed fields provided for update. Fetching current user.");
      const currentUserDoc = await usersCollection.findOne({ _id: new ObjectId(userId) });
      return currentUserDoc ? mapUserToDto(currentUserDoc) : null;
    }
    
    console.log("[updateUserByAdmin] Update payload for MongoDB:", JSON.stringify(updatePayload, null, 2));

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) as any }, // Query with ObjectId
      { $set: updatePayload },
      { returnDocument: 'after' }
    );
    
    console.log("[updateUserByAdmin] MongoDB findOneAndUpdate result:", result);

    if (result) {
      revalidatePath('/admin/users');
      const mappedUser = mapUserToDto(result);
      revalidatePath(`/profile/${mappedUser.id}`); 
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

export async function deleteUserByAdmin(userId: string): Promise<boolean> { 
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    if (!ObjectId.isValid(userId)) {
      console.error('Invalid ObjectId for deleteUserByAdmin:', userId);
      return false;
    }

    const userToDelete = await usersCollection.findOne({_id: new ObjectId(userId) as any});
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

    const postsDeleted = await deletePostsByAuthorId(userToDelete.id); 
    console.log(`Posts deletion result for user ${userToDelete.id}: ${postsDeleted}`);

    const notificationsDeleted = await deleteNotificationsRelatedToUser(userToDelete.id);
    console.log(`Notifications deletion result for user ${userToDelete.id}: ${notificationsDeleted}`);
    
    const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) as any });

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
              // id: 'admin-user-001', // createUser will assign ID based on MongoDB _id
              email: process.env.NEXT_PUBLIC_ADMIN_EMAIL!,
              firstName: 'Admin',
              lastName: 'User',
              role: 'admin',
              authProvider: 'email',
              password: process.env.ADMIN_PASSWORD, // Store password for admin if creating for the first time
              description: 'CardFeed Administrator',
              profileImageUrl: undefined
            });
    }
   if (adminUser) {
  adminUser.role = 'admin';
  }
    return adminUser;
  }

  return null;
}