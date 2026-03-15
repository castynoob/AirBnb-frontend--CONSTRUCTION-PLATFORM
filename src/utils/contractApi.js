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
 * Confirm job completion (for either party)
 * @param {string} contractId - The contract ID
 */
export async function confirmCompletion(contractId) {
  const response = await fetch(
    `${API_BASE_URL}/api/contracts/${contractId}/confirm-completion`,
    {
      method: 'POST',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to confirm completion');
  }

  return response.json();
}
