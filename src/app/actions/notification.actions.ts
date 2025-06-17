
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
    newStatus: notificationDoc.newStatus || undefined, 
     commentId: notificationDoc.commentId || undefined,
    commentText: notificationDoc.commentText || undefined,
    parentCommentAuthorId: notificationDoc.parentCommentAuthorId || undefined,
  };
}

export async function createNotification(
  targetUserId: string,
  type: Notification['type'],
  postId: string,
  postSlug: string,
  postTitle: string,
  actingUser: UserSummary,
  newStatus?: 'accepted' | 'rejected' ,
  commentId?: string, 
  commentText?: string,
  parentCommentAuthorId?: string
): Promise<Notification | null> {
  try {
    if (type !== 'post_status_change' && targetUserId === actingUser.id) {
      console.log(`Skipping notification: target user ${targetUserId} is the same as acting user ${actingUser.id} for type ${type}`);
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

    if (type === 'post_status_change' && newStatus) {
      newNotificationData.newStatus = newStatus;
    }
        if ((type === 'comment_like' || type === 'comment_reply') && commentId) {
      newNotificationData.commentId = commentId;
    }
    if (commentText && (type === 'comment_reply' || type === 'comment_like' || type === 'comment')) {
        newNotificationData.commentText = commentText;
    }
    if (type === 'comment_reply' && parentCommentAuthorId) { // Should align with targetUserId
        newNotificationData.parentCommentAuthorId = parentCommentAuthorId;
    }

    const result = await notificationsCollection.insertOne(newNotificationData as any);

    if (result.insertedId) {
      revalidatePath(`/notifications`); // General revalidation for the target user
      revalidatePath(`/profile/${targetUserId}`); // Also revalidate profile if needed

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
      .limit(50)
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
      { _id: new ObjectId(notificationId), userId: userId },
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
    return result.matchedCount > 0 && result.modifiedCount === 0;
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

export async function deleteNotificationsRelatedToUser(userIdToDelete: string): Promise<boolean> {
  try {
    const db = await getDb();
    const notificationsCollection = db.collection('notifications');
    // Delete notifications where the user is the recipient OR the actor
    const result = await notificationsCollection.deleteMany({
      $or: [
        { userId: userIdToDelete },
        { "actingUser.id": userIdToDelete }
      ]
    });
    console.log(`Deleted ${result.deletedCount} notifications related to user ID ${userIdToDelete}`);
    revalidatePath('/notifications'); // Revalidate for any user viewing their notifications
    return result.acknowledged;
  } catch (error) {
    console.error(`Error deleting notifications related to user ID ${userIdToDelete}:`, error);
    return false;
  }
}
