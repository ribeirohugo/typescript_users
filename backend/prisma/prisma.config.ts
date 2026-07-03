import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';

config({ path: `${__dirname}/../.env` });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost/placeholder',
  },
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
});
