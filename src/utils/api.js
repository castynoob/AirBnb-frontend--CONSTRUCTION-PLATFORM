// ============================================
// UPDATED api.js - With Bid Approval Integration & Token Refresh
// Matches your documented API endpoints exactly
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================
// TOKEN REFRESH HELPER
// ============================================
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    // Refresh token expired or invalid - logout user
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    window.location.href = '/';
    throw new Error('Session expired - Please login again');
  }

  const data = await response.json();
  const newAccessToken = data.accessToken;

  // Update token in localStorage
  localStorage.setItem('token', newAccessToken);

  // Update token in userProfile
  const userProfile = localStorage.getItem('userProfile');
  if (userProfile) {
    const user = JSON.parse(userProfile);
    user.token = newAccessToken;
    localStorage.setItem('userProfile', JSON.stringify(user));
  }

  return newAccessToken;
}

// ============================================
// API REQUEST HELPER
// ============================================
async function apiRequest(endpoint, options = {}) {
  const userProfile = localStorage.getItem('userProfile')

  if(!userProfile) {
    throw new Error(`Error userProfile does not exist`)
  }
  const user = JSON.parse(userProfile)
  let token = user.token;

  if (!token) {
    throw new Error('No token provided');
  }

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Handle 401 Unauthorized - Try to refresh token
  if (response.status === 401) {
    // Check if we're already refreshing
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);

        // Retry original request with new token
        config.headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!retryResponse.ok) {
          const data = await retryResponse.json();
          throw new Error(data.message || 'Request failed');
        }

        return retryResponse.json();

      } catch (error) {
        isRefreshing = false;
        refreshSubscribers = [];
        throw error;
      }
    } else {
      // Wait for the token refresh to complete
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          config.headers['Authorization'] = `Bearer ${newToken}`;
          fetch(`${API_BASE_URL}${endpoint}`, config)
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(resolve)
            .catch(reject);
        });
      });
    }
  }

  // Handle 403 Forbidden (Bid approval required)
  if (response.status === 403) {
    const data = await response.json();
    throw new Error(data.message || 'You are not authorized to perform this action');
  }

  // Handle other errors
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Request failed');
  }

  return response.json();
}

// ============================================
// CONVERSATION ENDPOINTS
// ============================================

/**
 * Get all conversations for the authenticated user
 * GET /api/conversations
 */
export async function getConversations() {
  return apiRequest('/api/conversations');
}

/**
 * Start a new conversation or get existing one
 * POST /api/conversations
 */
export async function startConversation(otherUserId, jobId = null) {
  return apiRequest('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ otherUserId, jobId }),
  });
}

/**
 * Get messages in a conversation (with pagination)
 * GET /api/conversations/:conversationId/messages
 */
export async function getMessages(conversationId, limit = 50, offset = 0) {
  return apiRequest(
    `/api/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`
  );
}

/**
 * Mark all messages in a conversation as read
 * PUT /api/conversations/:conversationId/read
 */
export async function markConversationAsRead(conversationId) {
  return apiRequest(`/api/conversations/${conversationId}/read`, {
    method: 'PUT',
  });
}

// ============================================
// MESSAGE ENDPOINTS
// ============================================

/**
 * Send a message (HTTP fallback)
 * POST /api/messages
 * Note: Prefer Socket.io for real-time messaging
 */
export async function sendMessage(receiverId, content, jobId = null) {
  return apiRequest('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ receiverId, content, jobId }),
  });
}

/**
 * Delete a message (only sender can delete)
 * DELETE /api/messages/:messageId
 */
export async function deleteMessage(messageId) {
  return apiRequest(`/api/messages/${messageId}`, {
    method: 'DELETE',
  });
}

/**
 * Get total unread message count
 * GET /api/unread-count
 */
export async function getUnreadCount() {
  return apiRequest('/api/unread-count');
}

// ============================================
// ACCESS CONTROL (BID APPROVAL)
// ============================================

/**
 * Check if current user can message another user
 * GET /api/can-message/:otherUserId
 *
 * CRITICAL: This checks bid approval for entrepreneurs
 * Returns: { canMessage: boolean, message: string }
 */
export async function canMessageUser(otherUserId) {
  try {
    const data = await apiRequest(`/api/can-message/${otherUserId}`);
    return {
      canMessage: data.canMessage,
      message: data.message,
      success: true
    };
  } catch (error) {
    return {
      canMessage: false,
      message: error.message || 'Unable to check messaging access',
      success: false
    };
  }
}

/**
 * Check if user can start a conversation before showing contact button
 * Use this before displaying "Contact" or "Message" buttons
 */
export async function checkMessagingAccess(otherUserId) {
  const result = await canMessageUser(otherUserId);
  return result.canMessage;
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Check if entrepreneur can message manager
const { canMessage, message } = await canMessageUser(managerId);

if (canMessage) {
  // Show "Contact" button
  <button onClick={startConversation}>Contact Manager</button>
} else {
  // Show locked state or hide button
  <div className="locked-message">{message}</div>
}

// Example 2: Before starting conversation
async function handleContactClick(managerId) {
  const hasAccess = await checkMessagingAccess(managerId);
  
  if (!hasAccess) {
    alert('You need an approved bid to message this property manager');
    return;
  }
  
  // Proceed to start conversation
  const { conversation } = await startConversation(managerId, jobId);
  navigateToChat(conversation.id);
}

// Example 3: Load conversations
const { conversations } = await getConversations();
conversations.forEach(conv => {
  console.log(conv.other_user_name, conv.unread_count);
});

// Example 4: Send message (HTTP fallback)
const { message } = await sendMessage(
  receiverId,
  'Hello! Can we discuss the project?',
  jobId
);

// Example 5: Mark as read
await markConversationAsRead(conversationId);

// Example 6: Get unread count for badge
const { unreadCount } = await getUnreadCount();
setBadgeCount(unreadCount);
*/

export default {
  getConversations,
  startConversation,
  getMessages,
  markConversationAsRead,
  sendMessage,
  deleteMessage,
  getUnreadCount,
  canMessageUser,
  checkMessagingAccess,
};