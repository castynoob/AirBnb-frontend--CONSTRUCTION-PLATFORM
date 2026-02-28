import { useQuery, useQueryClient } from '@tanstack/react-query'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * Get auth user from localStorage
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
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
  return response.json()
}

// ============================================
// SUBMISSIONS (PM Biddings page)
// ============================================

/**
 * Hook: Fetch all submissions (jobs + bids + properties + reviews)
 * Replicates the complex N+1 fetch from Submissions.jsx
 */
export const useSubmissions = () => {
  return useQuery({
    queryKey: ['submissions', 'list'],
    queryFn: async () => {
      const user = getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Fetch manager's jobs
      const jobsData = await authFetch(
        `${API_BASE_URL}/api/jobs/manager/${user.id}`,
        user.token
      )
      const jobs = jobsData.jobs || []

      // 2. Enrich each job with bids, property, reviews
      const submissionsData = []

      for (const job of jobs) {
        try {
          // Fetch bids for this job
          const bidsData = await authFetch(
            `${API_BASE_URL}/api/bids/job/${job.id}`,
            user.token
          ).catch(() => ({ bids: [] }))

          const bids = bidsData.bids || []

          // Fetch property details
          let propertyAddress = 'Unknown Location'
          let propertyName = 'Unknown Property'
          if (job.property_id) {
            try {
              const propertyData = await authFetch(
                `${API_BASE_URL}/api/properties/${job.property_id}`,
                user.token
              )
              const property = propertyData.property
              propertyName = property.building_name || property.name || property.address || 'Unknown Property'
              propertyAddress = `${property.address}, ${property.city}, ${property.province}`
            } catch {
              // keep defaults
            }
          }

          // Process each bid (skip declined)
          for (const bid of bids) {
            if (bid.status === 'declined') continue

            // Fetch review if job is completed
            let reviewData = null
            if (job.status === 'completed') {
              try {
                const reviewJson = await authFetch(
                  `${API_BASE_URL}/api/reviews/job/${job.id}`,
                  user.token
                )
                reviewData = reviewJson.review && reviewJson.review.length > 0 ? reviewJson.review[0] : null
              } catch {
                // no review
              }
            }

            submissionsData.push({
              bid: {
                id: bid.id,
                job_id: bid.job_id,
                entrepreneur_id: bid.entrepreneur_id,
                amount: bid.amount,
                message: bid.message,
                status: bid.status,
                created_at: bid.created_at,
                updated_at: bid.updated_at,
              },
              job: {
                id: job.id,
                title: job.title,
                description: job.description,
                category: job.category,
                urgency: job.urgency,
                budget_min: job.budget_min,
                budget_max: job.budget_max,
                is_budget_hidden: job.is_budget_hidden,
                is_emergency: job.is_emergency,
                status: job.status,
                due_date: job.due_date,
                estimated_duration_days: job.estimated_duration_days,
                property_id: job.property_id,
                manager_id: job.manager_id,
                unit_id: job.unit_id,
                created_at: job.created_at,
                updated_at: job.updated_at,
              },
              entrepreneur_profile: {
                id: bid.entrepreneur_id,
                user_id: bid.user_id || bid.entrepreneur_user_id,
                entrepreneur_user_id: bid.entrepreneur_user_id,
                company_name: bid.company_name,
                license_number: bid.license_number,
                years_in_business: bid.years_in_business,
                specializations: bid.specializations || [],
                average_rating: bid.average_rating,
                total_reviews: bid.total_reviews,
              },
              user: {
                first_name: bid.first_name,
                last_name: bid.last_name,
                email: bid.email,
              },
              property_name: propertyName,
              property_address: propertyAddress,
              review: reviewData,
            })
          }
        } catch (err) {
          console.warn(`Error processing job ${job.id}:`, err)
        }
      }

      return submissionsData
    },
    enabled: !!getUser(),
    staleTime: 2 * 60 * 1000, // 2 minutes — submissions don't change super frequently
  })
}

// ============================================
// FAVORITES
// ============================================

/**
 * Hook: Fetch user's favorite bid IDs
 */
export const useFavorites = () => {
  return useQuery({
    queryKey: ['submissions', 'favorites'],
    queryFn: async () => {
      const user = getUser()
      if (!user) throw new Error('Not authenticated')

      const data = await authFetch(`${API_BASE_URL}/api/favorites`, user.token)
      // Extract bid IDs from favorites
      return (data.favorites || [])
        .filter(fav => fav.bid_id)
        .map(fav => fav.bid_id)
    },
    enabled: !!getUser(),
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================
// INVALIDATION HELPERS
// ============================================

export const useInvalidateSubmissions = () => {
  const queryClient = useQueryClient()
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ['submissions'] }),
    invalidateList: () => queryClient.invalidateQueries({ queryKey: ['submissions', 'list'] }),
    invalidateFavorites: () => queryClient.invalidateQueries({ queryKey: ['submissions', 'favorites'] }),
  }
}
