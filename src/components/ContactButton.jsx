// ============================================
// ContactButton.jsx - Smart Contact Button with Bid Approval
// Use this on job listings, bid details, or anywhere users can start conversations
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canMessageUser, startConversation } from '../../utils/api';

function ContactButton({ 
  otherUserId, 
  otherUserName, 
  otherUserRole,
  jobId = null,
  bidStatus = null, // 'pending', 'approved', 'declined'
  className = '',
  variant = 'primary' // 'primary', 'secondary', 'icon'
}) {
  const navigate = useNavigate();
  const [canMessage, setCanMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const currentUserId = localStorage.getItem('userId');
  const currentUserRole = localStorage.getItem('userRole');

  // ============================================
  // CHECK MESSAGING ACCESS ON MOUNTS
  // ============================================
  useEffect(() => {
    checkAccess();
  }, [otherUserId, bidStatus]);

  const checkAccess = async () => {
    if (!otherUserId || otherUserId === currentUserId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await canMessageUser(otherUserId);
      
      setCanMessage(result.canMessage);
      setErrorMessage(result.message);
    } catch (error) {
      console.error('Error checking messaging access:', error);
      setCanMessage(false);
      setErrorMessage('Unable to check messaging access');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // HANDLE CONTACT CLICK
  // ============================================
  const handleContactClick = async () => {
    // Double-check access
    if (!canMessage) {
      showAccessDeniedMessage();
      return;
    }

    try {
      // Start or get existing conversation
      const data = await startConversation(otherUserId, jobId);
      
      if (data.success) {
        // Navigate to messages page with this conversation
        const conversationId = data.conversation.id;
        
        if (currentUserRole === 'entrepreneur') {
          navigate(`/entrepreneur/messages?conversation=${conversationId}`);
        } else if (currentUserRole === 'property_manager') {
          navigate(`/manager/messages?conversation=${conversationId}`);
        } else {
          navigate(`/messages?conversation=${conversationId}`);
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      
      if (error.message.includes('authorized') || error.message.includes('approved')) {
        showAccessDeniedMessage();
      } else {
        alert('Failed to start conversation. Please try again.');
      }
    }
  };

  const showAccessDeniedMessage = () => {
    alert(
      errorMessage || 
      'You need an approved bid to message this property manager.\n\n' +
      'Submit a bid on their job first, then you can message them after approval.'
    );
  };

  // ============================================
  // RENDER DIFFERENT STATES
  // ============================================

  // Don't show button if same user
  if (otherUserId === currentUserId) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <button 
        className={`contact-button loading ${variant} ${className}`}
        disabled
      >
        <span className="loading-spinner"></span>
        {variant !== 'icon' && 'Loading...'}
      </button>
    );
  }

  // LOCKED STATE - No access (entrepreneur without approved bid)
  if (!canMessage) {
    return (
      <button 
        className={`contact-button locked ${variant} ${className}`}
        onClick={showAccessDeniedMessage}
        title={errorMessage}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        {variant !== 'icon' && (
          <span>
            {bidStatus === 'pending' ? 'Awaiting Approval' : 
             bidStatus === 'declined' ? 'Bid Declined' : 
             'Contact Locked'}
          </span>
        )}
      </button>
    );
  }

  // UNLOCKED STATE - Has access (can message)
  return (
    <button 
      className={`contact-button unlocked ${variant} ${className}`}
      onClick={handleContactClick}
      title={`Message ${otherUserName}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {variant !== 'icon' && (
        <span>
          {bidStatus === 'approved' ? 'Message Manager 🔓' : 
           'Contact'}
        </span>
      )}
    </button>
  );
}

export default ContactButton;

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: On job listing card (Entrepreneur view)
<ContactButton 
  otherUserId={job.manager_id}
  otherUserName={job.manager_name}
  otherUserRole="property_manager"
  jobId={job.id}
/>

// Example 2: On bid details page (with bid status)
<ContactButton 
  otherUserId={bid.manager_id}
  otherUserName={bid.manager_name}
  otherUserRole="property_manager"
  jobId={bid.job_id}
  bidStatus={bid.status}  // 'pending', 'approved', 'declined'
/>

// Example 3: Icon-only variant
<ContactButton 
  otherUserId={userId}
  otherUserName={userName}
  otherUserRole="property_manager"
  variant="icon"
/>

// Example 4: Manager contacting entrepreneur (after bid approval)
<ContactButton 
  otherUserId={entrepreneur.id}
  otherUserName={entrepreneur.name}
  otherUserRole="entrepreneur"
  jobId={job.id}
/>

// Example 5: With custom styling
<ContactButton 
  otherUserId={userId}
  otherUserName={userName}
  otherUserRole="property_manager"
  className="my-custom-class"
  variant="secondary"
/>
*/

// ============================================
// CSS STYLING (Add to your stylesheet)
// ============================================

/*
.contact-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.contact-button svg {
  width: 20px;
  height: 20px;
}

.contact-button.primary {
  background: #4F46E5;
  color: white;
}

.contact-button.primary:hover:not(:disabled) {
  background: #4338CA;
}

.contact-button.secondary {
  background: #F3F4F6;
  color: #374151;
  border: 1px solid #D1D5DB;
}

.contact-button.secondary:hover:not(:disabled) {
  background: #E5E7EB;
}

.contact-button.icon {
  padding: 8px;
  border-radius: 50%;
}

.contact-button.locked {
  background: #FEE2E2;
  color: #991B1B;
  cursor: not-allowed;
  opacity: 0.7;
}

.contact-button.locked svg {
  color: #DC2626;
}

.contact-button.unlocked.primary {
  background: #10B981;
}

.contact-button.unlocked.primary:hover {
  background: #059669;
}

.contact-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
*/