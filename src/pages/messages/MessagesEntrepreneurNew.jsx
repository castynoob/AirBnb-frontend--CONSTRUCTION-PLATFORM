import { useState, useEffect, useRef } from "react";
import Nav from "../../components/Nav";
import "../../styles/manager/messages-new.css";
import {
  MessageSquare,
  Send,
  Search,
  Paperclip,
  Image as ImageIcon,
  X,
  File,
  Download,
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  MapPin,
  Briefcase,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSocket } from "../../contexts/SocketContext";
import {
  getConversations,
  getMessages,
  markConversationAsRead,
} from "../../utils/api";
import EntrepreneurProfileModal from "../../components/modal/EntrepreneurProfileModal";
import PropertyManagerProfileModal from "../../components/modal/PropertyManagerProfileModal";
// SUPPLIER TEMPORARILY DISABLED — uncomment to re-enable
// import SupplierProfileModal from "../../components/modal/SupplierProfileModal";

function MessagesEntrepreneurNew() {
  const { t, language } = useLanguage();
  const { socket } = useSocket();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [userFilter, setUserFilter] = useState("all"); // "all", "property_manager", "supplier", "entrepreneur"
  const [showJobInfo, setShowJobInfo] = useState(false); // Toggle for job/bid info dropdown
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Property Manager Profile Modal states
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [selectedManagerProfile, setSelectedManagerProfile] = useState(null);
  const [isLoadingManagerProfile, setIsLoadingManagerProfile] = useState(false);

  // SUPPLIER TEMPORARILY DISABLED — uncomment to re-enable
  // const [showSupplierModal, setShowSupplierModal] = useState(false);
  // const [selectedSupplierProfile, setSelectedSupplierProfile] = useState(null);
  // const [isLoadingSupplierProfile, setIsLoadingSupplierProfile] = useState(false);

  const currentUserId = localStorage.getItem("userId");
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await getConversations();
      if (response.success) {
        setConversations(response.conversations || []);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize conversation from SubmittedBids page (when entrepreneur clicks message)
  useEffect(() => {
    const initializeConversation = async () => {
      const targetReceiverId = localStorage.getItem("targetReceiverId");
      const targetReceiverName = localStorage.getItem("targetReceiverName");
      const targetJobId = localStorage.getItem("targetJobId");
      const targetConversationId = localStorage.getItem("targetConversationId");

      if (targetReceiverId && conversations.length > 0) {
        console.log("🔍 Checking for existing conversation with:", targetReceiverId);
        console.log("📋 Available conversations:", conversations.map(c => ({ id: c.id, other_user_id: c.other_user_id })));

        // First, check if we have a specific conversation ID to navigate to
        let existingConv = null;

        if (targetConversationId) {
          existingConv = conversations.find(
            (conv) => String(conv.id) === String(targetConversationId)
          );
          console.log("🎯 Looking for conversation ID:", targetConversationId, "Found:", existingConv?.id);
        }

        // If no specific conversation found, try to find by receiver ID (with type conversion)
        if (!existingConv) {
          existingConv = conversations.find(
            (conv) => String(conv.other_user_id) === String(targetReceiverId)
          );
          console.log("🔍 Looking for receiver ID:", targetReceiverId, "Found:", existingConv?.id);
        }

        if (existingConv) {
          console.log("✅ Found existing conversation:", existingConv.id);
          setSelectedChat(existingConv);
          setShowMobileChat(true);
        } else {
          console.log("🆕 Creating temporary conversation object");
          // Create temporary conversation (will be created when first message is sent)
          const newConv = {
            id: null, // Will be created when first message is sent
            other_user_id: targetReceiverId,
            other_user_name: targetReceiverName || "Property Manager",
            other_user_role: "property_manager",
            last_message: null,
            last_message_time: new Date().toISOString(),
            unread_count: 0,
            job_id: targetJobId || null,
          };
          setSelectedChat(newConv);
          setShowMobileChat(true);
        }

        // Clean up localStorage
        localStorage.removeItem("targetReceiverId");
        localStorage.removeItem("targetReceiverName");
        localStorage.removeItem("targetJobId");
        localStorage.removeItem("targetConversationId");
      }
    };
    initializeConversation();
  }, [conversations]);

  // Load messages when chat selected (null-safe)
  useEffect(() => {
    if (selectedChat) {
      // Only load messages if conversation exists (not a new conversation)
      if (selectedChat.id) {
        loadMessages(selectedChat.id);
        markConversationAsRead(selectedChat.id);

        // Join the conversation room for real-time updates
        if (socket) {
          console.log('🔗 Joining conversation room:', selectedChat.id);
          socket.emit('join_conversation', selectedChat.id);
        }
      } else {
        console.log('🆕 New conversation selected - no messages to load yet');
        setMessages([]);
      }
    }

    return () => {
      // Leave conversation room when unmounting or switching chats
      if (selectedChat?.id && socket) {
        console.log('👋 Leaving conversation room:', selectedChat.id);
        socket.emit('leave_conversation', selectedChat.id);
      }
    };
  }, [selectedChat, socket]);

  const loadMessages = async (conversationId) => {
    try {
      const response = await getMessages(conversationId);
      if (response.success) {
        setMessages(response.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      console.log("📬 Received new_message event:", data);
      const { message: newMsg, conversationId } = data;

      if (selectedChat?.id === conversationId) {
        console.log("✅ Adding message to current chat");
        setMessages((prev) => {
          // Avoid duplicates by checking if message already exists
          const exists = prev.some(m => m.id === newMsg.id);
          if (exists) {
            console.log("⚠️ Message already exists, skipping");
            return prev;
          }
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 100);
      }

      // Always reload conversations to update preview and unread count
      loadConversations();
    };

    socket.on("new_message", handleNewMessage);
    return () => socket.off("new_message", handleNewMessage);
  }, [socket, selectedChat]);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("📷 Attempting to upload image:", file.name);

    if (!file.type.startsWith("image/")) {
      toast.error(t('messages.selectImageFile'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('messages.imageTooLarge'));
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const userProfile = localStorage.getItem("userProfile");
      if (!userProfile) {
        toast.error(t('messages.mustBeLoggedIn'));
        return;
      }

      const token = JSON.parse(userProfile)?.token;
      if (!token) {
        toast.error(t('messages.authTokenNotFound'));
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      console.log("📤 Uploading to:", `${API_BASE_URL}/api/messages/upload-attachment`);

      const response = await fetch(
        `${API_BASE_URL}/api/messages/upload-attachment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      console.log("📥 Upload response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Upload failed:", errorText);
        toast.error(t('messages.failedUploadImage'));
        return;
      }

      const data = await response.json();
      console.log("✅ Upload response:", data);

      if (data.success) {
        setUploadedImage(data.file);
        console.log("✅ Image uploaded successfully:", data.file);
      } else {
        toast.error(data.message || t('messages.failedUploadImage'));
      }
    } catch (error) {
      console.error("❌ Image upload error:", error);
      toast.error(t('messages.failedUploadImage'));
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("📎 Attempting to upload file:", file.name);

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('messages.fileTooLarge'));
      return;
    }

    setIsUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const userProfile = localStorage.getItem("userProfile");
      if (!userProfile) {
        toast.error(t('messages.mustBeLoggedIn'));
        return;
      }

      const token = JSON.parse(userProfile)?.token;
      if (!token) {
        toast.error(t('messages.authTokenNotFound'));
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      console.log("📤 Uploading to:", `${API_BASE_URL}/api/messages/upload-attachment`);

      const response = await fetch(
        `${API_BASE_URL}/api/messages/upload-attachment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      console.log("📥 Upload response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Upload failed:", errorText);
        toast.error(t('messages.failedUploadFile'));
        return;
      }

      const data = await response.json();
      console.log("✅ Upload response:", data);

      if (data.success) {
        setUploadedFiles((prev) => [...prev, data.file]);
        console.log("✅ File uploaded successfully:", data.file);
      } else {
        toast.error(data.message || t('messages.failedUploadFile'));
      }
    } catch (error) {
      console.error("❌ File upload error:", error);
      toast.error(t('messages.failedUploadFile'));
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Send message via HTTP API (fallback when socket not connected)
  const sendMessageViaAPI = async (messageData) => {
    const userProfile = localStorage.getItem("userProfile");
    if (!userProfile) {
      throw new Error("You must be logged in to send messages");
    }

    const token = JSON.parse(userProfile)?.token;
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiverId: messageData.receiverId,
        content: messageData.content,
        jobId: messageData.jobId,
        imageUrl: messageData.imageUrl,
        attachments: messageData.attachments,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send message');
    }

    return await response.json();
  };

  // Send message
  const handleSend = async () => {
    if (!message.trim() && !uploadedImage && uploadedFiles.length === 0) return;
    if (!selectedChat) return;
    if (isSending) return;

    setIsSending(true);

    try {
      const messageData = {
        conversationId: selectedChat.id || null, // null for new conversations
        receiverId: selectedChat.other_user_id,
        content: message.trim(),
        imageUrl: uploadedImage?.url || null,
        attachments: uploadedFiles.length > 0 ? uploadedFiles : null,
        jobId: selectedChat.job_id || null, // Include job_id for proper conversation association
      };

      console.log("📤 Sending message:", messageData);

      // Check socket connection - use HTTP API as fallback
      if (!socket || !socket.connected) {
        console.log("⚠️ Socket not connected, using HTTP API fallback");

        try {
          const response = await sendMessageViaAPI(messageData);
          console.log("✅ Message sent via HTTP API:", response);

          // If this was a new conversation, update the selectedChat
          if (!selectedChat.id && response.conversationId) {
            console.log("🆕 Updating conversation ID:", response.conversationId);
            setSelectedChat(prev => ({
              ...prev,
              id: response.conversationId
            }));
            loadConversations();
          }

          // Clear inputs
          setMessage("");
          setUploadedImage(null);
          setUploadedFiles([]);

          // Reload messages to show the new one
          if (selectedChat.id || response.conversationId) {
            loadMessages(selectedChat.id || response.conversationId);
          }
        } catch (apiError) {
          console.error("❌ HTTP API error:", apiError);
          toast.error(apiError.message || "Failed to send message");
        }

        setIsSending(false);
        return;
      }

      // Track retry attempts for authorization errors
      let retryCount = 0;
      const maxRetries = 2;

      // Set up error handler with retry logic for authorization errors
      const errorHandler = async (error) => {
        console.error("❌ Message send error:", error);
        console.error("Full error object:", JSON.stringify(error, null, 2));
        const errorMessage = error?.message || "Failed to send message";
        const errorDetails = error?.details || error?.error;

        // Check if it's an authorization error and we haven't exhausted retries
        const isAuthError = errorMessage.toLowerCase().includes('not authorized') ||
                           errorMessage.toLowerCase().includes('approved bid');

        if (isAuthError && retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Authorization error - retrying (${retryCount}/${maxRetries}) after 1 second...`);

          // Wait 1 second and retry
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Re-emit the message
          socket.once("error", errorHandler);
          socket.once("message_sent", successHandler);
          socket.emit("send_message", messageData);
          return;
        }

        const fullMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
        toast.error(fullMessage);
        setIsSending(false);
      };

      // Set up success handler
      const successHandler = (data) => {
        console.log("✅ Message sent successfully:", data);

        // If this was a new conversation, update the selectedChat with the new conversation ID
        if (!selectedChat.id && data.message?.conversation_id) {
          console.log("🆕 Updating conversation ID:", data.message.conversation_id);
          setSelectedChat(prev => ({
            ...prev,
            id: data.message.conversation_id
          }));
          // Reload conversations to get the new one in the list
          loadConversations();
        }

        socket.off("error", errorHandler);
        socket.off("message_sent", successHandler);
      };

      // Listen for errors and success
      socket.once("error", errorHandler);
      socket.once("message_sent", successHandler);

      // Send the message
      socket.emit("send_message", messageData);

      // Clear inputs immediately for better UX
      setMessage("");
      setUploadedImage(null);
      setUploadedFiles([]);

      // Auto-remove listeners after 5 seconds
      setTimeout(() => {
        socket.off("error", errorHandler);
        socket.off("message_sent", successHandler);
      }, 5000);
    } catch (error) {
      console.error("❌ Send error:", error);
      toast.error(t('messages.failedSendMessage'));
    } finally {
      setTimeout(() => setIsSending(false), 500);
    }
  };

  // Filter conversations by search term and user type
  const filteredConversations = conversations.filter((conv) => {
    // SUPPLIER TEMPORARILY DISABLED — remove this line to re-enable
    if (conv.other_user_role === 'supplier') return false;
    const matchesSearch = conv.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = userFilter === "all" || conv.other_user_role === userFilter;
    return matchesSearch && matchesFilter;
  });

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';

    if (diff < 60000) return t('messages.justNow');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('time.minutesAgo')}`;
    if (diff < 86400000) return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  };

  // Format user role for display
  const formatUserRole = (role) => {
    if (!role) return t('messages.user');

    const roleMap = {
      'entrepreneur': t('nav.entrepreneur'),
      'property_manager': t('nav.propertyManager'),
      'resident': t('nav.resident'),
      // SUPPLIER TEMPORARILY DISABLED
      // 'supplier': t('nav.supplierRole')
    };

    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Get initials
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  // Fetch entrepreneur profile and show modal
  const handleViewEntrepreneurProfile = async (userId) => {
    if (!userId || isLoadingProfile) return;

    setIsLoadingProfile(true);
    try {
      const userProfile = localStorage.getItem("userProfile");
      if (!userProfile) return;

      const token = JSON.parse(userProfile)?.token;
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

      const response = await fetch(
        `${API_BASE_URL}/api/users/entrepreneur/user/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setSelectedProfile(data.profile);
      setShowProfileModal(true);
    } catch (error) {
      console.error("Error fetching entrepreneur profile:", error);
      toast.error(t('messages.failedLoadProfile'));
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Handle viewing property manager profile
  const handleViewManagerProfile = async (userId) => {
    if (!userId || isLoadingManagerProfile) return;

    setIsLoadingManagerProfile(true);
    try {
      const userProfile = localStorage.getItem("userProfile");
      if (!userProfile) return;

      const token = JSON.parse(userProfile)?.token;
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

      const response = await fetch(
        `${API_BASE_URL}/api/users/manager/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch manager profile");
      }

      const data = await response.json();
      setSelectedManagerProfile(data.profile);
      setShowManagerModal(true);
    } catch (error) {
      console.error("Error fetching manager profile:", error);
      toast.error(t('messages.failedLoadProfile'));
    } finally {
      setIsLoadingManagerProfile(false);
    }
  };

  // SUPPLIER TEMPORARILY DISABLED — uncomment to re-enable
  // const handleViewSupplierProfile = async (userId, userName) => {
  //   if (!userId || isLoadingSupplierProfile) return;
  //   setIsLoadingSupplierProfile(true);
  //   try {
  //     const userProfile = localStorage.getItem("userProfile");
  //     if (!userProfile) return;
  //     const token = JSON.parse(userProfile)?.token;
  //     const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  //     const response = await fetch(
  //       `${API_BASE_URL}/api/users/supplier/user/${userId}`,
  //       { method: "GET", headers: { Authorization: `Bearer ${token}` } }
  //     );
  //     if (!response.ok) throw new Error("Failed to fetch supplier profile");
  //     const data = await response.json();
  //     setSelectedSupplierProfile(data.profile);
  //     setShowSupplierModal(true);
  //   } catch (error) {
  //     console.error("Error fetching supplier profile:", error);
  //     toast.error(t('messages.failedLoadSupplierProfile'));
  //   } finally {
  //     setIsLoadingSupplierProfile(false);
  //   }
  // };

  return (
    <div className="messages-page-fullscreen">
      <Nav />
      <div className="messages-container">
        {/* SIDEBAR */}
        <div className={`messages-sidebar ${showMobileChat ? 'hide-mobile' : ''}`}>
          <div className="messages-sidebar-header">
            <h2>{t('messages.title')}</h2>
            <div className="messages-search">
              <Search size={16} className="messages-search-icon" />
              <input
                type="text"
                placeholder={t('messages.searchConversations')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Buttons */}
            <div className="messages-filter-buttons">
              <button
                className={`filter-bubble-btn ${userFilter === "all" ? "active" : ""}`}
                onClick={() => setUserFilter("all")}
              >
                {t('messages.all')}
              </button>
              <button
                className={`filter-bubble-btn ${userFilter === "property_manager" ? "active" : ""}`}
                onClick={() => setUserFilter("property_manager")}
              >
                {t('nav.propertyManager')}
              </button>
              {/* SUPPLIER TEMPORARILY DISABLED — uncomment to re-enable */}
              {/* <button
                className={`filter-bubble-btn ${userFilter === "supplier" ? "active" : ""}`}
                onClick={() => setUserFilter("supplier")}
              >
                {t('nav.supplierRole')}
              </button> */}
              {/* <button
                className={`filter-bubble-btn ${userFilter === "entrepreneur" ? "active" : ""}`}
                onClick={() => setUserFilter("entrepreneur")}
              >
                {t('nav.entrepreneur')}
              </button> */}
            </div>
          </div>

          <div className="messages-conversations">
            {isLoading ? (
              <div className="messages-loading">{t('messages.loading')}</div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>
                {t('messages.noConversationsFound')}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${selectedChat?.id === conv.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedChat(conv);
                    setShowMobileChat(true);
                  }}
                >
                  <div className="conversation-avatar">
                    {getInitials(conv.other_user_name)}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <span className="conversation-name">{conv.other_user_name}</span>
                      <span className="conversation-time">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="conversation-preview">
                      {conv.last_message || t('messages.noMessagesYet')}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="conversation-unread">{conv.unread_count}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className={`messages-chat ${showMobileChat ? 'show-mobile' : ''}`}>
          {!selectedChat ? (
            <div className="messages-chat-empty">
              <div className="messages-chat-empty-icon">
                <MessageSquare size={40} />
              </div>
              <h3>{t('messages.selectConversation')}</h3>
              <p>{t('messages.chooseConversation')}</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="messages-chat-header">
                <button
                  className="mobile-back-btn"
                  onClick={() => setShowMobileChat(false)}
                  title={t('messages.backToConversations')}
                >
                  <ArrowLeft size={24} />
                </button>
                <div
                  className={`chat-header-avatar ${['entrepreneur', 'property_manager'].includes(selectedChat.other_user_role) /* SUPPLIER TEMPORARILY DISABLED — was: includes 'supplier' */ ? 'clickable' : ''}`}
                  onClick={() => {
                    if (selectedChat.other_user_role === 'entrepreneur') {
                      handleViewEntrepreneurProfile(selectedChat.other_user_id);
                    } else if (selectedChat.other_user_role === 'property_manager') {
                      handleViewManagerProfile(selectedChat.other_user_id);
                    // SUPPLIER TEMPORARILY DISABLED
                    // } else if (selectedChat.other_user_role === 'supplier') {
                    //   handleViewSupplierProfile(selectedChat.other_user_id, selectedChat.other_user_name);
                    }
                  }}
                  title={['entrepreneur', 'property_manager'].includes(selectedChat.other_user_role) /* SUPPLIER TEMPORARILY DISABLED — was: includes 'supplier' */ ? t('messages.viewProfile') : ''}
                >
                  {getInitials(selectedChat.other_user_name)}
                </div>
                <div className="chat-header-info">
                  <h3
                    className={`chat-header-name ${['entrepreneur', 'property_manager'].includes(selectedChat.other_user_role) /* SUPPLIER TEMPORARILY DISABLED — was: includes 'supplier' */ ? 'clickable' : ''}`}
                    onClick={() => {
                      if (selectedChat.other_user_role === 'entrepreneur') {
                        handleViewEntrepreneurProfile(selectedChat.other_user_id);
                      } else if (selectedChat.other_user_role === 'property_manager') {
                        handleViewManagerProfile(selectedChat.other_user_id);
                      } else if (selectedChat.other_user_role === 'supplier') {
                        handleViewSupplierProfile(selectedChat.other_user_id, selectedChat.other_user_name);
                      }
                    }}
                    title={['entrepreneur', 'property_manager'].includes(selectedChat.other_user_role) /* SUPPLIER TEMPORARILY DISABLED — was: includes 'supplier' */ ? t('messages.viewProfile') : ''}
                  >
                    {selectedChat.other_user_name}
                  </h3>
                  <p className="chat-header-role">
                    {formatUserRole(selectedChat.other_user_role)}
                  </p>
                </div>
                <button className="chat-header-call-btn" title={t('messages.call')}>
                  <Phone size={20} />
                </button>
              </div>

              {/* Job/Bid Information Dropdown */}
              {selectedChat.job_id ? (
                <div className="job-info-container">
                  <button
                    className="job-info-toggle"
                    onClick={() => setShowJobInfo(!showJobInfo)}
                  >
                    <div className="job-info-preview">
                      <Briefcase size={16} />
                      <span className="job-info-title">
                        {selectedChat.job_title || t('messages.jobDetails')}
                      </span>
                      {selectedChat.bid_status && (
                        <span className={`job-info-badge ${selectedChat.bid_status}`}>
                          {selectedChat.bid_status}
                        </span>
                      )}
                    </div>
                    {showJobInfo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {showJobInfo && (
                    <div className="job-info-details">
                      {/* Job Information */}
                      <div className="job-info-section">
                        <h4 className="job-info-section-title">{t('messages.jobDetails')}</h4>
                        <div className="job-info-grid">
                          {selectedChat.job_category && (
                            <div className="job-info-item">
                              <Briefcase size={14} />
                              <span className="job-info-label">{t('messages.category')}</span>
                              <span className="job-info-value">{selectedChat.job_category}</span>
                            </div>
                          )}
                          {selectedChat.job_budget_min && selectedChat.job_budget_max && (
                            <div className="job-info-item">
                              <DollarSign size={14} />
                              <span className="job-info-label">{t('messages.budget')}</span>
                              <span className="job-info-value">
                                ${selectedChat.job_budget_min} - ${selectedChat.job_budget_max}
                              </span>
                            </div>
                          )}
                          {selectedChat.job_due_date && (
                            <div className="job-info-item">
                              <Calendar size={14} />
                              <span className="job-info-label">{t('messages.dueDate')}</span>
                              <span className="job-info-value">
                                {new Date(selectedChat.job_due_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                              </span>
                            </div>
                          )}
                          {(selectedChat.job_property_address || selectedChat.job_city) && (
                            <div className="job-info-item">
                              <MapPin size={14} />
                              <span className="job-info-label">{t('messages.location')}</span>
                              <span className="job-info-value">
                                {selectedChat.job_property_address}
                                {selectedChat.job_city && `, ${selectedChat.job_city}`}
                              </span>
                            </div>
                          )}
                        </div>
                        {selectedChat.job_description && (
                          <div className="job-info-description">
                            <p className="job-info-label">{t('messages.description')}</p>
                            <p className="job-info-value">{selectedChat.job_description}</p>
                          </div>
                        )}
                      </div>

                      {/* Bid Information */}
                      {selectedChat.bid_id && (
                        <div className="job-info-section">
                          <h4 className="job-info-section-title">{t('messages.approvedBid')}</h4>
                          <div className="job-info-grid">
                            <div className="job-info-item">
                              <DollarSign size={14} />
                              <span className="job-info-label">{t('messages.bidAmount')}</span>
                              <span className="job-info-value bid-amount">
                                ${selectedChat.bid_amount}
                              </span>
                            </div>
                            <div className="job-info-item">
                              <Calendar size={14} />
                              <span className="job-info-label">{t('messages.submitted')}</span>
                              <span className="job-info-value">
                                {new Date(selectedChat.bid_created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                              </span>
                            </div>
                          </div>
                          {selectedChat.bid_message && (
                            <div className="job-info-description">
                              <p className="job-info-label">{t('messages.proposal')}</p>
                              <p className="job-info-value">{selectedChat.bid_message}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                selectedChat.other_user_role === 'property_manager' && (
                  <div className="job-info-container job-info-none">
                    <div className="job-info-message">
                      <Briefcase size={16} />
                      <span>{t('messages.generalConversation')}</span>
                    </div>
                  </div>
                )
              )}

              {/* Messages */}
              <div className="messages-chat-messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-group ${msg.sender_id === currentUserId ? "sent" : "received"}`}
                  >
                    <div className="message-bubble">
                      {msg.content && <p className="message-text">{msg.content}</p>}
                      {msg.image_url && (
                        <img
                          src={msg.image_url}
                          alt="attachment"
                          className="message-image"
                          onClick={() => window.open(msg.image_url, "_blank")}
                        />
                      )}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="message-attachments">
                          {msg.attachments.map((file, idx) => (
                            <div
                              key={idx}
                              className="message-attachment"
                              onClick={() => window.open(file.url, "_blank")}
                            >
                              <File size={16} />
                              <span>{file.fileName}</span>
                              <Download size={14} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="message-time">{formatTime(msg.created_at)}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="messages-chat-input">
                <div className="chat-input-container">
                  <div className="chat-input-wrapper">
                    {/* Attachment Previews */}
                    {(uploadedImage || uploadedFiles.length > 0) && (
                      <div className="chat-input-attachments">
                        {uploadedImage && (
                          <div className="attachment-preview">
                            <ImageIcon size={16} />
                            <span>{uploadedImage.fileName}</span>
                            <X
                              size={16}
                              className="attachment-preview-remove"
                              onClick={() => setUploadedImage(null)}
                            />
                          </div>
                        )}
                        {uploadedFiles.map((file, idx) => (
                          <div key={idx} className="attachment-preview">
                            <File size={16} />
                            <span>{file.fileName}</span>
                            <X
                              size={16}
                              className="attachment-preview-remove"
                              onClick={() =>
                                setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input Row */}
                    <div className="chat-input-main">
                      <div className="chat-input-actions">
                        <input
                          type="file"
                          ref={imageInputRef}
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: "none" }}
                        />
                        <button
                          className="chat-input-btn"
                          onClick={() => imageInputRef.current?.click()}
                          title={t('messages.uploadImage')}
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
                          style={{ display: "none" }}
                        />
                        <button
                          className="chat-input-btn"
                          onClick={() => fileInputRef.current?.click()}
                          title={t('messages.attachFile')}
                          disabled={isUploadingFile}
                        >
                          {isUploadingFile ? (
                            <Loader2 size={20} className="spinning" />
                          ) : (
                            <Paperclip size={20} />
                          )}
                        </button>
                      </div>

                      <textarea
                        className="chat-input-field"
                        placeholder={t('messages.typeMessage')}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        rows={1}
                      />

                      <button
                        className="chat-input-btn chat-send-btn"
                        onClick={handleSend}
                        disabled={isSending || (!message.trim() && !uploadedImage && uploadedFiles.length === 0)}
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Entrepreneur Profile Modal */}
      <EntrepreneurProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={selectedProfile}
      />

      {/* Property Manager Profile Modal */}
      <PropertyManagerProfileModal
        isOpen={showManagerModal}
        onClose={() => setShowManagerModal(false)}
        profile={selectedManagerProfile}
      />

      {/* SUPPLIER TEMPORARILY DISABLED — uncomment to re-enable */}
      {/* <SupplierProfileModal
        isOpen={showSupplierModal}
        onClose={() => {
          setShowSupplierModal(false);
          setSelectedSupplierProfile(null);
        }}
        profile={selectedSupplierProfile}
      /> */}
    </div>
  );
}

export default MessagesEntrepreneurNew;
