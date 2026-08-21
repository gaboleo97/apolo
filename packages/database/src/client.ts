import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as coreSchema from "./schema/core";
import * as inventorySchema from "./schema/inventory";
import * as suppliersSchema from "./schema/suppliers";
import * as clientsSchema from "./schema/clients";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, {
  schema: { ...coreSchema, ...inventorySchema, ...suppliersSchema, ...clientsSchema },
});
export type DB = typeof db;
