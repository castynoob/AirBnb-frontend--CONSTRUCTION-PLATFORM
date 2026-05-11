// Contract API utilities
// Note: Payments between property managers and entrepreneurs are handled externally

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Get auth headers from localStorage
 */
function getAuthHeaders() {
  const userProfile = localStorage.getItem('userProfile');
  if (!userProfile) throw new Error('Not authenticated');
  const user = JSON.parse(userProfile);
  return {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Create a contract from an approved bid
 * @param {number} bidId - The bid ID to create contract from
 */
export async function createContract(bidId) {
  const response = await fetch(
    `${API_BASE_URL}/api/contracts/create`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bid_id: bidId })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to create contract');
  }

  return response.json();
}

/**
 * Get contract details
 * @param {number} contractId - The contract ID
 */
export async function getContract(contractId) {
  const response = await fetch(
    `${API_BASE_URL}/api/contracts/${contractId}`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get contract');
  }

  return response.json();
}

/**
 * Get contract by job ID
 * @param {number} jobId - The job ID
 */
export async function getContractByJob(jobId) {
  const response = await fetch(
    `${API_BASE_URL}/api/contracts/job/${jobId}`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get contract');
  }

  return response.json();
}

/**
 * Get all contracts for the current user
 */
export async function getContracts() {
  const response = await fetch(
    `${API_BASE_URL}/api/contracts`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get contracts');
  }

  return response.json();
}

/**
 * Mark work as complete (for entrepreneurs)
 * @param {number} contractId - The contract ID
 */
export async function markWorkComplete(contractId) {
  const response = await fetch(
    `${API_BASE_URL}/api/contracts/${contractId}/complete`,
    {
      method: 'POST',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to mark work complete');
  }

  return response.json();
}

/**
 * Approve completed work (for managers)
 * Note: Payment should be arranged externally between manager and contractor
 * @param {number} contractId - The contract ID to approve
 */
export async function approveWork(contractId) {
  const response = await fetch(
    `${API_BASE_URL}/api/contracts/${contractId}/approve`,
    {
      method: 'POST',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to approve work');
  }

  return response.json();
}

/**
 * Confirm job completion (for either party).
 * @param {string} contractId - The contract ID
 * @param {string} [note]     - Required when called by the property manager;
 *                              optional for the entrepreneur.
 */
export async function confirmCompletion(contractId, note) {
  const response = await fetch(
    `${API_BASE_URL}/api/contracts/${contractId}/confirm-completion`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ note: note || '' }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Failed to confirm completion');
  }

  return response.json();
}

/**
 * Cancel a bid approval (for managers)
 * @param {string} bidId - The bid ID to cancel approval for
 */
export async function cancelBidApproval(bidId) {
  const response = await fetch(
    `${API_BASE_URL}/api/bids/${bidId}/cancel-approval`,
    {
      method: 'PATCH',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to cancel bid approval');
  }

  return response.json();
}

/**
 * Get archived jobs for the current manager
 */
export async function getArchivedJobs() {
  const response = await fetch(
    `${API_BASE_URL}/api/jobs/archived`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch archived jobs');
  }

  return response.json();
}

/**
 * Archive a job (for managers)
 * @param {string} jobId - The job ID to archive
 * @param {boolean} archive - true to archive, false to restore
 */
export async function archiveJob(jobId, archive = true) {
  const response = await fetch(
    `${API_BASE_URL}/api/jobs/${jobId}/archive`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ archive })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to archive job');
  }

  return response.json();
}

/**
 * Update editable fields on a job (for managers)
 * @param {string} jobId
 * @param {Object} fields - Subset of allowed columns (title, description, category, urgency,
 *   due_date, estimated_duration_days, budget_min, budget_max, is_budget_hidden, is_emergency,
 *   location, severity, priority, deadline, bid_deadline)
 */
export async function updateJob(jobId, fields) {
  const response = await fetch(
    `${API_BASE_URL}/api/jobs/${jobId}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(fields),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Failed to update job');
  }

  return response.json();
}

/**
 * Delete a job (for managers)
 * @param {string} jobId - The job ID to delete
 */
export async function deleteJob(jobId) {
  const response = await fetch(
    `${API_BASE_URL}/api/jobs/${jobId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to delete job');
  }

  return response.json();
}
