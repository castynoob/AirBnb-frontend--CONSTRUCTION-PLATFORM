import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { Image as ImageIcon, Paperclip, X, File, Download, Loader2 } from 'lucide-react';
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

  // If 401 or 403 (Invalid/expired token), refresh and retry
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

const MessagesResident = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // defensive: useSocket() may return null if context not available during refresh
  const socketContext = useSocket();
  const socket = socketContext?.socket;
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
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const messagesContainerRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = (smooth = false) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    // wait a tick for DOM to update then scroll
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

  // Robust current user id resolver: handles different stored shapes
  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem('userProfile');
      if (raw) {
        const up = JSON.parse(raw);
        if (up?.user?.id) return up.user.id;
        if (up?.id) return up.id;
        if (up?.user_id) return up.user_id;
        if (up?.userId) return up.userId;
        // token may be present on top-level
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

      // fallback to separate userId key
      const storedId = localStorage.getItem('userId');
      if (storedId) return storedId;
    } catch (e) {
      console.warn('Could not resolve current user id', e);
    }
    return undefined;
  };

  useEffect(() => {
    const initializeChat = async () => {
      console.log('🔌 Socket status:', socket ? '✅ Connected' : '❌ Not connected');
      console.log('🚀 Initializing chat - fetching data...');
      setLoading(true);
      setError(null);
      
      try {
        await fetchGroupChats();
        await fetchDirectMessages();
      } catch (error) {
        console.error('❌ Error during initialization:', error);
      } finally {
        console.log('✅ Initialization complete, setting loading to false');
        setLoading(false);
      }
    };

    // Fetch chats immediately, don't wait for socket
    initializeChat();
  }, []);

  const fetchGroupChats = async () => {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) {
        setError('Please log in to view messages');
        return;
      }

      console.log('🔄 Fetching group chats from:', `${API_BASE_URL}/api/residents/group-chats`);
      const response = await fetchWithAuth(`${API_BASE_URL}/api/residents/group-chats`);

      if (!response.ok) {
        console.error('❌ Response not ok:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch group chats: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Group chats response:', data);

      if (data.success) {
        const chats = data.group_chats || data.groupChats || [];
        console.log(`✅ Setting ${chats.length} group chat(s)`, chats);
        setGroupChats(chats);

        // Auto-select first chat if available and socket is connected
        if (chats.length > 0 && !activeChat && activeTab === 'group' && socket) {
          console.log('🎯 Auto-selecting first chat:', chats[0].name);
          await selectChatInternal(chats[0]);
        }
      } else {
        console.warn('⚠️ API returned success: false', data);
        setGroupChats([]);
      }
    } catch (error) {
      console.error('❌ Error fetching group chats:', error);
      setError(error.message || 'Failed to load chats');
    } finally {
      console.log('✅ Finished fetching group chats');
    }
  };

  const fetchDirectMessages = async () => {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile?.token) return;

      console.log('🔄 Fetching direct messages...');
      const response = await fetchWithAuth(`${API_BASE_URL}/api/residents/direct-messages`);

      if (!response.ok) throw new Error('Failed to fetch direct messages');

      const data = await response.json();
      console.log('📥 Direct messages response:', data);
      if (data.success) {
        setDirectMessages(data.conversations || []);
      }
    } catch (error) {
      console.error('❌ Error fetching direct messages:', error);
      // Don't set error state for DMs since it's not critical
    }
  };

  const selectChatInternal = async (chat) => {
    console.log('💬 Selecting chat:', chat.name, 'ID:', chat.id);
    setActiveChat(chat);
    setActiveDM(null); // Clear DM when selecting group chat
    setMessages([]); // Clear messages before fetching new ones
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

  // Public wrapper used by JSX handlers
  const selectChat = (chat) => {
    // Defensive: ensure chat exists
    if (!chat) return;

    // On mobile, show the chat window
    if (window && window.innerWidth && window.innerWidth <= 768) {
      setShowMobileChat(true);
    }

    selectChatInternal(chat).catch(err => console.error('Error selecting chat:', err));
  };

  // Handle URL parameters for opening DM or group chat from mobile navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const recipientId = params.get('recipient');
    const chatId = params.get('chat');

    console.log('🔗 URL params:', { tab, recipientId, chatId });
    console.log('🔗 Navigation state:', location.state);

    // Handle group chat from URL param (mobile navigation)
    if (chatId && !tab) {
      console.log('✅ Opening group chat from mobile:', chatId);
      setActiveTab('group');
      const chat = groupChats.find(c => c.id === chatId);
      if (chat) {
        console.log('🎯 Found chat in list, loading:', chat.name);
        selectChatInternal(chat).catch(err => console.error('Error selecting chat:', err));
      } else {
        console.warn('⚠️ Chat not found in list, may need to wait for groupChats to load');
      }
      return;
    }

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
        setActiveChat(null); // Clear any active group chat
        setActiveDM(recipient);
        setMessages([]); // Clear messages before fetching
        // Fetch existing messages for this conversation
        fetchDMMessages(recipient.user_id).catch(err =>
          console.error('Error fetching DM messages:', err)
        );
      } else {
        console.warn('⚠️ No recipient data found in either state or localStorage');
      }
    }
  }, [location.search, location.state, groupChats]);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    console.log('✅ Socket connected, setting up listeners...');

    // Auto-select first chat when socket connects
    if (groupChats.length > 0 && !activeChat && activeTab === 'group') {
      console.log('🎯 Auto-selecting first chat after socket connection:', groupChats[0].name);
      selectChatInternal(groupChats[0]);
    }

    // Listen for new group messages
    socket.on('new_group_message', (message) => {
      console.log('📨 Received new group message:', message);
      setMessages(prev => [...prev, message]);

      // Update group chat list with latest message (use content fallback)
      const lastText = message.message_text || message.content || message.message || '';
      setGroupChats(prev => prev.map(chat =>
        chat.id === (message.group_chat_id || message.group_chat_id || chat.id)
          ? { ...chat, last_message: lastText, unread_count: 0 }
          : chat
      ));
    });

    // Listen for typing indicators in group chats
    socket.on('group_user_typing', ({ userId, groupChatId }) => {
      console.log('✏️ User typing in group:', userId, groupChatId);
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
    });

    socket.on('group_user_stopped_typing', ({ userId }) => {
      setTypingUsers(prev => prev.filter(name => name !== `User ${userId}`));
    });

    // Listen for new direct messages (both event names for compatibility)
    const handleNewDirectMessage = (data) => {
      console.log('📨 Received new DM:', data);
      const message = data.message || data;

      // Add to messages if this is the active conversation
      setActiveDM(current => {
        if (current && (String(message.sender_id) === String(current.user_id) || String(message.recipient_id) === String(current.user_id))) {
          setMessages(prev => {
            if (prev.find(m => String(m.id) === String(message.id))) return prev;
            return [...prev, message];
          });
        }
        return current;
      });

      // Update DM list with latest message
      setDirectMessages(prev => {
        const updatedList = prev.map(dm =>
          (String(dm.user_id) === String(message.sender_id) || String(dm.user_id) === String(message.recipient_id))
            ? { ...dm, last_message: message.message_text, unread_count: (dm.unread_count || 0) + 1 }
            : dm
        );

        // If sender not in list, add them
        if (!prev.find(dm => String(dm.user_id) === String(message.sender_id))) {
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

    socket.on('new_dm_message', handleNewDirectMessage);
    socket.on('new_direct_message', handleNewDirectMessage);

    return () => {
      socket.off('new_group_message');
      socket.off('group_user_typing');
      socket.off('group_user_stopped_typing');
      socket.off('new_dm_message');
      socket.off('new_direct_message');
    };
  }, [socket]);

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
    if ((!messageInput.trim() && !uploadedImage && uploadedFiles.length === 0) || !activeChat) return;

    try {
      console.log('📤 Sending group message to chat:', activeChat.id);

      // Determine message type based on attachments
      let messageType = 'text';
      if (uploadedImage) messageType = 'image';
      else if (uploadedFiles.length > 0) messageType = 'file';

      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/residents/group-chats/${activeChat.id}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: messageInput,
            message_type: messageType,
            image_url: uploadedImage?.url || null,
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

        // Optimistically append the sent group message when socket is not connected
        const userId = getCurrentUserId();
        const serverMsg = data.message || data;
        const newMsg = {
          id: serverMsg?.id || `temp-${Date.now()}`,
          group_chat_id: activeChat.id,
          sender_id: serverMsg?.sender_id ?? userId,
          content: serverMsg?.content ?? messageInput,
          image_url: serverMsg?.image_url || uploadedImage?.url || null,
          attachments: serverMsg?.attachments || (uploadedFiles.length > 0 ? uploadedFiles : null),
          created_at: serverMsg?.created_at || new Date().toISOString(),
          sender_name: serverMsg?.sender_name || null
        };

        setMessages(prev => {
          if (prev.find(m => String(m.id) === String(newMsg.id))) return prev;
          return [...prev, newMsg];
        });

        // Update group chat preview
        setGroupChats(prev => prev.map(gc => gc.id === activeChat.id ? { ...gc, last_message: newMsg.content || '[Attachment]' } : gc));

        // ensure view scrolls to the new message
        scrollToBottom(true);
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

    // On mobile, show the chat window
    if (window && window.innerWidth && window.innerWidth <= 768) {
      setShowMobileChat(true);
    }

    // Show inline
    setActiveChat(null); // Clear group chat when selecting DM
    setActiveDM(conversation);
    setMessages([]); // Clear messages before fetching new ones
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
    if ((!messageInput.trim() && !uploadedImage && uploadedFiles.length === 0) || !activeDM) return;

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/residents/direct-messages/${activeDM.user_id}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            message_text: messageInput,
            image_url: uploadedImage?.url || null,
            attachments: uploadedFiles.length > 0 ? uploadedFiles : null
          })
        }
      );

      if (!response.ok) throw new Error('Failed to send DM');

      const data = await response.json();
      if (data.success) {
        setMessageInput('');
        setUploadedImage(null);
        setUploadedFiles([]);

        // Build a normalized optimistic message object to ensure sender detection
        const currentUserId = getCurrentUserId();
        const serverMsg = data.message || data;

        const newMsg = {
          id: serverMsg?.id || `temp-${Date.now()}`,
          sender_id: serverMsg?.sender_id ?? currentUserId,
          recipient_id: serverMsg?.recipient_id ?? activeDM.user_id,
          message_text: serverMsg?.message_text ?? serverMsg?.content ?? messageInput,
          image_url: serverMsg?.image_url || uploadedImage?.url || null,
          attachments: serverMsg?.attachments || (uploadedFiles.length > 0 ? uploadedFiles : null),
          created_at: serverMsg?.created_at || new Date().toISOString(),
          ...serverMsg
        };

        setMessages(prev => {
          // avoid duplicating if socket also pushes the same message later
          if (prev.find(m => String(m.id) === String(newMsg.id))) return prev;
          return [...prev, newMsg];
        });

        // Update the DM list preview
        setDirectMessages(prev => prev.map(dm => String(dm.user_id) === String(activeDM.user_id) ? { ...dm, last_message: newMsg.message_text || '[Attachment]' } : dm));

        // scroll to newly appended DM
        scrollToBottom(true);
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
    // Clear any pending uploads when switching tabs
    setUploadedImage(null);
    setUploadedFiles([]);
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

      console.log('📤 Uploading to:', `${API_BASE_URL}/api/messages/upload-attachment`);

      const response = await fetch(`${API_BASE_URL}/api/messages/upload-attachment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userProfile.token}`
        },
        body: formData
      });

      console.log('📥 Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', errorText);
        alert(`Failed to upload image: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log('✅ Upload response:', data);

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
      // Reset the input
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

      console.log('📤 Uploading to:', `${API_BASE_URL}/api/messages/upload-attachment`);

      const response = await fetch(`${API_BASE_URL}/api/messages/upload-attachment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userProfile.token}`
        },
        body: formData
      });

      console.log('📥 Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', errorText);
        alert(`Failed to upload file: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log('✅ Upload response:', data);

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
      // Reset the input
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

  return (
    <div className="messages-resident-page-fullscreen">
      <Nav />
      <div className="messages-resident-container-fullscreen">
        {/* SIDEBAR */}
        <div className={`chat-sidebar-resident ${showMobileChat ? 'hide-mobile' : ''}`}>
          <div className="sidebar-header-resident">
            <h2>Messages</h2>

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

            {/* Create Group Button - Only show on group tab */}
            {activeTab === 'group' && (
              <button
                className="create-group-btn-sidebar"
                onClick={() => setShowCreateGroupModal(true)}
              >
                + Create Group
              </button>
            )}
          </div>

          {/* Chat List */}
          <div className="chat-list-resident">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <p className="error-message">{error}</p>
              </div>
            ) : activeTab === 'group' ? (
              groupChats.length === 0 ? (
                <div className="empty-list-message">No group chats yet</div>
              ) : (
                groupChats.map((chat) => (
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
                ))
              )
            ) : (
              directMessages.length === 0 ? (
                <div className="empty-list-message">No direct messages yet</div>
              ) : (
                directMessages.map((dm) => (
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
                ))
              )
            )}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className={`chat-window-resident ${showMobileChat ? 'show-mobile' : ''}`}>
          {!activeChat && !activeDM ? (
            <div className="empty-chat-resident">
              <div className="empty-icon">💬</div>
              <h3>Select a chat to start messaging</h3>
              <p>Choose a conversation from the list</p>
            </div>
          ) : activeTab === 'group' && activeChat ? (
            <>
              <div className="chat-header-resident">
                <button
                  className="mobile-back-btn"
                  onClick={() => setShowMobileChat(false)}
                  title="Back to conversations"
                >
                  ←
                </button>
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

              {/* Group Chat Messages */}
              <div className="chat-messages-resident" ref={messagesContainerRef}>
                {Array.isArray(messages) ? messages.filter(msg => msg && msg.id).map((msg) => {
                  try {
                    const currentUserId = getCurrentUserId();
                    const isOwn = currentUserId && String(msg.sender_id) === String(currentUserId);

                    return (
                      <div key={msg.id} className={`message-wrapper-resident ${isOwn ? 'sent' : 'received'}`}>
                        {!isOwn && msg.sender_name && (
                          <span className="message-sender-name">{msg.sender_name}</span>
                        )}
                        <div className="message-bubble-resident">
                          {(msg.message_text || msg.content || msg.message) && (
                            <p className="message-text-resident">{msg.message_text || msg.content || msg.message}</p>
                          )}
                          {msg.image_url && (
                            <img
                              src={msg.image_url}
                              alt="attachment"
                              className="message-image-resident"
                              onClick={() => window.open(msg.image_url, '_blank')}
                            />
                          )}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="message-attachments-resident">
                              {msg.attachments.map((file, idx) => (
                                <div
                                  key={idx}
                                  className="message-attachment-item"
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
                        <span className="message-time-resident">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error rendering message:', error, msg);
                    return null;
                  }
                }) : null}

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

              {/* Group Chat Input */}
              <div className="chat-input-area-resident">
                {/* Attachment Previews */}
                {(uploadedImage || uploadedFiles.length > 0) && (
                  <div className="attachment-previews-resident">
                    {uploadedImage && (
                      <div className="attachment-preview-item">
                        <ImageIcon size={16} />
                        <span className="attachment-preview-name">{uploadedImage.fileName}</span>
                        <button
                          type="button"
                          className="attachment-remove-btn"
                          onClick={removeUploadedImage}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="attachment-preview-item">
                        <File size={16} />
                        <span className="attachment-preview-name">{file.fileName}</span>
                        <button
                          type="button"
                          className="attachment-remove-btn"
                          onClick={() => removeUploadedFile(idx)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form className="message-input-form-resident" onSubmit={sendMessage}>
                  <div className="input-actions-resident">
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="input-action-btn"
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
                      className="input-action-btn"
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
                    onKeyDown={handleTyping}
                    className="message-input-resident"
                  />
                  <button
                    type="submit"
                    className="send-btn-resident"
                    disabled={!messageInput.trim() && !uploadedImage && uploadedFiles.length === 0}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : activeTab === 'dm' && activeDM ? (
            <>
              {/* DM Header */}
              <div className="chat-header-resident">
                <button
                  className="mobile-back-btn"
                  onClick={() => setShowMobileChat(false)}
                  title="Back to conversations"
                >
                  ←
                </button>
                <div className="header-info-resident">
                  <div className="header-avatar-wrapper">
                    <div className="header-avatar-resident">{activeDM.first_name?.[0] || '?'}</div>
                  </div>
                  <div>
                    <h3 className="header-name-resident">{activeDM.first_name} {activeDM.last_name}</h3>
                    <p className="user-status-text">Resident</p>
                  </div>
                </div>
                <div className="header-actions-resident">
                  <button className="header-action-btn" title="Call">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* DM Messages */}
              <div className="chat-messages-resident" ref={messagesContainerRef}>
                {Array.isArray(messages) ? messages.filter(msg => msg && msg.id).map((msg) => {
                  try {
                    const currentUserId = getCurrentUserId();
                    const isOwn = currentUserId && String(msg.sender_id) === String(currentUserId);

                    return (
                      <div key={msg.id} className={`message-wrapper-resident ${isOwn ? 'sent' : 'received'}`}>
                        <div className="message-bubble-resident">
                          {(msg.message_text || msg.content || msg.message) && (
                            <p className="message-text-resident">{msg.message_text || msg.content || msg.message}</p>
                          )}
                          {msg.image_url && (
                            <img
                              src={msg.image_url}
                              alt="attachment"
                              className="message-image-resident"
                              onClick={() => window.open(msg.image_url, '_blank')}
                            />
                          )}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="message-attachments-resident">
                              {msg.attachments.map((file, idx) => (
                                <div
                                  key={idx}
                                  className="message-attachment-item"
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
                        <span className="message-time-resident">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error rendering DM message:', error, msg);
                    return null;
                  }
                }) : null}
              </div>

              {/* DM Input */}
              <div className="chat-input-area-resident">
                {/* Attachment Previews */}
                {(uploadedImage || uploadedFiles.length > 0) && (
                  <div className="attachment-previews-resident">
                    {uploadedImage && (
                      <div className="attachment-preview-item">
                        <ImageIcon size={16} />
                        <span className="attachment-preview-name">{uploadedImage.fileName}</span>
                        <button
                          type="button"
                          className="attachment-remove-btn"
                          onClick={removeUploadedImage}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="attachment-preview-item">
                        <File size={16} />
                        <span className="attachment-preview-name">{file.fileName}</span>
                        <button
                          type="button"
                          className="attachment-remove-btn"
                          onClick={() => removeUploadedFile(idx)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form className="message-input-form-resident" onSubmit={sendDMMessage}>
                  <div className="input-actions-resident">
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="input-action-btn"
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
                      className="input-action-btn"
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
                    className="message-input-resident"
                  />
                  <button
                    type="submit"
                    className="send-btn-resident"
                    disabled={!messageInput.trim() && !uploadedImage && uploadedFiles.length === 0}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : null}
        </div>

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