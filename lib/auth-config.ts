export const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export const missingAuthMessage =
  "Authentication is not configured in production yet. Add Clerk environment variables in Vercel to enable Google sign-in and mentorship actions.";
