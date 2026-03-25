import { useMemo } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'

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
// Uses single optimized endpoint with cursor pagination
// ============================================

const PAGE_SIZE = 50

/**
 * Hook: Fetch all submissions via single optimized endpoint
 * Replaces the old N+1 fetch pattern (40+ API calls → 1 API call)
 */
export const useSubmissions = (statusFilter = 'all') => {
  const query = useInfiniteQuery({
    queryKey: ['submissions', 'list', statusFilter],
    queryFn: async ({ pageParam }) => {
      const user = getUser()
      if (!user) throw new Error('Not authenticated')

      const params = new URLSearchParams({ limit: PAGE_SIZE })
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (pageParam) params.set('cursor', pageParam)

      const data = await authFetch(
        `${API_BASE_URL}/api/bids/manager/submissions?${params}`,
        user.token
      )
      return data
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.pagination?.nextCursor ?? undefined,
    enabled: !!getUser(),
    staleTime: 2 * 60 * 1000,
  })

  // Memoize flattened results to prevent infinite re-render loops
  const allSubmissions = useMemo(
    () => query.data?.pages?.flatMap(page => page.submissions) ?? [],
    [query.data]
  )
  const counts = useMemo(
    () => query.data?.pages?.[0]?.counts ?? {},
    [query.data]
  )

  return {
    data: allSubmissions,
    counts,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
    refetch: query.refetch,
  }
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
