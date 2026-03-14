import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const item = await prisma.newsContent.findFirst();
    console.log(item);
}
main().finally(() => prisma.$disconnect());
