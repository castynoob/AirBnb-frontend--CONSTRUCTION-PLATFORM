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
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }
  return response.json()
}

/**
 * Hook: Fetch entrepreneur profile
 */
export const useEntrepreneurProfile = () => {
  return useQuery({
    queryKey: ['entrepreneur', 'profile'],
    queryFn: async () => {
      const user = getUser()
      if (!user) throw new Error('Not authenticated')

      const entrepData = await authFetch(
        `${API_BASE_URL}/api/users/entrepreneur/profile`,
        user.token
      )

      return {
        userId: user.id,
        companyName: entrepData.profile.company_name,
        licenseNumber: entrepData.profile.license_number,
        yearsInBusiness: entrepData.profile.years_in_business,
        numEmployees: entrepData.profile.num_employees,
        address: entrepData.profile.address,
        phone: entrepData.profile.phone || 'Not provided',
        email: entrepData.profile.email,
        specializations: entrepData.profile.specializations,
        averageRating: entrepData.profile.average_rating,
        totalReviews: entrepData.profile.total_reviews || 0,
        image: entrepData.profile.image,
        // Public specialist directory opt-in. Without this, the Edit modal
        // reads `undefined` on reopen and the toggle silently flips back
        // to off — even though the DB has it stored correctly.
        showcaseEnabled: entrepData.profile.showcase_enabled ?? false,
        // About / website — free-form fields shown on the profile modal
        // Company tab and edited inline. Nullable on DB, defaulted here so
        // controlled inputs don't warn.
        bio: entrepData.profile.bio ?? '',
        website: entrepData.profile.website ?? '',
        // Portfolio for the inline uploader. Backend stores as jsonb but may
        // return as a string on some rows — normalise to an array.
        portfolio: (() => {
          const raw = entrepData.profile.portfolio
          if (Array.isArray(raw)) return raw
          if (typeof raw === 'string') {
            try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] } catch { return [] }
          }
          return []
        })(),
      }
    },
    enabled: !!getUser(),
  })
}

/**
 * Hook: Fetch reviews for entrepreneur
 */
export const useEntrepreneurReviews = () => {
  return useQuery({
    queryKey: ['entrepreneur', 'reviews'],
    queryFn: async () => {
      const user = getUser()
      if (!user) throw new Error('Not authenticated')

      const data = await authFetch(
        `${API_BASE_URL}/api/reviews/reviewed/${user.id}`,
        user.token
      )
      return data.reviews || []
    },
    enabled: !!getUser(),
  })
}

/**
 * Hook: Fetch subscription data
 * (Also shared by useEntrepreneurData.js — uses same query key)
 */
export const useEntrepreneurSubscription = () => {
  return useQuery({
    queryKey: ['entrepreneur', 'subscription'],
    queryFn: async () => {
      const user = getUser()
      if (!user) throw new Error('Not authenticated')

      const data = await authFetch(
        `${API_BASE_URL}/api/payments/subscription`,
        user.token
      )
      return data.subscription || {}
    },
    enabled: !!getUser(),
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Hook: Fetch queued promo code
 */
export const useQueuedPromo = () => {
  return useQuery({
    queryKey: ['entrepreneur', 'queuedPromo'],
    queryFn: async () => {
      const user = getUser()
      if (!user) throw new Error('Not authenticated')

      const data = await authFetch(
        `${API_BASE_URL}/api/payments/queued-promo`,
        user.token
      )
      return data.has_queued_promo ? data.queued_promo : null
    },
    enabled: !!getUser(),
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Hook: Fetch billing history (lazy — only when enabled)
 */
export const useBillingHistory = (enabled = false) => {
  return useQuery({
    queryKey: ['entrepreneur', 'billingHistory'],
    queryFn: async () => {
      const user = getUser()
      if (!user) throw new Error('Not authenticated')

      const data = await authFetch(
        `${API_BASE_URL}/api/payments/billing-history`,
        user.token
      )
      return {
        payments: data.payments || [],
        summary: data.summary || null,
      }
    },
    enabled: enabled && !!getUser(),
  })
}

/**
 * Helper: Invalidate entrepreneur profile-related queries
 */
export const useInvalidateEntrepreneurProfile = () => {
  const queryClient = useQueryClient()
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ['entrepreneur'] }),
    invalidateProfile: () => queryClient.invalidateQueries({ queryKey: ['entrepreneur', 'profile'] }),
    invalidateSubscription: () => queryClient.invalidateQueries({ queryKey: ['entrepreneur', 'subscription'] }),
    invalidateBilling: () => queryClient.invalidateQueries({ queryKey: ['entrepreneur', 'billingHistory'] }),
    invalidatePromo: () => queryClient.invalidateQueries({ queryKey: ['entrepreneur', 'queuedPromo'] }),
  }
}
