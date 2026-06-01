import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@nokta.app';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'AdminPass123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Nokta Admin',
      phone: '+201000000001',
      role: UserRole.ADMIN,
      walletBalance: 0,
    },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const riderEmail = process.env.SEED_RIDER_EMAIL ?? 'rider@nokta.app';
  const riderPassword = process.env.SEED_RIDER_PASSWORD ?? 'RiderPass123!';

  await prisma.user.upsert({
    where: { email: riderEmail },
    create: {
      email: riderEmail,
      passwordHash: await bcrypt.hash(riderPassword, 12),
      name: 'Demo Rider',
      phone: '+201000000002',
      role: UserRole.RIDER,
      walletBalance: 500,
      riderProfile: { create: {} },
    },
    update: {
      isActive: true,
    },
  });

  console.log('Seed complete.');
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Rider: ${riderEmail} / ${riderPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
