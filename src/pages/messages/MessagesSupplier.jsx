import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { Image as ImageIcon, Paperclip, X, File, Download, Loader2, Search, ArrowLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Nav from '../../components/Nav';
import EntrepreneurProfileModal from '../../components/modal/EntrepreneurProfileModal';
import '../../styles/supplier/messagessupplier.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Token refresh helper
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token');

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    localStorage.clear();
    window.location.href = '/';
    throw new Error('Session expired');
  }

  const data = await response.json();
  localStorage.setItem('token', data.accessToken);

  const userProfile = JSON.parse(localStorage.getItem('userProfile'));
  if (userProfile) {
    userProfile.token = data.accessToken;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }

  return data.accessToken;
}

// Fetch with automatic token refresh
async function fetchWithAuth(url, options = {}) {
  const userProfile = JSON.parse(localStorage.getItem('userProfile'));
  if (!userProfile?.token) throw new Error('Not authenticated');

  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${userProfile.token}`,
    'Content-Type': 'application/json'
  };

  let response = await fetch(url, options);

  if (response.status === 401 || response.status === 403) {
    try {
      const newToken = await refreshToken();
      options.headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, options);
    } catch (error) {
      throw new Error('Session expired. Please log in again.');
    }
  }

  return response;
}

const MessagesSupplier = () => {
  const socketContext = useSocket();
  const socket = socketContext?.socket;

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Entrepreneur Profile Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const messagesContainerRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = (smooth = false) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    setTimeout(() => {
      try {
        if (smooth && 'scrollTo' in el) {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        } else {
          el.scrollTop = el.scrollHeight;
        }
      } catch (e) {
        el.scrollTop = el.scrollHeight;
      }
    }, 40);
  };

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem('userProfile');
      if (raw) {
        const up = JSON.parse(raw);
        if (up?.user?.id) return up.user.id;
        if (up?.id) return up.id;
        if (up?.user_id) return up.user_id;
        if (up?.userId) return up.userId;
        const token = up?.token || localStorage.getItem('token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload?.id || payload?.sub || payload?.userId;
          } catch (e) {
            // ignore
          }
        }
      }
      const storedId = localStorage.getItem('userId');
      if (storedId) return storedId;
    } catch (e) {
      console.warn('Could not resolve current user id', e);
    }
    return undefined;
  };

  // Fetch conversations on mount
  useEffect(() => {
    const initializeChat = async () => {
      console.log('🔌 Socket status:', socket ? '✅ Connected' : '❌ Not connected');
      setLoading(true);
      setError(null);

      try {
        await fetchConversations();
      } catch (error) {
        console.error('❌ Error during initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, []);

  // Fetch supplier conversations (only entrepreneurs)
  const fetchConversations = async () => {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        setError('Please log in to view messages');
        return;
      }

      console.log('🔄 Fetching supplier conversations...');
      // Use the existing conversations endpoint (mounted at /api, not /api/messages)
      const response = await fetchWithAuth(`${API_BASE_URL}/api/conversations`);

      if (!response.ok) {
        console.error('❌ Response not ok:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch conversations: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Conversations response:', data);

      if (data.success) {
        // Filter to only show entrepreneur conversations (suppliers can only message entrepreneurs)
        const entrepreneurConversations = (data.conversations || []).filter(
          conv => conv.other_user_role === 'entrepreneur'
        );
        console.log(`✅ Loaded ${entrepreneurConversations.length} entrepreneur conversations`);
        setConversations(entrepreneurConversations);
      } else {
        console.warn('⚠️ API returned success: false', data);
        setConversations([]);
      }
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      setError(error.message || 'Failed to load conversations');
    }
  };

  // Select a conversation
  const selectConversation = async (conversation) => {
    console.log('💬 Selecting conversation with:', conversation.other_user_name);

    if (window.innerWidth <= 768) {
      setShowMobileChat(true);
    }

    setActiveConversation(conversation);
    setMessages([]);
    await fetchMessages(conversation.id);

    // Join conversation room via socket
    if (socket) {
      console.log('🔗 Joining conversation room:', conversation.id);
      socket.emit('join_conversation', conversation.id);
    }

    // Mark as read
    await markAsRead(conversation.id);
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    try {
      // Use the existing conversations endpoint (mounted at /api)
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/conversations/${conversationId}/messages`
      );

      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
        scrollToBottom();
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    }
  };

  // Mark conversation as read
  const markAsRead = async (conversationId) => {
    try {
      // Use the existing conversations endpoint (mounted at /api)
      await fetchWithAuth(
        `${API_BASE_URL}/api/conversations/${conversationId}/read`,
        { method: 'PUT' }
      );
    } catch (error) {
      console.error('❌ Error marking as read:', error);
    }
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    console.log('✅ Socket connected, setting up listeners...');

    const handleNewMessage = (data) => {
      console.log('📨 Received new message:', data);
      const message = data.message || data;

      // Add to messages if this is the active conversation
      if (activeConversation && String(data.conversationId) === String(activeConversation.id)) {
        setMessages(prev => {
          if (prev.find(m => String(m.id) === String(message.id))) return prev;
          return [...prev, message];
        });
        scrollToBottom(true);
      }

      // Update conversation list
      setConversations(prev => prev.map(conv =>
        String(conv.id) === String(data.conversationId)
          ? { ...conv, last_message: message.content || message.message_text, unread_count: (conv.unread_count || 0) + 1 }
          : conv
      ));
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, activeConversation]);

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!messageInput.trim() && !uploadedImage && uploadedFiles.length === 0) || !activeConversation) return;

    try {
      console.log('📤 Sending message to conversation:', activeConversation.id);

      // Use the existing messages API endpoint (mounted at /api)
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            receiverId: activeConversation.other_user_id,
            content: messageInput,
            imageUrl: uploadedImage?.url || null,
            attachments: uploadedFiles.length > 0 ? uploadedFiles : null
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const data = await response.json();
      if (data.success) {
        console.log('✅ Message sent successfully');
        setMessageInput('');
        setUploadedImage(null);
        setUploadedFiles([]);

        const userId = getCurrentUserId();
        const serverMsg = data.message || data;
        const newMsg = {
          id: serverMsg?.id || `temp-${Date.now()}`,
          conversation_id: activeConversation.id,
          sender_id: serverMsg?.sender_id ?? userId,
          content: serverMsg?.content ?? messageInput,
          image_url: serverMsg?.image_url || uploadedImage?.url || null,
          attachments: serverMsg?.attachments || (uploadedFiles.length > 0 ? uploadedFiles : null),
          created_at: serverMsg?.created_at || new Date().toISOString()
        };

        setMessages(prev => {
          if (prev.find(m => String(m.id) === String(newMsg.id))) return prev;
          return [...prev, newMsg];
        });

        // Update conversation preview
        setConversations(prev => prev.map(conv =>
          conv.id === activeConversation.id
            ? { ...conv, last_message: newMsg.content || '[Attachment]' }
            : conv
        ));

        scrollToBottom(true);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message: ' + error.message);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('📷 Attempting to upload image:', file.name);

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        alert('You must be logged in to upload files');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/messages/upload-attachment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userProfile.token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', errorText);
        alert(`Failed to upload image: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUploadedImage(data.file);
        console.log('✅ Image uploaded successfully:', data.file);
      } else {
        alert(data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('❌ Image upload error:', error);
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('📎 Attempting to upload file:', file.name);

    if (file.size > 10 * 1024 * 1024) {
      alert('File must be less than 10MB');
      return;
    }

    setIsUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        alert('You must be logged in to upload files');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/messages/upload-attachment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userProfile.token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', errorText);
        alert(`Failed to upload file: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUploadedFiles(prev => [...prev, data.file]);
        console.log('✅ File uploaded successfully:', data.file);
      } else {
        alert(data.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('❌ File upload error:', error);
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove uploaded image
  const removeUploadedImage = () => {
    setUploadedImage(null);
  };

  // Remove uploaded file
  const removeUploadedFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Filter conversations by search term
  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get initials
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  // Handle viewing entrepreneur profile
  const handleViewEntrepreneurProfile = async (conversation) => {
    const userId = conversation.other_user_id;
    if (!userId || isLoadingProfile) return;

    setIsLoadingProfile(true);
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) return;

      const response = await fetch(
        `${API_BASE_URL}/api/users/entrepreneur/user/${userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${userProfile.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch entrepreneur profile');
      }

      const data = await response.json();
      setSelectedProfile({
        ...data.profile,
        first_name: conversation.other_user_name?.split(' ')[0] || '',
        last_name: conversation.other_user_name?.split(' ').slice(1).join(' ') || '',
      });
      setShowProfileModal(true);
    } catch (error) {
      console.error('Error fetching entrepreneur profile:', error);
      toast.error('Failed to load entrepreneur profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  return (
    <div className="messages-supplier-page-fullscreen">
      <Nav />
      <div className="messages-supplier-container-fullscreen">
        {/* SIDEBAR */}
        <div className={`chat-sidebar-supplier ${showMobileChat ? 'hide-mobile' : ''}`}>
          <div className="sidebar-header-supplier">
            <h2>Messages</h2>
            <p className="sidebar-subtitle">Chat with construction companies</p>

            {/* Search */}
            <div className="search-box-supplier">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search entrepreneurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-supplier"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="chat-list-supplier">
            {loading ? (
              <div className="loading-container-supplier">
                <div className="loading-spinner-supplier"></div>
                <p>Loading conversations...</p>
              </div>
            ) : error ? (
              <div className="error-container-supplier">
                <p className="error-message-supplier">{error}</p>
                <button className="retry-btn-supplier" onClick={fetchConversations}>
                  Try Again
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="empty-list-message-supplier">
                {searchTerm ? 'No matching conversations' : 'No conversations yet'}
                <p className="empty-list-hint">
                  You can message entrepreneurs after you accept their material requests. Check your homepage for pending requests.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`chat-item-supplier ${activeConversation?.id === conv.id ? 'active' : ''}`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="chat-avatar-supplier">
                    <div
                      className="avatar-circle-supplier clickable"
                      onClick={(e) => { e.stopPropagation(); handleViewEntrepreneurProfile(conv); }}
                      title="View entrepreneur profile"
                    >
                      {getInitials(conv.other_user_name || conv.company_name)}
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="unread-badge-supplier">{conv.unread_count}</span>
                    )}
                  </div>
                  <div className="chat-info-supplier">
                    <div className="chat-top-supplier">
                      <h4
                        className="chat-name-supplier clickable"
                        onClick={(e) => { e.stopPropagation(); handleViewEntrepreneurProfile(conv); }}
                        title="View entrepreneur profile"
                      >
                        {conv.other_user_name || conv.company_name}
                      </h4>
                    </div>
                    <p className="chat-role-supplier">Entrepreneur</p>
                    <p className="chat-preview-supplier">{conv.last_message || 'No messages yet'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className={`chat-window-supplier ${showMobileChat ? 'show-mobile' : ''}`}>
          {!activeConversation ? (
            <div className="empty-chat-supplier">
              <div className="empty-icon-supplier">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose an entrepreneur from the list to start messaging</p>
              <div className="empty-info-supplier">
                <p>Messaging is enabled after you accept a material request. You can then:</p>
                <ul>
                  <li>Discuss material specifications</li>
                  <li>Negotiate pricing and terms</li>
                  <li>Confirm delivery dates</li>
                  <li>Send invoices and quotes</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="chat-header-supplier">
                <button
                  className="mobile-back-btn-supplier"
                  onClick={() => setShowMobileChat(false)}
                  title="Back to conversations"
                >
                  <ArrowLeft size={20} />
                </button>
                <div
                  className="header-info-supplier clickable-header"
                  onClick={() => handleViewEntrepreneurProfile(activeConversation)}
                  title="View entrepreneur profile"
                >
                  <div className="header-avatar-wrapper-supplier">
                    <div className="header-avatar-supplier">
                      {getInitials(activeConversation.other_user_name || activeConversation.company_name)}
                    </div>
                  </div>
                  <div>
                    <h3 className="header-name-supplier">
                      {activeConversation.other_user_name || activeConversation.company_name}
                    </h3>
                    <p className="user-status-text-supplier">Entrepreneur</p>
                  </div>
                  <ChevronRight size={18} className="header-chevron-supplier" />
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages-supplier" ref={messagesContainerRef}>
                {messages.filter(msg => msg && msg.id).map((msg) => {
                  try {
                    const currentUserId = getCurrentUserId();
                    const isOwn = currentUserId && String(msg.sender_id) === String(currentUserId);

                    return (
                      <div key={msg.id} className={`message-wrapper-supplier ${isOwn ? 'sent' : 'received'}`}>
                        <div className="message-bubble-supplier">
                          {(msg.content || msg.message_text) && (
                            <p className="message-text-supplier">{msg.content || msg.message_text}</p>
                          )}
                          {msg.image_url && (
                            <img
                              src={msg.image_url}
                              alt="attachment"
                              className="message-image-supplier"
                              onClick={() => window.open(msg.image_url, '_blank')}
                            />
                          )}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="message-attachments-supplier">
                              {msg.attachments.map((file, idx) => (
                                <div
                                  key={idx}
                                  className="message-attachment-item-supplier"
                                  onClick={() => window.open(file.url, '_blank')}
                                >
                                  <File size={16} />
                                  <span>{file.fileName}</span>
                                  <Download size={14} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="message-time-supplier">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error rendering message:', error, msg);
                    return null;
                  }
                })}
              </div>

              {/* Message Input */}
              <div className="chat-input-area-supplier">
                {/* Attachment Previews */}
                {(uploadedImage || uploadedFiles.length > 0) && (
                  <div className="attachment-previews-supplier">
                    {uploadedImage && (
                      <div className="attachment-preview-item-supplier">
                        <ImageIcon size={16} />
                        <span className="attachment-preview-name-supplier">{uploadedImage.fileName}</span>
                        <button
                          type="button"
                          className="attachment-remove-btn-supplier"
                          onClick={removeUploadedImage}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="attachment-preview-item-supplier">
                        <File size={16} />
                        <span className="attachment-preview-name-supplier">{file.fileName}</span>
                        <button
                          type="button"
                          className="attachment-remove-btn-supplier"
                          onClick={() => removeUploadedFile(idx)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form className="message-input-form-supplier" onSubmit={sendMessage}>
                  <div className="input-actions-supplier">
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="input-action-btn-supplier"
                      title="Send image"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <Loader2 size={20} className="spinning" />
                      ) : (
                        <ImageIcon size={20} />
                      )}
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="input-action-btn-supplier"
                      title="Attach file"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingFile}
                    >
                      {isUploadingFile ? (
                        <Loader2 size={20} className="spinning" />
                      ) : (
                        <Paperclip size={20} />
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="message-input-supplier"
                  />
                  <button
                    type="submit"
                    className="send-btn-supplier"
                    disabled={!messageInput.trim() && !uploadedImage && uploadedFiles.length === 0}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Entrepreneur Profile Modal */}
      <EntrepreneurProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedProfile(null);
        }}
        profile={selectedProfile}
      />
    </div>
  );
};

export default MessagesSupplier;
