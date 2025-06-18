
// src/app/actions/notification.actions.ts
'use server';

import clientPromise from '@/lib/mongodb';
import type { User, Notification, UserSummary, AdminNotificationPayload, TargetingOptions, AdminAnnouncementLogEntry, Post } from '@/types';
import { getAllUsers } from './user.actions'; // Assuming getAllUsers fetches just IDs or minimal data
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { getPosts } from './post.actions';

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
    commentText: notificationDoc.commentText || undefined, // Used for comment text or announcement body
    parentCommentAuthorId: notificationDoc.parentCommentAuthorId || undefined,
    postTitle: notificationDoc.postTitle || undefined, // Used for post title or announcement title
    externalLink: notificationDoc.externalLink || undefined, // For admin announcements
    postId: notificationDoc.postId || undefined,
    postSlug: notificationDoc.postSlug || undefined,
  };
}

function mapAdminAnnouncementLogEntryToDto(logDoc: any): AdminAnnouncementLogEntry {
  return {
    ...logDoc,
    _id: logDoc._id?.toString(),
    id: logDoc._id?.toString(),
    sentAt: new Date(logDoc.sentAt).toISOString(),
  };
}

export interface CreateNotificationParams {
  targetUserId: string;
  type: Notification['type'];
  actingUser: UserSummary;
  // Optional fields based on type
  postId?: string;
  postSlug?: string;
  postTitle?: string; // Re-purposed for Admin Announcement Title
  commentId?: string;
  commentText?: string; // Re-purposed for Admin Announcement Body
  parentCommentAuthorId?: string;
  newStatus?: 'accepted' | 'rejected';
  externalLink?: string; // For Admin Announcements
}

export async function createNotification(params: CreateNotificationParams): Promise<Notification | null> {
  try {
    const {
      targetUserId,
      type,
      actingUser,
      postId,
      postSlug,
      postTitle,
      commentId,
      commentText,
      parentCommentAuthorId,
      newStatus,
      externalLink,
    } = params;

    // Avoid notifying user for their own actions on their own posts/comments, unless it's a status change or admin announcement
    if (type !== 'post_status_change' && type !== 'admin_announcement' && targetUserId === actingUser.id) {
      console.log(`Skipping notification: target user ${targetUserId} is the same as acting user ${actingUser.id} for type ${type}`);
      return null;
    }

    const db = await getDb();
    const notificationsCollection = db.collection('notifications');

    const newNotificationData: Omit<Notification, 'id' | '_id'> = {
      userId: targetUserId,
      type,
      actingUser,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    // Populate fields based on type and provided data
    if (postTitle) newNotificationData.postTitle = postTitle; // Announcement title or post title
    if (commentText) newNotificationData.commentText = commentText; // Announcement body or comment text
    if (externalLink && type === 'admin_announcement') newNotificationData.externalLink = externalLink;

    if (type !== 'admin_announcement') { // Fields specific to non-admin announcements
        if (postId) newNotificationData.postId = postId;
        if (postSlug) newNotificationData.postSlug = postSlug;
    }

    if (type === 'post_status_change' && newStatus) {
      newNotificationData.newStatus = newStatus;
    }
    if ((type === 'comment_like' || type === 'comment_reply') && commentId) {
      newNotificationData.commentId = commentId;
    }
    if (type === 'comment_reply' && parentCommentAuthorId) {
      newNotificationData.parentCommentAuthorId = parentCommentAuthorId;
    }


    const result = await notificationsCollection.insertOne(newNotificationData as any);

    if (result.insertedId) {
      revalidatePath(`/notifications`); // General revalidation for the target user
      revalidatePath(`/profile/${targetUserId}`); // Revalidate target user's profile (might show notification counts)

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

// New action for sending bulk notifications
export async function sendBulkNotificationsByAdmin(payload: AdminNotificationPayload): Promise<{ success: boolean; count: number; errors: number; totalTargeted: number }> {
  const { title, description, externalLink, targeting } = payload;
  let usersToNotifyIds: string[] = [];
  let successCount = 0;
  let errorCount = 0;
  let targetIdentifierForLog: string[] | string | null = null;

  const adminActor: UserSummary = {
    id: 'admin_system',
    name: 'CardFeed Admin',
    imageUrl: undefined,
  };

  const db = await getDb();
  const adminAnnouncementsLogCollection = db.collection('admin_announcements_log');
  const logEntryId = new ObjectId();

  try {
    if (targeting.type === 'all') {
      console.warn("PERFORMANCE_WARNING: Sending notification to all users. This is not scalable for large user bases. Consider a background job system.");
      const allUsersFromDb = await getAllUsers();
      usersToNotifyIds = allUsersFromDb.map(u => u.id);
      targetIdentifierForLog = null;
    } else if (targeting.type === 'specific') {
      usersToNotifyIds = targeting.userIds;
      targetIdentifierForLog = targeting.userIds;
    } else if (targeting.type === 'category') {
      const postsInCategory = await getPosts(1, 10000, targeting.categorySlug); // Fetch a large number to get all authors
      const authorIds = new Set<string>();
      postsInCategory.posts.forEach(post => {
        if (post.author?.id) {
          authorIds.add(post.author.id);
        }
      });
      usersToNotifyIds = Array.from(authorIds);
      targetIdentifierForLog = targeting.categorySlug;
    }

    if (usersToNotifyIds.length === 0) {
      await adminAnnouncementsLogCollection.insertOne({
        _id: logEntryId,
        id: logEntryId.toString(),
        title, description, externalLink,
        targetingType: targeting.type,
        targetIdentifier: targetIdentifierForLog,
        sentAt: new Date().toISOString(),
        status: 'failed', // No users targeted
        successCount: 0, errorCount: 0, totalTargeted: 0,
      });
      return { success: false, count: 0, errors: 0, totalTargeted: 0 };
    }
    
    console.log(`Attempting to send admin announcement to ${usersToNotifyIds.length} users (Type: ${targeting.type}).`);

    for (const userId of usersToNotifyIds) {
      try {
        const notificationParams: CreateNotificationParams = {
          targetUserId: userId,
          type: 'admin_announcement',
          actingUser: adminActor,
          postTitle: title,
          commentText: description,
          externalLink: externalLink,
        };
        const created = await createNotification(notificationParams);
        if (created) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (e) {
        console.error(`Failed to create notification for user ${userId}:`, e);
        errorCount++;
      }
    }
    
    const finalStatus = errorCount === 0 ? 'completed' : (successCount > 0 ? 'partial_failure' : 'failed');
    await adminAnnouncementsLogCollection.insertOne({
      _id: logEntryId,
      id: logEntryId.toString(),
      title, description, externalLink,
      targetingType: targeting.type,
      targetIdentifier: targetIdentifierForLog,
      sentAt: new Date().toISOString(),
      status: finalStatus,
      successCount, errorCount, totalTargeted: usersToNotifyIds.length,
    });
    revalidatePath('/admin/notifications-log');

    return { success: errorCount === 0, count: successCount, errors: errorCount, totalTargeted: usersToNotifyIds.length };

  } catch (error) {
    console.error('Error in sendBulkNotificationsByAdmin:', error);
    await adminAnnouncementsLogCollection.insertOne({
      _id: logEntryId,
      id: logEntryId.toString(),
      title, description, externalLink,
      targetingType: targeting.type,
      targetIdentifier: targetIdentifierForLog,
      sentAt: new Date().toISOString(),
      status: 'failed',
      successCount, errorCount, totalTargeted: usersToNotifyIds.length,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return { success: false, count: successCount, errors: usersToNotifyIds.length - successCount, totalTargeted: usersToNotifyIds.length };
  }
}

export async function getAdminAnnouncementLog(): Promise<AdminAnnouncementLogEntry[]> {
  try {
    const db = await getDb();
    const logCollection = db.collection('admin_announcements_log');
    const logs = await logCollection.find({}).sort({ sentAt: -1 }).limit(100).toArray();
    return logs.map(mapAdminAnnouncementLogEntryToDto);
  } catch (error) {
    console.error('Error fetching admin announcement log:', error);
    return [];
  }
}