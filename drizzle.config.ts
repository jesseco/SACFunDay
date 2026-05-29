import type { Config } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL || "file:./sacfundday.db";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseUrl,
    // For Turso, authToken is handled via environment when using the client
    // but drizzle-kit for remote needs it in some setups
    ...(databaseUrl.startsWith("libsql://") && process.env.DATABASE_AUTH_TOKEN
      ? { authToken: process.env.DATABASE_AUTH_TOKEN }
      : {}),
  },
} satisfies Config;