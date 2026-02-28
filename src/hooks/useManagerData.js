import { useQuery, useQueryClient } from '@tanstack/react-query'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * Get auth token + user ID from localStorage
 */
const getUser = () => {
  try {
    const profile = localStorage.getItem('userProfile')
    if (!profile) return null
    return JSON.parse(profile)
  } catch {
    return null
  }
}

/**
 * Authenticated fetch helper
 */
const authFetch = async (url, token) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }
  return response.json()
}

/**
 * Hook: Fetch the full manager dashboard data
 * - Jobs for this manager
 * - For each job: property details, bid count, images
 * - Summary stats (total properties, total jobs, approved bids)
 */
export const useManagerDashboard = () => {
  return useQuery({
    queryKey: ['manager', 'dashboard'],
    queryFn: async () => {
      const user = getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Fetch manager's jobs
      const jobsData = await authFetch(
        `${API_BASE_URL}/api/jobs/manager/${user.id}`,
        user.token
      )
      const rawJobs = jobsData.jobs || []

      // 2. Enrich each job with property details, bids, and images (in parallel)
      const enrichedProperties = await Promise.all(
        rawJobs.map(async (job) => {
          try {
            if (!job.property_id || job.property_id === 'null' || job.property_id === 'undefined') {
              return null
            }

            // Fetch property, bids, and images in parallel for this job
            const [propertyData, bidsResult, imagesResult] = await Promise.allSettled([
              authFetch(`${API_BASE_URL}/api/properties/${job.property_id}`, user.token),
              authFetch(`${API_BASE_URL}/api/bids/job/${job.id}`, user.token),
              authFetch(`${API_BASE_URL}/api/jobs/${job.id}/images`, user.token),
            ])

            const property = propertyData.status === 'fulfilled'
              ? propertyData.value.property
              : {}

            let bidCount = 0
            let hasApprovedBid = false
            if (bidsResult.status === 'fulfilled') {
              bidCount = bidsResult.value.total_bids || 0
              const bids = bidsResult.value.bids || []
              hasApprovedBid = bids.some(
                (b) =>
                  b.status?.toLowerCase() === 'approved' ||
                  b.status?.toLowerCase() === 'accepted'
              )
            }

            const placeholderImage = '/defaultjobs.png'
            let jobImages = []
            if (imagesResult.status === 'fulfilled') {
              const imgs = imagesResult.value.images || []
              if (imgs.length > 0) jobImages = imgs.map((img) => img.image_url)
            }
            const finalImages = jobImages.length > 0 ? jobImages : [placeholderImage]

            return {
              id: job.id,
              property: property.building_name || property.address || 'Unknown Property',
              address: `${property.city || ''} ${property.province || ''}`,
              apartment: job.title,
              category: job.urgency,
              description: job.description,
              bids: bidCount,
              hasApprovedBid,
              budget: `$${job.budget_min} - $${job.budget_max}`,
              images: finalImages,
              data: {
                mangerId: property.manager_id,
                propertyId: property.id,
                jobId: job.id,
              },
              created_at: job.created_at,
              building_type: property.building_type,
              status: job.status,
            }
          } catch {
            return null
          }
        })
      )

      const validProperties = enrichedProperties.filter((p) => p !== null)

      // 3. Fetch total properties count
      let totalProperties = 0
      try {
        const propsData = await authFetch(`${API_BASE_URL}/api/properties/`, user.token)
        const uniqueIds = new Set((propsData.properties || []).map((p) => p.id))
        totalProperties = uniqueIds.size
      } catch {
        // Fallback: count from jobs
        const uniqueIds = new Set(
          rawJobs
            .filter((j) => j.property_id && j.property_id !== 'null' && j.property_id !== 'undefined')
            .map((j) => j.property_id)
        )
        totalProperties = uniqueIds.size
      }

      // 4. Count approved bids across all jobs
      let totalBidsApproved = 0
      try {
        const bidCounts = await Promise.all(
          rawJobs.map(async (job) => {
            try {
              const bidsData = await authFetch(
                `${API_BASE_URL}/api/bids/job/${job.id}`,
                user.token
              )
              const bids = bidsData.bids || []
              return bids.filter(
                (b) =>
                  b.status?.toLowerCase() === 'approved' ||
                  b.status?.toLowerCase() === 'accepted'
              ).length
            } catch {
              return 0
            }
          })
        )
        totalBidsApproved = bidCounts.reduce((sum, c) => sum + c, 0)
      } catch {
        // ignore
      }

      return {
        properties: validProperties,
        jobs: rawJobs,
        totalProperties,
        totalJobs: rawJobs.length,
        totalBidsApproved,
      }
    },
    enabled: !!getUser(),
  })
}

/**
 * Helper: Invalidate all manager data (used after mutations like add property, add job)
 */
export const useInvalidateManagerData = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['manager'] })
}
