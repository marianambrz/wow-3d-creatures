import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to use the database.");

const globalForDatabase = globalThis as typeof globalThis & { animalControllerSql?: ReturnType<typeof postgres> };
const sql = globalForDatabase.animalControllerSql ?? postgres(databaseUrl, { max: 5, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDatabase.animalControllerSql = sql;

export const db = drizzle(sql, { schema });
