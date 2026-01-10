// Contract API utilities for Stripe Connect payments

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
 * Check if entrepreneur has completed Stripe onboarding
 * @param {number} entrepreneurProfileId - The entrepreneur's profile ID
 */
export async function checkEntrepreneurStripeStatus(entrepreneurProfileId) {
  const response = await fetch(
    `${API_BASE_URL}/api/contracts/connect/entrepreneur-status/${entrepreneurProfileId}`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to check entrepreneur status');
  }

  return response.json();
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
 * Create a payment intent for a contract
 * @param {number} contractId - The contract ID to pay for
 */
export async function createPaymentIntent(contractId) {
  const response = await fetch(
    `${API_BASE_URL}/api/contracts/${contractId}/pay`,
    {
      method: 'POST',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to create payment');
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
 * Approve and pay for a bid (combined flow)
 * This handles the full flow: approve bid -> create contract -> initiate payment
 * @param {number} bidId - The bid ID to approve and pay
 */
export async function approveAndInitiatePayment(bidId) {
  // Step 1: Approve the bid first
  const approveResponse = await fetch(
    `${API_BASE_URL}/api/bids/${bidId}/approve`,
    {
      method: 'PATCH',
      headers: getAuthHeaders()
    }
  );

  if (!approveResponse.ok) {
    const error = await approveResponse.json();
    throw new Error(error.message || 'Failed to approve bid');
  }

  const approveData = await approveResponse.json();

  // Step 2: Create contract
  const contractData = await createContract(bidId);

  // Step 3: Create payment intent
  const paymentData = await createPaymentIntent(contractData.contract.id);

  return {
    bid: approveData.bid,
    contract: contractData.contract,
    payment: paymentData
  };
}

/**
 * Confirm payment after successful Stripe payment (backup for webhook)
 * @param {string} contractId - The contract ID
 * @param {string} paymentIntentId - Optional payment intent ID
 */
export async function confirmPayment(contractId, paymentIntentId = null) {
  const response = await fetch(
    `${API_BASE_URL}/api/contracts/${contractId}/confirm-payment`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ payment_intent_id: paymentIntentId })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to confirm payment');
  }

  return response.json();
}

/**
 * Approve completed work and release funds to entrepreneur
 * @param {number} contractId - The contract ID to approve
 */
export async function approveWorkAndReleaseFunds(contractId) {
  const response = await fetch(
    `${API_BASE_URL}/api/contracts/${contractId}/approve`,
    {
      method: 'POST',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to release funds');
  }

  return response.json();
}
