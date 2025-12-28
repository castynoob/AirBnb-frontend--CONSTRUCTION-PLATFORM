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
  Users,
} from "lucide-react";
import { useSocket } from "../../contexts/SocketContext";
import {
  getConversations,
  getMessages,
  markConversationAsRead,
} from "../../utils/api";
import toast from "react-hot-toast";
import EntrepreneurProfileModal from "../../components/modal/EntrepreneurProfileModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function MessagesNew() {
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState("dm"); // "dm" or "group"
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedGroupChat, setSelectedGroupChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [userFilter, setUserFilter] = useState("all"); // "all", "resident", "entrepreneur"
  const [showJobInfo, setShowJobInfo] = useState(false); // Toggle for job/bid info dropdown
  const [isLoadingJobInfo, setIsLoadingJobInfo] = useState(false); // Loading state for job details
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const currentUserId = localStorage.getItem("userId");
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helper to get auth token
  const getAuthToken = () => {
    const userProfile = localStorage.getItem("userProfile");
    if (!userProfile) return null;
    return JSON.parse(userProfile)?.token;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversations and group chats
  useEffect(() => {
    loadConversations();
    loadGroupChats();
  }, []);

  // Handle initialization from Submissions page (when property manager clicks message button)
  useEffect(() => {
    const initializeConversation = async () => {
      const targetReceiverId = localStorage.getItem("targetReceiverId");
      const targetReceiverName = localStorage.getItem("targetReceiverName");
      const targetJobId = localStorage.getItem("targetJobId");
      const targetCompanyName = localStorage.getItem("targetCompanyName");

      if (targetReceiverId) {
        console.log("🎯 Initializing conversation with:", targetReceiverId, "for job:", targetJobId);

        // Check if conversation already exists for this specific user AND job
        let existingConv = null;

        if (targetJobId) {
          // First try to find conversation with matching job_id
          existingConv = conversations.find(
            (conv) => conv.other_user_id === targetReceiverId && String(conv.job_id) === String(targetJobId)
          );
        }

        // If no job-specific conversation found, look for any conversation with this user
        if (!existingConv) {
          existingConv = conversations.find(
            (conv) => conv.other_user_id === targetReceiverId
          );
        }

        if (existingConv) {
          console.log("✅ Found existing conversation:", existingConv.id, "with job_id:", existingConv.job_id);
          // If existing conv doesn't have job_id but we have targetJobId, add it
          // Also add company_name if provided
          const convWithJob = {
            ...existingConv,
            job_id: existingConv.job_id || targetJobId,
            company_name: existingConv.company_name || targetCompanyName,
          };
          setSelectedChat(convWithJob);
          setShowMobileChat(true);
        } else {
          console.log("🆕 Creating new conversation");
          // Create a temporary conversation object
          const newConv = {
            id: null, // Will be created when first message is sent
            other_user_id: targetReceiverId, // Keep as string (UUID)
            other_user_name: targetReceiverName || "Entrepreneur",
            other_user_role: "entrepreneur",
            company_name: targetCompanyName || null,
            last_message: null,
            last_message_time: new Date().toISOString(),
            unread_count: 0,
            job_id: targetJobId || null,
          };
          setSelectedChat(newConv);
          setShowMobileChat(true);
        }

        // Clear localStorage after initialization
        localStorage.removeItem("targetReceiverId");
        localStorage.removeItem("targetReceiverName");
        localStorage.removeItem("targetJobId");
        localStorage.removeItem("targetCompanyName");
      }
    };

    initializeConversation();
  }, [conversations]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);

      // All conversations (both resident and entrepreneur) are now in the unified conversations table
      const response = await getConversations();

      if (response.success) {
        console.log(`📋 Loaded ${response.conversations?.length || 0} conversations`);
        setConversations(response.conversations || []);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load group chats for property manager
  const loadGroupChats = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/residents/group-chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log(`🏢 Loaded ${data.group_chats?.length || 0} group chats`);
          setGroupChats(data.group_chats || []);
        }
      }
    } catch (error) {
      console.error("Error loading group chats:", error);
    }
  };

  // Load group chat messages
  const loadGroupChatMessages = async (chatId) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/residents/group-chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.messages || []);
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (error) {
      console.error("Error loading group chat messages:", error);
    }
  };

  // Send group chat message
  const sendGroupMessage = async () => {
    if (!message.trim() || !selectedGroupChat) return;
    if (isSending) return;

    setIsSending(true);

    try {
      const token = getAuthToken();
      if (!token) {
        alert("Please log in to send messages");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/residents/group-chats/${selectedGroupChat.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: message.trim(),
            message_type: 'text'
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Add message to list
          const newMsg = data.message || {
            id: `temp-${Date.now()}`,
            content: message.trim(),
            sender_id: currentUserId,
            created_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, newMsg]);
          setMessage("");
          setTimeout(scrollToBottom, 100);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending group message:", error);
      alert("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Handle group chat selection
  const selectGroupChat = async (chat) => {
    setSelectedGroupChat(chat);
    setSelectedChat(null);
    setMessages([]);
    setShowMobileChat(true);

    // Load messages
    await loadGroupChatMessages(chat.id);

    // Join socket room
    if (socket) {
      socket.emit('join_group_chat', chat.id);
    }
  };

  // Switch between tabs
  const switchTab = (tab) => {
    setActiveTab(tab);
    setSelectedChat(null);
    setSelectedGroupChat(null);
    setMessages([]);
  };

  // Fetch job details and bid info for a conversation if missing
  const fetchJobDetails = async (jobId, otherUserId) => {
    try {
      const token = getAuthToken();
      if (!token) return null;

      // Fetch job details directly from jobs endpoint
      const jobResponse = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let jobDetails = {};
      if (jobResponse.ok) {
        const data = await jobResponse.json();
        jobDetails = {
          job_title: data.title,
          job_category: data.category,
          job_description: data.description,
          job_budget_min: data.budget_min,
          job_budget_max: data.budget_max,
          job_due_date: data.due_date,
          job_property_address: data.property_address,
          job_city: data.city,
        };
      }

      // Also fetch the bid for this job by this entrepreneur
      if (otherUserId) {
        try {
          const bidsResponse = await fetch(`${API_BASE_URL}/api/bids/job/${jobId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (bidsResponse.ok) {
            const bidsData = await bidsResponse.json();
            // Find the bid from the entrepreneur we're chatting with
            const relevantBid = bidsData.bids?.find(bid =>
              bid.entrepreneur_id === otherUserId || bid.user_id === otherUserId
            );

            if (relevantBid) {
              jobDetails.bid_id = relevantBid.id;
              jobDetails.bid_amount = relevantBid.amount || relevantBid.bid_amount;
              jobDetails.bid_message = relevantBid.message || relevantBid.bid_message;
              jobDetails.bid_status = relevantBid.status;
              jobDetails.bid_created_at = relevantBid.created_at;
            }
          }
        } catch (bidError) {
          console.error("Error fetching bid details:", bidError);
        }
      }

      return Object.keys(jobDetails).length > 0 ? jobDetails : null;
    } catch (error) {
      console.error("Error fetching job details:", error);
      return null;
    }
  };

  // Load messages when chat selected
  useEffect(() => {
    if (selectedChat) {
      // If conversation has job_id but missing job details, fetch them (works for both new and existing conversations)
      if (selectedChat.job_id && !selectedChat.job_title) {
        console.log('📋 Fetching job details for job_id:', selectedChat.job_id, 'other_user_id:', selectedChat.other_user_id);
        setIsLoadingJobInfo(true);
        fetchJobDetails(selectedChat.job_id, selectedChat.other_user_id).then(jobDetails => {
          if (jobDetails) {
            setSelectedChat(prev => ({
              ...prev,
              ...jobDetails
            }));
          }
          setIsLoadingJobInfo(false);
        }).catch(() => {
          setIsLoadingJobInfo(false);
        });
      }

      // All conversations now use the unified messages table
      if (selectedChat.id) {
        loadMessages(selectedChat.id);
        markConversationAsRead(selectedChat.id);

        // Join the conversation room for real-time updates
        if (socket) {
          console.log('🔗 Joining conversation room:', selectedChat.id);
          socket.emit('join_conversation', selectedChat.id);
        }
      } else {
        // New conversation - no messages yet
        console.log('🆕 New conversation selected - no messages to load yet');
        setMessages([]);
      }
    }

    return () => {
      // Leave conversation room when unmounting or switching chats
      if (selectedChat && socket) {
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

  // Socket listeners - All messages now use the unified new_message event
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      console.log("📬 Received new_message event:", data);
      const { message: newMsg, conversationId } = data;

      // Ignore messages sent by current user - they are already added via message_sent event
      if (newMsg.sender_id === currentUserId) {
        console.log("⚠️ Ignoring own message (already handled via message_sent)");
        // Still reload conversations to update the list
        loadConversations();
        return;
      }

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

    // Handle new group messages
    const handleNewGroupMessage = (msg) => {
      console.log("📬 Received new_group_message:", msg);

      if (selectedGroupChat?.id === (msg.group_chat_id || msg.groupChatId)) {
        setMessages((prev) => {
          const exists = prev.some(m => m.id === msg.id);
          if (exists) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 100);
      }

      // Reload group chats to update unread count
      loadGroupChats();
    };

    socket.on("new_group_message", handleNewGroupMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("new_group_message", handleNewGroupMessage);
    };
  }, [socket, selectedChat, selectedGroupChat]);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("📷 Attempting to upload image:", file.name);

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be less than 10MB");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const userProfile = localStorage.getItem("userProfile");
      if (!userProfile) {
        alert("You must be logged in to upload files");
        return;
      }

      const token = JSON.parse(userProfile)?.token;
      if (!token) {
        alert("Authentication token not found. Please log in again.");
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
        alert(`Failed to upload image: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log("✅ Upload response:", data);

      if (data.success) {
        setUploadedImage(data.file);
        console.log("✅ Image uploaded successfully:", data.file);
      } else {
        alert(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("❌ Image upload error:", error);
      alert(`Failed to upload image: ${error.message}`);
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
      alert("File must be less than 10MB");
      return;
    }

    setIsUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const userProfile = localStorage.getItem("userProfile");
      if (!userProfile) {
        alert("You must be logged in to upload files");
        return;
      }

      const token = JSON.parse(userProfile)?.token;
      if (!token) {
        alert("Authentication token not found. Please log in again.");
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
        alert(`Failed to upload file: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log("✅ Upload response:", data);

      if (data.success) {
        setUploadedFiles((prev) => [...prev, data.file]);
        console.log("✅ File uploaded successfully:", data.file);
      } else {
        alert(data.message || "Failed to upload file");
      }
    } catch (error) {
      console.error("❌ File upload error:", error);
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Send message - All messages now use the unified socket messaging
  const handleSend = async () => {
    if (!message.trim() && !uploadedImage && uploadedFiles.length === 0) return;
    if (!selectedChat) return;
    if (isSending) return;

    // Check socket connection
    if (!socket || !socket.connected) {
      console.error("❌ Socket not connected");
      console.log("Socket status:", { socket: !!socket, isConnected, connected: socket?.connected });
      alert("Connection lost. Please check your internet connection and refresh the page.");
      return;
    }

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

        const fullMessage = errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage;
        alert(fullMessage);
        setIsSending(false);
      };

      // Set up success handler
      const successHandler = (data) => {
        console.log("✅ Message sent successfully:", data);

        // Add the sent message to the messages list
        if (data.message) {
          const sentMessage = {
            ...data.message,
            sender_id: currentUserId,
            receiver_id: selectedChat.other_user_id,
          };
          setMessages((prev) => {
            // Avoid duplicates
            const exists = prev.some(m => m.id === sentMessage.id);
            if (exists) return prev;
            return [...prev, sentMessage];
          });
          setTimeout(scrollToBottom, 100);
        }

        // If this was a new conversation, update the selectedChat with the new conversation ID
        if (!selectedChat.id && data.message?.conversation_id) {
          console.log("🆕 Updating conversation ID:", data.message.conversation_id);
          setSelectedChat(prev => ({
            ...prev,
            id: data.message.conversation_id
          }));
        }

        // Reload conversations to update the list with latest message
        loadConversations();

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
      alert("Failed to send message. Please try again.");
    } finally {
      setTimeout(() => setIsSending(false), 500);
    }
  };

  // Filter conversations by search term and user type
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = userFilter === "all" || conv.other_user_role === userFilter;
    return matchesSearch && matchesFilter;
  });

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Format user role for display
  const formatUserRole = (role) => {
    if (!role) return "User";

    const roleMap = {
      'entrepreneur': 'Entrepreneur',
      'property_manager': 'Property Manager',
      'resident': 'Resident',
      'supplier': 'Supplier'
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
      const token = getAuthToken();
      if (!token) return;

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
      toast.error("Failed to load profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  return (
    <div className="messages-page-fullscreen">
      <Nav />
      <div className="messages-container">
        {/* SIDEBAR */}
        <div className={`messages-sidebar ${showMobileChat ? 'hide-mobile' : ''}`}>
          <div className="messages-sidebar-header">
            <h2>Messages</h2>

            {/* Tab Buttons */}
            <div className="messages-tab-buttons">
              <button
                className={`tab-btn ${activeTab === "dm" ? "active" : ""}`}
                onClick={() => switchTab("dm")}
              >
                <MessageSquare size={16} />
                Direct Messages
              </button>
              <button
                className={`tab-btn ${activeTab === "group" ? "active" : ""}`}
                onClick={() => switchTab("group")}
              >
                <Users size={16} />
                Group Chats
              </button>
            </div>

            <div className="messages-search">
              <Search size={16} className="messages-search-icon" />
              <input
                type="text"
                placeholder={activeTab === "dm" ? "Search conversations..." : "Search group chats..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Buttons - Only show for DM tab */}
            {activeTab === "dm" && (
              <div className="messages-filter-buttons">
                <button
                  className={`filter-bubble-btn ${userFilter === "all" ? "active" : ""}`}
                  onClick={() => setUserFilter("all")}
                >
                  All
                </button>
                <button
                  className={`filter-bubble-btn ${userFilter === "resident" ? "active" : ""}`}
                  onClick={() => setUserFilter("resident")}
                >
                  Resident
                </button>
                <button
                  className={`filter-bubble-btn ${userFilter === "entrepreneur" ? "active" : ""}`}
                  onClick={() => setUserFilter("entrepreneur")}
                >
                  Entrepreneur
                </button>
              </div>
            )}
          </div>

          <div className="messages-conversations">
            {isLoading ? (
              <div className="messages-loading">Loading...</div>
            ) : activeTab === "dm" ? (
              /* Direct Messages List */
              filteredConversations.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>
                  No conversations found
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${selectedChat?.id === conv.id ? "active" : ""}`}
                    onClick={() => {
                      setSelectedChat(conv);
                      setSelectedGroupChat(null);
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
                        {conv.last_message || "No messages yet"}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="conversation-unread">{conv.unread_count}</span>
                    )}
                  </div>
                ))
              )
            ) : (
              /* Group Chats List */
              groupChats.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>
                  No group chats found
                </div>
              ) : (
                groupChats
                  .filter(chat => chat.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((chat) => (
                    <div
                      key={chat.id}
                      className={`conversation-item ${selectedGroupChat?.id === chat.id ? "active" : ""}`}
                      onClick={() => selectGroupChat(chat)}
                    >
                      <div className="conversation-avatar group-avatar">
                        <Users size={20} />
                      </div>
                      <div className="conversation-info">
                        <div className="conversation-header">
                          <span className="conversation-name">{chat.name}</span>
                          <span className="conversation-time">
                            {chat.last_message_at ? formatTime(chat.last_message_at) : ""}
                          </span>
                        </div>
                        <p className="conversation-preview">
                          {chat.description || `${chat.member_count || 0} members`}
                        </p>
                      </div>
                      {chat.unread_count > 0 && (
                        <span className="conversation-unread">{chat.unread_count}</span>
                      )}
                    </div>
                  ))
              )
            )}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className={`messages-chat ${showMobileChat ? 'show-mobile' : ''}`}>
          {!selectedChat && !selectedGroupChat ? (
            <div className="messages-chat-empty">
              <div className="messages-chat-empty-icon">
                {activeTab === "dm" ? <MessageSquare size={40} /> : <Users size={40} />}
              </div>
              <h3>Select a {activeTab === "dm" ? "conversation" : "group chat"}</h3>
              <p>Choose a {activeTab === "dm" ? "conversation" : "group chat"} from the sidebar to start messaging</p>
            </div>
          ) : selectedGroupChat ? (
            /* GROUP CHAT VIEW */
            <>
              {/* Group Chat Header */}
              <div className="messages-chat-header">
                <button
                  className="mobile-back-btn"
                  onClick={() => {
                    setShowMobileChat(false);
                    setSelectedGroupChat(null);
                  }}
                  title="Back to group chats"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="chat-header-avatar group-avatar">
                  <Users size={24} />
                </div>
                <div className="chat-header-info">
                  <h3 className="chat-header-name">{selectedGroupChat.name}</h3>
                  <p className="chat-header-role">
                    {selectedGroupChat.member_count || 0} members
                  </p>
                </div>
              </div>

              {/* Group Chat Messages */}
              <div className="messages-chat-messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-group ${msg.sender_id === currentUserId ? "sent" : "received"}`}
                  >
                    {msg.sender_id !== currentUserId && (
                      <div className="message-sender-name">{msg.sender_name || "Unknown"}</div>
                    )}
                    <div className="message-bubble">
                      {(msg.content || msg.message_text) && (
                        <p className="message-text">{msg.content || msg.message_text}</p>
                      )}
                    </div>
                    <div className="message-time">{formatTime(msg.created_at)}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Group Chat Input */}
              <div className="messages-chat-input">
                <div className="chat-input-container">
                  <div className="chat-input-wrapper">
                    <div className="chat-input-main">
                      <textarea
                        className="chat-input-field"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendGroupMessage();
                          }
                        }}
                        rows={1}
                      />
                      <button
                        className="chat-input-btn chat-send-btn"
                        onClick={sendGroupMessage}
                        disabled={isSending || !message.trim()}
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Chat Header */}
              <div className="messages-chat-header">
                <button
                  className="mobile-back-btn"
                  onClick={() => setShowMobileChat(false)}
                  title="Back to conversations"
                >
                  <ArrowLeft size={24} />
                </button>
                <div
                  className={`chat-header-avatar ${selectedChat.other_user_role === 'entrepreneur' ? 'clickable' : ''}`}
                  onClick={() => {
                    if (selectedChat.other_user_role === 'entrepreneur') {
                      handleViewEntrepreneurProfile(selectedChat.other_user_id);
                    }
                  }}
                  title={selectedChat.other_user_role === 'entrepreneur' ? 'View profile' : ''}
                >
                  {getInitials(selectedChat.other_user_name)}
                </div>
                <div className="chat-header-info">
                  <h3
                    className={`chat-header-name ${selectedChat.other_user_role === 'entrepreneur' ? 'clickable' : ''}`}
                    onClick={() => {
                      if (selectedChat.other_user_role === 'entrepreneur') {
                        handleViewEntrepreneurProfile(selectedChat.other_user_id);
                      }
                    }}
                    title={selectedChat.other_user_role === 'entrepreneur' ? 'View profile' : ''}
                  >
                    {selectedChat.other_user_name}
                  </h3>
                  <p className="chat-header-role">
                    {selectedChat.company_name || formatUserRole(selectedChat.other_user_role)}
                  </p>
                </div>
                <button className="chat-header-call-btn" title="Call">
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
                        {isLoadingJobInfo ? "Loading..." : (selectedChat.job_title || "Job Details")}
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
                      {isLoadingJobInfo ? (
                        <div className="job-info-loading">
                          <Loader2 size={20} className="spinning" />
                          <span>Loading job details...</span>
                        </div>
                      ) : (
                      <>
                      {/* Job Information */}
                      <div className="job-info-section">
                        <h4 className="job-info-section-title">Job Details</h4>
                        <div className="job-info-grid">
                          {selectedChat.job_category && (
                            <div className="job-info-item">
                              <Briefcase size={14} />
                              <span className="job-info-label">Category:</span>
                              <span className="job-info-value">{selectedChat.job_category}</span>
                            </div>
                          )}
                          {selectedChat.job_budget_min && selectedChat.job_budget_max && (
                            <div className="job-info-item">
                              <DollarSign size={14} />
                              <span className="job-info-label">Budget:</span>
                              <span className="job-info-value">
                                ${selectedChat.job_budget_min} - ${selectedChat.job_budget_max}
                              </span>
                            </div>
                          )}
                          {selectedChat.job_due_date && (
                            <div className="job-info-item">
                              <Calendar size={14} />
                              <span className="job-info-label">Due Date:</span>
                              <span className="job-info-value">
                                {new Date(selectedChat.job_due_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {(selectedChat.job_property_address || selectedChat.job_city) && (
                            <div className="job-info-item">
                              <MapPin size={14} />
                              <span className="job-info-label">Location:</span>
                              <span className="job-info-value">
                                {selectedChat.job_property_address}
                                {selectedChat.job_city && `, ${selectedChat.job_city}`}
                              </span>
                            </div>
                          )}
                        </div>
                        {selectedChat.job_description && (
                          <div className="job-info-description">
                            <p className="job-info-label">Description:</p>
                            <p className="job-info-value">{selectedChat.job_description}</p>
                          </div>
                        )}
                      </div>

                      {/* Bid Information */}
                      {selectedChat.bid_id && (
                        <div className="job-info-section">
                          <h4 className="job-info-section-title">Approved Bid</h4>
                          <div className="job-info-grid">
                            <div className="job-info-item">
                              <DollarSign size={14} />
                              <span className="job-info-label">Bid Amount:</span>
                              <span className="job-info-value bid-amount">
                                ${selectedChat.bid_amount}
                              </span>
                            </div>
                            <div className="job-info-item">
                              <Calendar size={14} />
                              <span className="job-info-label">Submitted:</span>
                              <span className="job-info-value">
                                {new Date(selectedChat.bid_created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {selectedChat.bid_message && (
                            <div className="job-info-description">
                              <p className="job-info-label">Proposal:</p>
                              <p className="job-info-value">{selectedChat.bid_message}</p>
                            </div>
                          )}
                        </div>
                      )}
                      </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                selectedChat.other_user_role === 'entrepreneur' && (
                  <div className="job-info-container job-info-none">
                    <div className="job-info-message">
                      <Briefcase size={16} />
                      <span>This is a general conversation (no job associated)</span>
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
                          title="Upload Image"
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
                          title="Attach File"
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
                        placeholder="Type a message..."
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
    </div>
  );
}

export default MessagesNew;
