import { config } from 'dotenv';

config({ path: `${__dirname}/../.env` });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set');

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const email = process.env.SUPER_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SUPER_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: {
      email,
      name: 'Super Admin',
      password: hashed,
      role: 'ADMIN',
    },
  });

  console.log(`Super admin ready: ${admin.email}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
