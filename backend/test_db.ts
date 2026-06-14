import { prisma } from './src/lib/prisma';

async function main() {
  try {
    const group = await prisma.group.findUnique({ where: { id: 'demo-group-id' }});
    console.log("Group:", group);

    const user = await prisma.user.findFirst();
    console.log("User:", user);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
