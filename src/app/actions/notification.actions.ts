// src/app/actions/notification.actions.ts
'use server';

import clientPromise from '@/lib/mongodb';
import type { Notification, UserSummary } from '@/types';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';

async function getDb() {
  const client = await clientPromise;
  return client.db();
}

function mapNotificationToDto(notificationDoc: any): Notification {
  return {
    ...notificationDoc,
    _id: notificationDoc._id?.toString(),
    id: notificationDoc._id?.toString(),
  };
}

export async function createNotification(
  targetUserId: string,
  type: 'like' | 'comment',
  postId: string,
  postSlug: string,
  postTitle: string,
  actingUser: UserSummary
): Promise<Notification | null> {
  try {
    // Avoid notifying user for their own actions on their own posts (though post.actions should also check this)
    if (targetUserId === actingUser.id) {
      console.log(`Skipping notification: target user ${targetUserId} is the same as acting user ${actingUser.id}`);
      return null;
    }

    const db = await getDb();
    const notificationsCollection = db.collection('notifications');

    const newNotificationData: Omit<Notification, 'id' | '_id'> = {
      userId: targetUserId,
      type,
      postId,
      postSlug,
      postTitle,
      actingUser,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const result = await notificationsCollection.insertOne(newNotificationData as any);
    
    if (result.insertedId) {
      // Revalidate the notifications page for the target user
      revalidatePath(`/notifications`); // General revalidation, or could target user-specific path if notifications are fetched that way
      
      const createdNotification = await notificationsCollection.findOne({ _id: result.insertedId });
      return createdNotification ? mapNotificationToDto(createdNotification) : null;
    }
    return null;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  try {
    const db = await getDb();
    const notificationsCollection = db.collection('notifications');
    const notifications = await notificationsCollection
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to a reasonable number
      .toArray();
    return notifications.map(mapNotificationToDto);
  } catch (error) {
    console.error('Error fetching notifications for user:', error);
    return [];
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
    try {
        const db = await getDb();
        const notificationsCollection = db.collection('notifications');
        const count = await notificationsCollection.countDocuments({ userId: userId, isRead: false });
        return count;
    } catch (error) {
        console.error('Error fetching unread notification count:', error);
        return 0;
    }
}


export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  try {
    if (!ObjectId.isValid(notificationId)) {
        console.error('Invalid ObjectId for markNotificationAsRead:', notificationId);
        return false;
    }
    const db = await getDb();
    const notificationsCollection = db.collection('notifications');
    const result = await notificationsCollection.updateOne(
      { _id: new ObjectId(notificationId), userId: userId }, // Ensure user owns notification
      { $set: { isRead: true } }
    );
    if (result.modifiedCount > 0) {
      revalidatePath('/notifications');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const db = await getDb();
    const notificationsCollection = db.collection('notifications');
    const result = await notificationsCollection.updateMany(
      { userId: userId, isRead: false },
      { $set: { isRead: true } }
    );
    if (result.modifiedCount > 0) {
      revalidatePath('/notifications');
      return true;
    }
    return result.matchedCount > 0 && result.modifiedCount === 0; // All were already read
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

export async function deleteNotification(notificationId: string, userId: string): Promise<boolean> {
  try {
     if (!ObjectId.isValid(notificationId)) {
        console.error('Invalid ObjectId for deleteNotification:', notificationId);
        return false;
    }
    const db = await getDb();
    const notificationsCollection = db.collection('notifications');
    const result = await notificationsCollection.deleteOne({ _id: new ObjectId(notificationId), userId: userId });
    if (result.deletedCount > 0) {
      revalidatePath('/notifications');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

export async function deleteAllNotifications(userId: string): Promise<boolean> {
  try {
    const db = await getDb();
    const notificationsCollection = db.collection('notifications');
    const result = await notificationsCollection.deleteMany({ userId: userId });
    if (result.deletedCount > 0) {
      revalidatePath('/notifications');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return false;
  }
}
