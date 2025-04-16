
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './core/database/migrations',
  schema: './core/database/schemas/schema.ts', 
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://postgres:nouman@23@localhost:5432/lobbyIQ",
  },
});