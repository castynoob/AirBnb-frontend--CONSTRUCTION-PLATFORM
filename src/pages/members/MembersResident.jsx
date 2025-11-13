import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Nav from '../../components/Nav';
import '../../styles/resident/messagesresident.css';

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

  // If 403 (Invalid token), refresh and retry
  if (response.status === 403) {
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

const MessagesResident = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('group'); // 'group' or 'dm'
  const [groupChats, setGroupChats] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activeDM, setActiveDM] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  useEffect(() => {
    fetchGroupChats();
    fetchDirectMessages();
    setupSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Handle URL parameters for opening DM from Members page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const recipientId = params.get('recipient');

    console.log('🔗 URL params:', { tab, recipientId });
    console.log('🔗 Navigation state:', location.state);

    if (tab === 'dm' && recipientId) {
      console.log('✅ Switching to DM tab');
      setActiveTab('dm');

      let recipient = null;

      // Try to get recipient from navigation state first (more reliable)
      if (location.state?.recipient) {
        console.log('✅ Got recipient from navigation state:', location.state.recipient);
        recipient = location.state.recipient;
      } else {
        // Fallback to localStorage
        const recipientData = localStorage.getItem('dmRecipient');
        console.log('📦 Recipient data from localStorage:', recipientData);

        if (recipientData) {
          recipient = JSON.parse(recipientData);
          console.log('✅ Got recipient from localStorage:', recipient);
          localStorage.removeItem('dmRecipient');
        }
      }

      if (recipient) {
        console.log('➕ Creating conversation with:', recipient);
        setActiveDM(recipient);
        setMessages([]);
      } else {
        console.warn('⚠️ No recipient data found in either state or localStorage');
      }
    }
  }, [location.search, location.state]);

  const setupSocket = () => {
    const userProfile = JSON.parse(localStorage.getItem('userProfile'));
    if (!userProfile?.token) return;

    const newSocket = io(API_BASE_URL, {
      auth: { token: userProfile.token }
    });

    setSocket(newSocket);

    // ============================================
    // CONNECTION EVENTS
    // ============================================
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    newSocket.on('error', (error) => {
      console.error('⚠️ Socket error:', error);
    });

    // ============================================
    // GROUP CHAT EVENTS
    // ============================================

    // Listen for new group messages
    newSocket.on('new_group_message', (message) => {
      console.log('📨 Received new group message:', message);
      setMessages(prev => [...prev, message]);

      // Update group chat list with latest message
      setGroupChats(prev => prev.map(chat =>
        chat.id === message.group_chat_id
          ? { ...chat, last_message: message.message_text, unread_count: 0 }
          : chat
      ));
    });

    // Listen for typing indicators in group chats
    newSocket.on('group_user_typing', ({ userId, groupChatId }) => {
      console.log('✏️ User typing in group:', userId, groupChatId);
      if (activeChat && groupChatId === activeChat.id && userId !== userProfile.user.id) {
        setTypingUsers(prev => {
          const userName = `User ${userId}`;
          if (!prev.includes(userName)) {
            return [...prev, userName];
          }
          return prev;
        });

        // Remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(name => name !== `User ${userId}`));
        }, 3000);
      }
    });

    newSocket.on('group_user_stopped_typing', ({ userId }) => {
      setTypingUsers(prev => prev.filter(name => name !== `User ${userId}`));
    });

    // ============================================
    // DIRECT MESSAGE EVENTS
    // ============================================

    // Listen for new direct messages (both event names for compatibility)
    const handleNewDirectMessage = (data) => {
      console.log('📨 Received new DM:', data);
      const message = data.message || data;

      // Add to messages if this is the active conversation
      if (activeDM && (message.sender_id === activeDM.user_id || message.recipient_id === activeDM.user_id)) {
        setMessages(prev => [...prev, message]);
      }

      // Update DM list with latest message
      setDirectMessages(prev => {
        const updatedList = prev.map(dm =>
          dm.user_id === message.sender_id || dm.user_id === message.recipient_id
            ? { ...dm, last_message: message.message_text, unread_count: dm.unread_count + 1 }
            : dm
        );

        // If sender not in list, add them
        if (!prev.find(dm => dm.user_id === message.sender_id)) {
          return [...updatedList, {
            user_id: message.sender_id,
            first_name: message.sender_name?.split(' ')[0] || 'Unknown',
            last_name: message.sender_name?.split(' ')[1] || 'User',
            last_message: message.message_text,
            unread_count: 1
          }];
        }

        return updatedList;
      });
    };

    newSocket.on('new_dm_message', handleNewDirectMessage);
    newSocket.on('new_direct_message', handleNewDirectMessage);
  };

  const fetchGroupChats = async () => {
    try {
      setLoading(true);
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        setError('Please log in to view messages');
        setLoading(false);
        return;
      }

      const response = await fetchWithAuth(`${API_BASE_URL}/api/residents/group-chats`);

      if (!response.ok) throw new Error('Failed to fetch group chats');

      const data = await response.json();
      console.log('📥 Group chats response:', data);

      if (data.success) {
        const chats = data.group_chats || data.groupChats || [];
        console.log(`✅ Setting ${chats.length} group chat(s)`, chats);
        setGroupChats(chats);

        // Auto-select first chat if available
        if (chats.length > 0 && !activeChat && activeTab === 'group') {
          selectChat(chats[0]);
        }
      } else {
        console.warn('⚠️ API returned success: false', data);
        setGroupChats([]);
      }
    } catch (error) {
      console.error('❌ Error fetching group chats:', error);
      setError(error.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectMessages = async () => {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) return;

      const response = await fetchWithAuth(`${API_BASE_URL}/api/residents/direct-messages`);

      if (!response.ok) throw new Error('Failed to fetch direct messages');

      const data = await response.json();
      if (data.success) {
        setDirectMessages(data.conversations || []);
      }
    } catch (error) {
      console.error('❌ Error fetching direct messages:', error);
      // Don't set error state for DMs since it's not critical
    }
  };

  const selectChat = async (chat) => {
    console.log('💬 Selecting chat:', chat.name, 'ID:', chat.id);
    setActiveChat(chat);
    setActiveDM(null); // Clear DM when selecting group chat
    await fetchChatMessages(chat.id);

    // Join the chat room via socket
    if (socket) {
      console.log('🔗 Joining group chat room:', chat.id);
      socket.emit('join_group_chat', chat.id);
    } else {
      console.warn('⚠️ Socket not connected');
    }

    // Mark as read
    await markChatAsRead(chat.id);
  };

  const fetchChatMessages = async (chatId) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/residents/group-chats/${chatId}/messages`
      );

      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    }
  };

  const markChatAsRead = async (chatId) => {
    try {
      await fetchWithAuth(
        `${API_BASE_URL}/api/residents/group-chats/${chatId}/read`,
        { method: 'PUT' }
      );

      // Also emit socket event to mark as read in real-time
      if (socket) {
        socket.emit('mark_group_chat_as_read', { groupChatId: chatId });
      }
    } catch (error) {
      console.error('❌ Error marking chat as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;

    try {
      console.log('📤 Sending group message to chat:', activeChat.id);
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/residents/group-chats/${activeChat.id}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: messageInput,
            message_type: 'text'
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
        // Message will be added via socket event
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message: ' + error.message);
    }
  };

  const handleTyping = () => {
    if (socket && activeChat) {
      socket.emit('group_typing_start', { groupChatId: activeChat.id });
    }
  };

  const selectDM = async (conversation) => {
    console.log('💬 Selecting DM with:', conversation.first_name, conversation.last_name);
    setActiveChat(null); // Clear group chat when selecting DM
    setActiveDM(conversation);
    await fetchDMMessages(conversation.user_id);

    // Join DM room via socket
    if (socket) {
      console.log('🔗 Joining DM room with user:', conversation.user_id);
      socket.emit('join_dm', { recipient_id: conversation.user_id });
    }
  };

  const fetchDMMessages = async (recipientId) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/residents/direct-messages/${recipientId}/messages`
      );

      if (!response.ok) throw new Error('Failed to fetch DM messages');

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('❌ Error fetching DM messages:', error);
    }
  };

  const sendDMMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeDM) return;

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/residents/direct-messages/${activeDM.user_id}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ message_text: messageInput })
        }
      );

      if (!response.ok) throw new Error('Failed to send DM');

      const data = await response.json();
      if (data.success) {
        setMessageInput('');
        // Message will be added via socket event
      }
    } catch (error) {
      console.error('❌ Error sending DM:', error);
    }
  };

  const createGroupChat = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/residents/group-chats`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: newGroupName,
            description: newGroupDescription
          })
        }
      );

      if (!response.ok) throw new Error('Failed to create group chat');

      const data = await response.json();
      if (data.success) {
        setShowCreateGroupModal(false);
        setNewGroupName('');
        setNewGroupDescription('');
        await fetchGroupChats();
      }
    } catch (error) {
      console.error('❌ Error creating group chat:', error);
      alert('Failed to create group chat');
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setActiveChat(null);
    setActiveDM(null);
    setMessages([]);
  };

  return (
    <div className="messages-resident-page-fullscreen">
      <Nav />
      <div className="messages-resident-container-fullscreen">
        {/* Header Bar */}
        <div className="messages-resident-header-bar">
          <h1>Messages</h1>

          {/* Tab Navigation */}
          <div className="tabs-section-resident">
            <button
              className={`tab-btn-resident ${activeTab === 'group' ? 'active' : ''}`}
              onClick={() => switchTab('group')}
            >
              Group Chats
            </button>
            <button
              className={`tab-btn-resident ${activeTab === 'dm' ? 'active' : ''}`}
              onClick={() => switchTab('dm')}
            >
              Direct Messages
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading chats...</p>
          </div>
        )}

        {error && !loading && (
          <div className="error-container">
            <p className="error-message">{error}</p>
          </div>
        )}

        {/* Group Chats Tab */}
        {!loading && !error && activeTab === 'group' && (
          <>
            {groupChats.length === 0 ? (
              <div className="empty-chat-resident">
                <div className="empty-icon">💬</div>
                <h3>No group chats available</h3>
                <p>Create a group chat or wait to be added to one</p>
                <button
                  className="create-group-btn-empty"
                  onClick={() => setShowCreateGroupModal(true)}
                >
                  + Create Group Chat
                </button>
              </div>
            ) : (
              <div className="messages-resident-layout">
                {/* Chat Sidebar */}
                <div className="chat-sidebar-resident">
                  <div className="sidebar-header-resident">
                    <button
                      className="create-group-btn-sidebar"
                      onClick={() => setShowCreateGroupModal(true)}
                    >
                      + Create Group
                    </button>
                  </div>

                  {/* Chat List */}
                  <div className="chat-list-resident">
                    {groupChats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`chat-item-resident ${activeChat?.id === chat.id ? 'active' : ''}`}
                        onClick={() => selectChat(chat)}
                      >
                        <div className="chat-avatar-resident">
                          <div className="avatar-circle-resident">🏢</div>
                          {chat.unread_count > 0 && (
                            <span className="unread-badge-resident">{chat.unread_count}</span>
                          )}
                        </div>
                        <div className="chat-info-resident">
                          <div className="chat-top-resident">
                            <h4 className="chat-name-resident">{chat.name}</h4>
                          </div>
                          <p className="chat-preview-resident">{chat.description || 'Building group chat'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Window */}
                <div className="chat-window-resident">
                  {activeChat ? (
                    <>
                      <div className="chat-header-resident">
                        <div className="header-info-resident">
                          <div className="header-avatar-wrapper">
                            <div className="header-avatar-resident">🏢</div>
                          </div>
                          <div>
                            <h3 className="header-name-resident">{activeChat.name}</h3>
                            <p className="user-status-text">{activeChat.member_count || 0} members</p>
                          </div>
                        </div>
                      </div>

                      <div className="chat-messages-resident">
                        {messages.map((msg) => {
                          const userProfile = JSON.parse(localStorage.getItem('userProfile'));
                          const isOwn = msg.sender_id === userProfile.user.id;

                          return (
                            <div key={msg.id} className={`message-wrapper-resident ${isOwn ? 'sent' : 'received'}`}>
                              {!isOwn && (
                                <div className="group-message-avatar">
                                  <div className="avatar-circle-small">{msg.sender_name?.[0] || '?'}</div>
                                </div>
                              )}
                              <div className="group-message-content">
                                {!isOwn && <div className="group-sender-name">{msg.sender_name}</div>}
                                <div className="message-bubble-resident">
                                  <p className="message-text-resident">{msg.message_text}</p>
                                  <span className="message-time-resident">
                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {typingUsers.length > 0 && (
                          <div className="typing-indicator-wrapper">
                            <div className="typing-indicator">
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                            </div>
                            <span className="typing-text">{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                          </div>
                        )}
                      </div>

                      <div className="chat-input-area-resident">
                        <form className="message-input-form-resident" onSubmit={sendMessage}>
                          <input
                            type="text"
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={handleTyping}
                            className="message-input-resident"
                          />
                          <button type="submit" className="send-btn-resident" disabled={!messageInput.trim()}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                            </svg>
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="empty-chat-resident">
                      <div className="empty-icon">💬</div>
                      <h3>Select a chat to start messaging</h3>
                      <p>Choose a conversation from the list</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Direct Messages Tab */}
        {!loading && !error && activeTab === 'dm' && (
          <>
            {directMessages.length === 0 && !activeDM ? (
              <div className="empty-chat-resident">
                <div className="empty-icon">✉️</div>
                <h3>No direct messages yet</h3>
                <p>Start a conversation by messaging residents from the Members page</p>
                <button
                  className="create-group-btn-empty"
                  onClick={() => navigate('/members/resident')}
                >
                  Go to Members
                </button>
              </div>
            ) : (
              <div className="messages-resident-layout">
                {/* DM Sidebar */}
                <div className="chat-sidebar-resident">
                  {/* DM List */}
                  <div className="chat-list-resident">
                    {directMessages.map((dm) => (
                      <div
                        key={dm.user_id}
                        className={`chat-item-resident ${activeDM?.user_id === dm.user_id ? 'active' : ''}`}
                        onClick={() => selectDM(dm)}
                      >
                        <div className="chat-avatar-resident">
                          <div className="avatar-circle-resident">{dm.first_name?.[0] || '?'}</div>
                          {dm.unread_count > 0 && (
                            <span className="unread-badge-resident">{dm.unread_count}</span>
                          )}
                        </div>
                        <div className="chat-info-resident">
                          <div className="chat-top-resident">
                            <h4 className="chat-name-resident">{dm.first_name} {dm.last_name}</h4>
                          </div>
                          <p className="chat-preview-resident">{dm.last_message || 'No messages yet'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DM Chat Window */}
                <div className="chat-window-resident">
                  {activeDM ? (
                    <>
                      <div className="chat-header-resident">
                        <div className="header-info-resident">
                          <div className="header-avatar-wrapper">
                            <div className="header-avatar-resident">{activeDM.first_name?.[0] || '?'}</div>
                          </div>
                          <div>
                            <h3 className="header-name-resident">{activeDM.first_name} {activeDM.last_name}</h3>
                            <p className="user-status-text">Unit {activeDM.unit_number || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="chat-messages-resident">
                        {messages.map((msg) => {
                          const userProfile = JSON.parse(localStorage.getItem('userProfile'));
                          const isOwn = msg.sender_id === userProfile.user.id;

                          return (
                            <div key={msg.id} className={`message-wrapper-resident ${isOwn ? 'sent' : 'received'}`}>
                              {!isOwn && (
                                <div className="chat-avatar-resident">
                                  <div className="avatar-circle-small">{activeDM.first_name?.[0] || '?'}</div>
                                </div>
                              )}
                              <div className="message-bubble-resident">
                                <p className="message-text-resident">{msg.message_text}</p>
                                <span className="message-time-resident">
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="chat-input-area-resident">
                        <form className="message-input-form-resident" onSubmit={sendDMMessage}>
                          <input
                            type="text"
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            className="message-input-resident"
                          />
                          <button type="submit" className="send-btn-resident" disabled={!messageInput.trim()}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                            </svg>
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="empty-chat-resident">
                      <div className="empty-icon">✉️</div>
                      <h3>Select a conversation</h3>
                      <p>Choose a contact to start messaging</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Group Chat Modal */}
        {showCreateGroupModal && (
          <div className="modal-overlay" onClick={() => setShowCreateGroupModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create Group Chat</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateGroupModal(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={createGroupChat}>
                <div className="form-group">
                  <label htmlFor="groupName">Group Name *</label>
                  <input
                    type="text"
                    id="groupName"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Floor 3 Residents"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="groupDescription">Description</label>
                  <textarea
                    id="groupDescription"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="What is this group chat for?"
                    rows="3"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCreateGroupModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!newGroupName.trim()}
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesResident;
