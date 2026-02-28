import { useQuery, useQueryClient } from '@tanstack/react-query'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

/**
 * Get auth token from localStorage
 */
const getToken = () => {
  try {
    const profile = localStorage.getItem('userProfile')
    if (!profile) return localStorage.getItem('token')
    return JSON.parse(profile).token || localStorage.getItem('token')
  } catch {
    return localStorage.getItem('token')
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
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
  return response.json()
}

// ============================================
// RESIDENT PROFILE (shared: homepage + profile page)
// ============================================

/**
 * Hook: Fetch resident profile
 * Used by HomePageResident (for propertyId) and ProfilePageResident (for display/edit)
 */
export const useResidentProfile = () => {
  return useQuery({
    queryKey: ['resident', 'profile'],
    queryFn: async () => {
      const data = await authFetch(`${API_BASE_URL}/api/residents/profile`)
      if (data.success) {
        return data.profile
      }
      return null
    },
    enabled: !!getToken(),
  })
}

// ============================================
// ANNOUNCEMENTS (homepage)
// ============================================

/**
 * Hook: Fetch announcements for a property
 * Query key includes filter + search so each combo is cached separately.
 */
export const useResidentAnnouncements = (propertyId, filter = 'All', search = '') => {
  return useQuery({
    queryKey: ['resident', 'announcements', { propertyId, filter, search }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter !== 'All') params.append('type', filter)
      if (search) params.append('search', search)
      params.append('limit', '50')
      params.append('offset', '0')

      const data = await authFetch(
        `${API_BASE_URL}/api/residents/announcements?${params.toString()}`
      )
      if (data.success) {
        return data.announcements || []
      }
      return []
    },
    enabled: !!getToken() && !!propertyId,
    staleTime: 60 * 1000, // 1 minute — announcements change moderately
  })
}

// ============================================
// DIRECTORY (members page)
// ============================================

/**
 * Hook: Fetch resident directory
 */
export const useResidentDirectory = () => {
  return useQuery({
    queryKey: ['resident', 'directory'],
    queryFn: async () => {
      const data = await authFetch(`${API_BASE_URL}/api/residents/directory`)
      if (data.success) {
        return data.residents || []
      }
      return []
    },
    enabled: !!getToken(),
  })
}

// ============================================
// INVALIDATION HELPERS
// ============================================

/**
 * Helper: Invalidate resident-related queries
 */
export const useInvalidateResidentData = () => {
  const queryClient = useQueryClient()
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ['resident'] }),
    invalidateProfile: () => queryClient.invalidateQueries({ queryKey: ['resident', 'profile'] }),
    invalidateAnnouncements: () => queryClient.invalidateQueries({ queryKey: ['resident', 'announcements'] }),
    invalidateDirectory: () => queryClient.invalidateQueries({ queryKey: ['resident', 'directory'] }),
  }
}
