import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding subscription plans...')

  // Check if plans already exist
  const existingPlans = await prisma.subscriptionPlan.findMany()
  if (existingPlans.length > 0) {
    console.log('Plans already exist, skipping seed...')
    return
  }

  // Create Free Plan
  const freePlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Free',
      features: [
        'My overview',
        'Daily Check-in',
        'Clinical Trials Near me',
      ],
      monthlyPrice: 0,
      yearlyPrice: 0,
      monthlyStripePriceId: null,
      yearlyStripePriceId: null,
    },
  })
  console.log('Created Free plan:', freePlan.id)

  // Create Premium Plan
  const premiumPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Premium',
      features: [
        'Access to all widgets',
        'My overview',
        'Daily Check-in',
        'Clinical Trials Near me',
        'Latest News',
        'Research Articles',
        'FDA Approvals',
        'AI Research Assistant',
        'Ask The AI',
        'NCBI Query',
        'New Hope Finder',
        'Emotional Support',
        'Overall Wellness',
        'Symptoms Chart',
        'Articles By Cancer Type',
        'Cancer Type Overview',
        'Alerts',
      ],
      monthlyPrice: 15,
      yearlyPrice: 120,
      monthlyStripePriceId: null,
      yearlyStripePriceId: null,
    },
  })
  console.log('Created Premium plan:', premiumPlan.id)

  // Update all existing users to have the Free plan
  const updatedUsers = await prisma.user.updateMany({
    where: {
      planId: null,
    },
    data: {
      planId: freePlan.id,
    },
  })
  console.log(`Updated ${updatedUsers.count} users to Free plan`)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

