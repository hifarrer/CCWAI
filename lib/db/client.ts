import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClient = globalForPrisma.prisma ?? new PrismaClient()

// Add middleware to assign Free plan to new users
prismaClient.$use(async (params, next) => {
  // If creating a new user and planId is not set, assign Free plan
  if (params.model === 'User' && params.action === 'create') {
    if (!params.args.data.planId) {
      // Find the Free plan
      const freePlan = await prismaClient.subscriptionPlan.findFirst({
        where: { name: 'Free' },
      })
      if (freePlan) {
        params.args.data.planId = freePlan.id
      }
    }
  }
  return next(params)
})

export const prisma = prismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma




