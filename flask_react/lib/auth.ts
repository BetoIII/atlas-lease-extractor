import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { nextCookies } from "better-auth/next-js";

// Create a single database pool instance
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Add connection pool settings to prevent connection issues
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: pool,
  emailAndPassword: { 
    enabled: true,
    requireEmailVerification: false, // Set to true in production
    // Add additional configuration for better user management
    userFields: {
      name: true,
    },
    // Add password configuration
    passwordMinLength: 8,
    // Ensure proper user lookup
    getUserByEmail: async (email: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("Looking up user by email:", email);
      }
      const result = await pool.query('SELECT * FROM "user" WHERE email = $1', [email]);
      if (process.env.NODE_ENV === 'development') {
        console.log("User lookup result:", result.rows);
      }
      return result.rows[0] || null;
    },
  },
  plugins: [nextCookies()],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  // Add debug logging to help troubleshoot
  debug: process.env.NODE_ENV === "development",
  // Add additional configuration for better error handling
  onError: (error: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error("Better Auth error:", error);
    }
  },
});
