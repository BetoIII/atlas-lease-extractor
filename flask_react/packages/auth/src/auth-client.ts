import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001",
  // Add additional configuration for better error handling
  onError: (error: any) => {
    console.error("Auth client error:", error);
  },
});
