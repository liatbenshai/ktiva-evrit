import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/**
 * Helper function to get the current user ID from the session
 * Falls back to 'default-user' if no session exists (for backward compatibility)
 */
export async function getUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  return session?.user?.id || 'default-user';
}

/**
 * Helper function to get the current user ID from the session (required)
 * Throws an error if no session exists
 */
export async function getUserIdRequired(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized: User must be logged in');
  }
  return session.user.id;
}

