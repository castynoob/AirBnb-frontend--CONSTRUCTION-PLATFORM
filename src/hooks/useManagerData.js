import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

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

const PAGE_SIZE = 20

const PLACEHOLDER_IMAGE = '/defaultjobs.png'

// Shape a single raw row (from GET /api/jobs/manager/:id/dashboard) into the
// object the manager UI already knows how to render. Kept identical to the
// pre-refactor shape so RepairList / HomePage / SummarySection etc. don't
// need to change.
const shapeRow = (row) => {
  const bidCount = Number(row.bid_count || 0)
  const approvedForJob = Number(row.approved_bid_count || 0)
  return {
    id: row.id,
    property:
      row.property_name || row.property_address || 'Unknown Property',
    address: `${row.property_city || ''} ${row.property_province || ''}`.trim(),
    apartment: row.title,
    category: row.urgency,
    description: row.description,
    bids: bidCount,
    approvedBidsForJob: approvedForJob,
    hasApprovedBid: approvedForJob > 0,
    budget:
      row.budget_min != null && row.budget_max != null
        ? `$${row.budget_min} - $${row.budget_max}`
        : 'Budget to be defined',
    images: [row.job_image || PLACEHOLDER_IMAGE],
    data: {
      // preserve historical shape; typo `mangerId` kept intentionally to avoid
      // breaking any code paths that already read it.
      mangerId: row.manager_id,
      propertyId: row.property_id,
      jobId: row.id,
    },
    created_at: row.created_at,
    building_type: row.property_type,
    status: row.status,
    jobCategory: row.category,
  }
}

/**
 * Hook: paginated manager dashboard feed.
 *
 * Backed by GET /api/jobs/manager/:id/dashboard — a single enriched endpoint
 * that returns pre-joined property + bid counts + first image per job. Uses
 * useInfiniteQuery so the UI can render page 1 immediately and lazy-load more
 * on scroll / "Load more".
 *
 * Return shape is intentionally the same as the old useQuery version
 * (`data.properties`, `data.jobs`, `data.totalJobs`, etc.) so existing
 * consumers keep working. Additional fields expose pagination state.
 */
export const useManagerDashboard = () => {
  const query = useInfiniteQuery({
    queryKey: ['manager', 'dashboard'],
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    queryFn: async ({ pageParam }) => {
      const user = getUser()
      if (!user) throw new Error('Not authenticated')

      const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
      if (pageParam) params.set('cursor', pageParam)

      const data = await authFetch(
        `${API_BASE_URL}/api/jobs/manager/${user.id}/dashboard?${params}`,
        user.token
      )
      return {
        jobs: data.jobs || [],
        hasMore: !!data.hasMore,
        nextCursor: data.nextCursor || null,
      }
    },
    enabled: !!getUser(),
    staleTime: 2 * 60 * 1000, // 2 min client-side; backend caches 5 min
  })

  // Auto-continue: after the first page lands, keep pulling subsequent pages
  // in the background so callers get the full list without needing to add
  // "Load more" UI. The user sees page 1 (~20 jobs) almost instantly and
  // additional jobs stream in over the next second or two.
  useEffect(() => {
    if (query.hasNextPage && !query.isFetchingNextPage && !query.isLoading) {
      query.fetchNextPage()
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.isLoading, query.fetchNextPage])

  // Fold all fetched pages into one flat list + summary counts. Memoized so
  // downstream `useMemo` chains don't re-run on every render.
  const derived = useMemo(() => {
    const pages = query.data?.pages ?? []
    const rows = pages.flatMap((p) => p.jobs)
    const properties = rows.map(shapeRow)
    const uniquePropertyIds = new Set(
      rows.map((r) => r.property_id).filter((id) => id && id !== 'null')
    )
    const totalBidsApproved = properties.reduce(
      (sum, p) => sum + (p.approvedBidsForJob || 0),
      0
    )
    return {
      properties,
      jobs: rows,
      totalProperties: uniquePropertyIds.size,
      totalJobs: properties.length,
      totalBidsApproved,
    }
  }, [query.data])

  return {
    ...query,
    // Preserve the react-query `data` shape callers expect: `data.properties`
    // etc. so they don't need to change.
    data: derived,
  }
}

/**
 * Helper: Invalidate all manager data (used after mutations like add property, add job)
 */
export const useInvalidateManagerData = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['manager'] })
}

/**
 * Helper: Optimistically prepend a newly-created job to the dashboard cache.
 *
 * The dashboard enrichment fan-out takes ~15s for managers with many jobs.
 * Rather than making the user wait for that refetch, we synthesize a stand-in
 * "property card" from the create-job response + the property they picked in
 * the form and shove it straight into the cache. React-Query returns this
 * cached view immediately when the dashboard mounts, so the new job appears
 * right away — then the background refetch (triggered by invalidate) replaces
 * the stand-in with the fully-enriched record once it arrives.
 *
 * Pass `newJob` (the API response.job) and the matching `property` object
 * (from the form's own property list). Images can be a File[]/URL[] pair —
 * we use object URLs for immediate preview if files are provided.
 */
export const useOptimisticallyAddJob = () => {
  const queryClient = useQueryClient()
  return ({ job, property, imageFiles }) => {
    if (!job) return
    const placeholderImage = '/defaultjobs.png'
    const previewImages = (imageFiles && imageFiles.length > 0)
      ? imageFiles.map((entry) => {
          // Accept either `File` objects or `{ file: File }` wrappers.
          const file = entry?.file ?? entry
          try {
            return file instanceof File ? URL.createObjectURL(file) : placeholderImage
          } catch {
            return placeholderImage
          }
        })
      : [placeholderImage]

    // Now that the dashboard is a useInfiniteQuery, the cached shape is
    // `{ pages: [{ jobs: [rawRow, ...], hasMore, nextCursor }], pageParams }`.
    // Prepend the optimistic raw row to page 1 so shapeRow() picks it up on
    // the next selector run.
    const optimisticRow = {
      id: job.id,
      title: job.title,
      description: job.description,
      category: job.category,
      urgency: job.urgency,
      status: job.status || 'Open',
      budget_min: job.budget_min ?? null,
      budget_max: job.budget_max ?? null,
      due_date: job.due_date ?? null,
      property_id: property?.id ?? job.property_id ?? null,
      manager_id: property?.manager_id ?? null,
      created_at: job.created_at || new Date().toISOString(),
      updated_at: job.updated_at || new Date().toISOString(),
      // Property fields (joined columns the endpoint returns)
      property_name: property?.building_name || null,
      property_address: property?.address || null,
      property_city: property?.city || null,
      property_province: property?.province || null,
      property_type: property?.building_type || null,
      property_units: property?.num_units || null,
      // Bid + image
      bid_count: 0,
      approved_bid_count: 0,
      job_image: previewImages[0] || null,
      __optimistic: true,
    }

    queryClient.setQueryData(['manager', 'dashboard'], (old) => {
      if (!old || !Array.isArray(old.pages) || old.pages.length === 0) return old
      const [firstPage, ...rest] = old.pages
      return {
        ...old,
        pages: [
          { ...firstPage, jobs: [optimisticRow, ...(firstPage.jobs || [])] },
          ...rest,
        ],
      }
    })
  }
}
