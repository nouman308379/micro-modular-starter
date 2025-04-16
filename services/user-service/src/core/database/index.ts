import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

console.log("Connecting to database...");
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL!,
    ssl: false,
  },
});

export default db;
