/**
 * Drizzle Kit Configuration
 *
 * Configuration for generating and managing database migrations
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './database/schema.ts',
  out: './drizzle',
});
