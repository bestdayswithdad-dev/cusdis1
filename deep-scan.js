const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const commentCount = await prisma.comment.count()
    const userCount = await prisma.user.count()
    const projectCount = await prisma.project.count()
    const pageCount = await prisma.page.count()

    console.log(`\n--- Production Inventory ---`)
    console.log(`Users:    ${userCount}`)
    console.log(`Projects: ${projectCount}`)
    console.log(`Pages:    ${pageCount}`)
    console.log(`Comments: ${commentCount}\n`)
  } catch (err) {
    console.error("Scan failed. Error:", err.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
