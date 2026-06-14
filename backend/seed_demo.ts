import 'dotenv/config';
import { prisma } from './src/lib/prisma';

async function seed() {
  try {
    const userId = '25b518bf-38d1-470d-b454-14f3cb274192'; // Using the user from the db
    
    console.log('Upserting Currency INR...');
    await prisma.currency.upsert({
      where: { code: 'INR' },
      update: {},
      create: { code: 'INR', symbol: '₹', name: 'Indian Rupee' }
    });

    console.log('Upserting demo group...');
    const group = await prisma.group.upsert({
      where: { id: 'demo-group-id' },
      update: {},
      create: {
        id: 'demo-group-id',
        name: 'Demo Trip',
        baseCurrencyCode: 'INR'
      }
    });

    console.log('Adding user to group...');
    let membership = await prisma.groupMembership.findFirst({
      where: { userId, groupId: 'demo-group-id' }
    });
    if (!membership) {
      await prisma.groupMembership.create({
        data: { userId, groupId: 'demo-group-id', joinDate: new Date() }
      });
    }

    // Also let's create all dummy users to test demo login
    const bcrypt = require('bcrypt');
    const dummyNames = ['Aisha', 'Rohan', 'Priya', 'Meera', 'Dev', 'Sam'];
    const dummyPasswordHash = await bcrypt.hash('dummy', 10);

    for (const dname of dummyNames) {
      let dummyUser = await prisma.user.findUnique({
        where: { email: `${dname.toLowerCase()}@demo.com` }
      });
      if (!dummyUser) {
        dummyUser = await prisma.user.create({
          data: { email: `${dname.toLowerCase()}@demo.com`, passwordHash: dummyPasswordHash, name: dname }
        });
      } else {
        // Update hash if it was previously set to plain text
        await prisma.user.update({
          where: { id: dummyUser.id },
          data: { passwordHash: dummyPasswordHash }
        });
      }

      let dMember = await prisma.groupMembership.findFirst({
        where: { userId: dummyUser.id, groupId: 'demo-group-id' }
      });
      if (!dMember) {
        await prisma.groupMembership.create({
          data: { userId: dummyUser.id, groupId: 'demo-group-id', joinDate: new Date() }
        });
      }
    }

    console.log('Seed complete!');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
