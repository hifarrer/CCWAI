import { prisma } from '@/lib/db/client'
import { Prisma } from '@prisma/client'

/**
 * Utility function to extract drug name from OpenFDA label metadata
 */
function extractDrugNameFromMetadata(metadata: any): string | null {
  if (!metadata) return null

  // Try brand_name (array)
  if (metadata.brand_name && Array.isArray(metadata.brand_name) && metadata.brand_name.length > 0) {
    return metadata.brand_name[0]
  }
  // Try brand_name (string)
  if (metadata.brand_name && typeof metadata.brand_name === 'string') {
    return metadata.brand_name
  }
  // Try openfda.brand_name
  if (metadata.openfda?.brand_name && Array.isArray(metadata.openfda.brand_name) && metadata.openfda.brand_name.length > 0) {
    return metadata.openfda.brand_name[0]
  }
  // Try generic_name as fallback
  if (metadata.generic_name && Array.isArray(metadata.generic_name) && metadata.generic_name.length > 0) {
    return metadata.generic_name[0]
  }
  // Try generic_name as string
  if (metadata.generic_name && typeof metadata.generic_name === 'string') {
    return metadata.generic_name
  }
  // Try openfda.generic_name
  if (metadata.openfda?.generic_name && Array.isArray(metadata.openfda.generic_name) && metadata.openfda.generic_name.length > 0) {
    return metadata.openfda.generic_name[0]
  }
  
  return null
}

/**
 * Removes FDA application type prefixes from application number for URL
 */
function cleanApplicationNumberForUrl(applicationNumber: string | null): string | null {
  if (!applicationNumber) return null
  // Remove common FDA application type prefixes (BLA, NDA, ANDA, etc.)
  return applicationNumber.replace(/^(BLA|NDA|ANDA|BL|ND)\s*/i, '')
}

/**
 * Fixes existing FDA approval records that have "Unknown Drug" by extracting from metadata
 * Also fixes URLs that have application type prefixes
 */
export async function fixFdaDrugNames() {
  console.log('Starting to fix FDA drug names from metadata...')
  
  const approvalsWithUnknownDrug = await prisma.fdaApproval.findMany({
    where: {
      drugName: 'Unknown Drug',
      metadata: {
        not: Prisma.JsonNull,
      },
    },
  })

  console.log(`Found ${approvalsWithUnknownDrug.length} approvals with "Unknown Drug"`)

  let fixed = 0
  let failed = 0

  for (const approval of approvalsWithUnknownDrug) {
    try {
      const drugName = extractDrugNameFromMetadata(approval.metadata)
      
      if (drugName && drugName !== 'Unknown Drug') {
        await prisma.fdaApproval.update({
          where: { id: approval.id },
          data: { drugName },
        })
        console.log(`Fixed approval ${approval.applicationNumber || approval.id}: ${drugName}`)
        fixed++
      } else {
        console.warn(`Could not extract drug name for approval ${approval.applicationNumber || approval.id}`)
        failed++
      }
    } catch (error) {
      console.error(`Error fixing approval ${approval.id}:`, error)
      failed++
    }
  }

  console.log(`Fixed ${fixed} approvals, ${failed} could not be fixed`)
  
  // Also fix URLs with application type prefixes
  console.log('Fixing URLs with application type prefixes...')
  const allApprovals = await prisma.fdaApproval.findMany({
    where: {
      AND: [
        { url: { not: null } },
        { applicationNumber: { not: null } },
      ],
    },
  })

  let urlsFixed = 0
  for (const approval of allApprovals) {
    if (approval.url && approval.applicationNumber) {
      const cleanAppNumber = cleanApplicationNumberForUrl(approval.applicationNumber)
      if (cleanAppNumber && cleanAppNumber !== approval.applicationNumber) {
        const newUrl = `https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=${cleanAppNumber}`
        if (newUrl !== approval.url) {
          await prisma.fdaApproval.update({
            where: { id: approval.id },
            data: { url: newUrl },
          })
          urlsFixed++
        }
      }
    }
  }

  console.log(`Fixed ${urlsFixed} URLs`)
  
  return { fixed, failed, urlsFixed }
}

