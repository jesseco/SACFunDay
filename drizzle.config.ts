import type { Config } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL || "file:./sacfundday.db";
const isTurso = databaseUrl.startsWith("libsql://");

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: isTurso ? "turso" : "sqlite",
  dbCredentials: {
    url: databaseUrl,
    ...(isTurso && process.env.DATABASE_AUTH_TOKEN
      ? { authToken: process.env.DATABASE_AUTH_TOKEN }
      : {}),
  },
} satisfies Config;