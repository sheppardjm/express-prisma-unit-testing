import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const main = async () => {
	// to-do
}

main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async e => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
