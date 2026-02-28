import { useQuery, useQueryClient } from '@tanstack/react-query'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * Get auth token from localStorage
 */
const getToken = () => {
  try {
    const profile = localStorage.getItem('userProfile')
    if (!profile) return null
    return JSON.parse(profile).token
  } catch {
    return null
  }
}

/**
 * Authenticated fetch helper
 */
const authFetch = async (url) => {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

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
 * Hook: Fetch all properties (entrepreneur view)
 */
export const useProperties = () => {
  return useQuery({
    queryKey: ['entrepreneur', 'properties'],
    queryFn: async () => {
      const data = await authFetch(`${API_BASE_URL}/api/properties/all`)
      return data.properties.map((d) => ({
        id: d.id,
        name: d.building_name && d.building_name.trim() ? d.building_name : d.address,
        latitude: Number(d.latitude),
        longitude: Number(d.longitude),
        address: d.address,
        region: d.province,
        city: d.city,
        totalUnits: d.num_units,
        propertyType: d.building_type,
        managerId: d.manager_id,
        managerUserId: d.manager_user_id,
        managerCompanyName: d.manager_company_name,
        managerFirstName: d.manager_first_name,
        managerLastName: d.manager_last_name,
        managerEmail: d.manager_email,
        managerImage: d.manager_image,
      }))
    },
    enabled: !!getToken(),
  })
}

/**
 * Hook: Fetch all jobs (entrepreneur view)
 */
export const useJobs = () => {
  return useQuery({
    queryKey: ['entrepreneur', 'jobs'],
    queryFn: async () => {
      const jobsData = await authFetch(`${API_BASE_URL}/api/jobs`)
      let jobsArray = []

      if (Array.isArray(jobsData)) {
        jobsArray = jobsData
      } else if (jobsData.jobs && Array.isArray(jobsData.jobs)) {
        jobsArray = jobsData.jobs
      } else if (typeof jobsData === 'object' && jobsData !== null) {
        jobsArray = Object.values(jobsData).filter(
          (item) => typeof item === 'object' && item !== null && item.id
        )
      }

      return jobsArray.map((job) => ({
        id: job.id,
        property_id: job.property_id,
        title: job.title,
        description: job.description,
        category: job.category,
        urgency: job.urgency,
        due_date: job.due_date,
        estimated_duration_days: job.estimated_duration_days,
        budget_min: (job.budget_min ?? 0).toString(),
        budget_max: (job.budget_max ?? 0).toString(),
        status: job.status,
        bidCount: 0,
        daysUntilNeeded: Math.ceil(
          (new Date(job.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
        budgetData: {
          unlocked: false,
          unlockDate: null,
          amountPaid: 0,
        },
      }))
    },
    enabled: !!getToken(),
  })
}

/**
 * Hook: Fetch entrepreneur's submitted bids
 */
export const useBids = () => {
  return useQuery({
    queryKey: ['entrepreneur', 'bids'],
    queryFn: async () => {
      const data = await authFetch(`${API_BASE_URL}/api/bids/mine`)
      return data.bids.all
    },
    enabled: !!getToken(),
  })
}

/**
 * Hook: Fetch entrepreneur subscription
 */
export const useSubscription = () => {
  return useQuery({
    queryKey: ['entrepreneur', 'subscription'],
    queryFn: async () => {
      const data = await authFetch(`${API_BASE_URL}/api/payments/subscription`)
      return data.subscription || null
    },
    enabled: !!getToken(),
    staleTime: 10 * 60 * 1000, // subscriptions change rarely
  })
}

/**
 * Helper: Invalidate all entrepreneur data (used after mutations like bid submit, budget unlock)
 */
export const useInvalidateEntrepreneurData = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['entrepreneur'] })
}
