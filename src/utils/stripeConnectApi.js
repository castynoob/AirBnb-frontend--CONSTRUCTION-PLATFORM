// ============================================
// STRIPE CONNECT API - Entrepreneur Onboarding
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Get authentication token from localStorage
 */
function getToken() {
  const userProfile = localStorage.getItem('userProfile');
  if (!userProfile) return null;
  const user = JSON.parse(userProfile);
  return user.token;
}

/**
 * Create Stripe Connect account for entrepreneur
 * POST /api/contracts/connect/create-account
 */
export async function createConnectAccount() {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/api/contracts/connect/create-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to create Stripe account');
  }

  return data;
}

/**
 * Get Stripe Connect onboarding link
 * POST /api/contracts/connect/onboarding-link
 */
export async function getOnboardingLink(returnUrl = null, refreshUrl = null) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/api/contracts/connect/onboarding-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      return_url: returnUrl,
      refresh_url: refreshUrl
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to get onboarding link');
  }

  return data;
}

/**
 * Get Stripe Connect account status
 * GET /api/contracts/connect/status
 */
export async function getConnectStatus() {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/api/contracts/connect/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to get account status');
  }

  return data;
}

/**
 * Get Stripe Express dashboard link
 * POST /api/contracts/connect/dashboard-link
 */
export async function getDashboardLink() {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/api/contracts/connect/dashboard-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to get dashboard link');
  }

  return data;
}

/**
 * Full onboarding flow - creates account if needed, then returns onboarding link
 */
export async function startOnboarding() {
  // First check current status
  const status = await getConnectStatus();

  // If already onboarded, return success
  if (status.onboarding_complete) {
    return {
      success: true,
      already_complete: true,
      status
    };
  }

  // Create account if doesn't exist
  if (!status.has_account) {
    await createConnectAccount();
  }

  // Get onboarding link
  const linkData = await getOnboardingLink();

  return {
    success: true,
    already_complete: false,
    url: linkData.url,
    expires_at: linkData.expires_at
  };
}

export default {
  createConnectAccount,
  getOnboardingLink,
  getConnectStatus,
  getDashboardLink,
  startOnboarding
};
