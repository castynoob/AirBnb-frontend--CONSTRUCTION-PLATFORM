import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getConversations } from '../utils/api'

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
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
  return response.json()
}

// ============================================
// SHARED: Conversations (PM, Entrepreneur)
// ============================================

/**
 * Hook: Fetch conversations via unified API
 * Used by Property Manager and Entrepreneur messages pages.
 * Short staleTime (30s) because conversations update frequently.
 */
export const useConversations = () => {
  return useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: async () => {
      const response = await getConversations()
      if (response.success) {
        return response.conversations || []
      }
      return []
    },
    enabled: !!getToken(),
    staleTime: 30 * 1000, // 30 seconds — conversations change often
  })
}

// ============================================
// PM-SPECIFIC: Group Chats
// ============================================

/**
 * Hook: Fetch group chats for property managers
 */
export const useGroupChats = () => {
  return useQuery({
    queryKey: ['messages', 'groupChats'],
    queryFn: async () => {
      const data = await authFetch(`${API_BASE_URL}/api/residents/group-chats`)
      if (data.success) {
        return data.group_chats || []
      }
      return []
    },
    enabled: !!getToken(),
    staleTime: 30 * 1000,
  })
}

// ============================================
// RESIDENT-SPECIFIC
// ============================================

/**
 * Hook: Fetch resident group chats
 */
export const useResidentGroupChats = () => {
  return useQuery({
    queryKey: ['messages', 'residentGroupChats'],
    queryFn: async () => {
      const data = await authFetch(`${API_BASE_URL}/api/residents/group-chats`)
      if (data.success) {
        return data.group_chats || data.groupChats || []
      }
      return []
    },
    enabled: !!getToken(),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook: Fetch resident direct messages
 */
export const useResidentDirectMessages = () => {
  return useQuery({
    queryKey: ['messages', 'residentDirectMessages'],
    queryFn: async () => {
      const data = await authFetch(`${API_BASE_URL}/api/residents/direct-messages`)
      if (data.success) {
        return data.conversations || []
      }
      return []
    },
    enabled: !!getToken(),
    staleTime: 30 * 1000,
  })
}

// ============================================
// SUPPLIER-SPECIFIC
// ============================================

/**
 * Hook: Fetch supplier conversations (filtered to entrepreneur role)
 */
export const useSupplierConversations = () => {
  return useQuery({
    queryKey: ['messages', 'supplierConversations'],
    queryFn: async () => {
      const data = await authFetch(`${API_BASE_URL}/api/conversations`)
      if (data.success) {
        return (data.conversations || []).filter(
          (conv) => conv.other_user_role === 'entrepreneur'
        )
      }
      return []
    },
    enabled: !!getToken(),
    staleTime: 30 * 1000,
  })
}

// ============================================
// INVALIDATION HELPERS
// ============================================

/**
 * Helper: Invalidate message-related queries
 */
export const useInvalidateMessages = () => {
  const queryClient = useQueryClient()
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
    invalidateConversations: () => queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] }),
    invalidateGroupChats: () => queryClient.invalidateQueries({ queryKey: ['messages', 'groupChats'] }),
    invalidateResidentGroups: () => queryClient.invalidateQueries({ queryKey: ['messages', 'residentGroupChats'] }),
    invalidateResidentDMs: () => queryClient.invalidateQueries({ queryKey: ['messages', 'residentDirectMessages'] }),
    invalidateSupplier: () => queryClient.invalidateQueries({ queryKey: ['messages', 'supplierConversations'] }),
  }
}
