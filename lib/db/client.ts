import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { createClient as createLibsqlClient } from "@libsql/client";
import Database from "better-sqlite3";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL || "file:./sacfundday.db";

export const db = databaseUrl.startsWith("file:")
  ? drizzleSqlite(new Database(databaseUrl.replace("file:", "")), { schema })
  : drizzleLibsql(
      createLibsqlClient({
        url: databaseUrl,
        authToken: process.env.DATABASE_AUTH_TOKEN,
      }),
      { schema }
    );

export type DB = typeof db;