// Helper function to ensure consistent user ID handling
export function getUserId(clerkId: string): string {
  // Clerk IDs are already UUIDs, but stored as text in our database
  // This ensures we're using the raw UUID string format
  return clerkId;
}
