import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const commentCount = await prisma.comment.count()
  const userCount = await prisma.user.count()
  const projectCount = await prisma.project.count()
  const pageCount = await prisma.page.count()

  console.log(`--- Production Inventory ---`)
  console.log(`Users: ${userCount}`)
  console.log(`Projects: ${projectCount}`)
  console.log(`Pages: ${pageCount}`)
  console.log(`Comments: ${commentCount}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
