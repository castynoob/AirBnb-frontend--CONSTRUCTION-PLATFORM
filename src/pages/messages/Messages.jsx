import React, { useState, useEffect, useRef } from "react";
import Nav from "../../components/Nav";
import "../../styles/manager/message.css";
import {
  MessageSquare,
  Users,
  User,
  Briefcase,
  Send,
  PhoneCall,
  Lock,
  Search,
  UserPlus,
  X,
  ArrowLeft,
} from "lucide-react";
import { useSocket } from "../../contexts/SocketContext";
import {
  getConversations,
  getMessages,
  markConversationAsRead,
  getUnreadCount,
  sendMessage,
} from "../../utils/api";

function Messages() {
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState("residents");
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [showMobileChatWindow, setShowMobileChatWindow] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [allConversations, setAllConversations] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserId = localStorage.getItem("userId");

  // ✅ Added ref for auto-scroll
  const messagesEndRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  // Scroll instantly when a new chat opens
  useEffect(() => {
    if (selectedChat) scrollToBottom(false);
  }, [selectedChat]);

  // Scroll smoothly when new messages arrive
  useEffect(() => {
    scrollToBottom(true);
  }, [conversation]);

  const residents = [];
  const personal = [];
  const communities = [];

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} days ago`;
    }
  };

  const entrepreneurs = allConversations.map((conv) => ({
    id: conv.id,
    name: conv.other_user_name,
    status: "accepted",
    lastMessage: conv.last_message || "No messages yet",
    time: formatTime(conv.last_message_at),
    unread: conv.unread_count || 0,
    other_user_id: conv.other_user_id,
  }));

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await getConversations();
      if (data.success) setAllConversations(data.conversations);
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      await getUnreadCount();
    } catch (err) {
      console.error("Error loading unread count:", err);
    }
  };

  // Socket.io Real-time logic
  useEffect(() => {
    if (!socket) return;

    socket.on("new_message", ({ message: newMsg, conversationId }) => {
      console.log("📨 New message received:", newMsg);
      if (selectedChat?.id === conversationId) {
        setConversation((prev) => {
          const exists = prev.some((msg) => msg.id === newMsg.id);
          if (exists) return prev;
          return [
            ...prev,
            {
              id: newMsg.id,
              text: newMsg.content,
              type: newMsg.sender_id === currentUserId ? "sent" : "received",
              time: formatTime(newMsg.created_at),
            },
          ];
        });
        if (newMsg.sender_id !== currentUserId) {
          socket.emit("mark_as_read", { conversationId });
        }
      }
      loadConversations();
      setIsSending(false);
    });

    socket.on("message_sent", ({ message: sentMsg, conversationId }) => {
      console.log("✅ Message sent successfully:", sentMsg);
      if (selectedChat?.id === conversationId) {
        setConversation((prev) => {
          const exists = prev.some((msg) => msg.id === sentMsg.id);
          if (exists) return prev;
          return [
            ...prev,
            {
              id: sentMsg.id,
              text: sentMsg.content,
              type: "sent",
              time: formatTime(sentMsg.created_at),
            },
          ];
        });
      }
      setIsSending(false);
      loadConversations();
    });

    socket.on("message_notification", () => loadConversations());

    socket.on("error", ({ message: errorMsg }) => {
      console.error("Socket error:", errorMsg);
      setIsSending(false);
      alert(`Error: ${errorMsg}`);
    });

    return () => {
      socket.off("new_message");
      socket.off("message_sent");
      socket.off("message_notification");
      socket.off("error");
    };
  }, [socket, selectedChat, currentUserId]);

  const handleSend = async () => {
    if (!message.trim() || !selectedChat || isSending) return;

    const messageContent = message.trim();
    setMessage("");
    setIsSending(true);

    try {
      if (socket && socket.connected) {
        socket.emit("send_message", {
          receiverId: selectedChat.other_user_id,
          content: messageContent,
          conversationId: selectedChat.id,
        });
      } else {
        await sendViaHTTP(messageContent);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setIsSending(false);
      setMessage(messageContent);
      alert("Failed to send message. Please try again.");
    }
  };

  const sendViaHTTP = async (messageContent) => {
    try {
      const data = await sendMessage(
        selectedChat.other_user_id,
        messageContent,
        selectedChat.job_id || null
      );
      if (data.success) {
        setConversation((prev) => [
          ...prev,
          {
            id: data.message.id,
            text: data.message.content,
            type: "sent",
            time: formatTime(data.message.created_at),
          },
        ]);
        setIsSending(false);
        loadConversations();
      }
    } catch (err) {
      console.error("HTTP send failed:", err);
      throw err;
    }
  };

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) return;
    alert(`Invitation sent to ${newMemberEmail}`);
    setNewMemberEmail("");
    setShowAddMember(false);
  };

  const handleChatClick = async (chat) => {
    if (chat.status === "pending") return;

    setSelectedChat(chat);
    setShowMobileChatWindow(true);
    socket?.emit("join_conversation", chat.id);

    try {
      const data = await getMessages(chat.id);
      if (data.success) {
        const formattedMessages = data.messages.map((msg) => ({
          id: msg.id,
          text: msg.content,
          type: msg.sender_id === currentUserId ? "sent" : "received",
          time: formatTime(msg.created_at),
        }));
        setConversation(formattedMessages);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }

    try {
      await markConversationAsRead(chat.id);
      socket?.emit("mark_as_read", { conversationId: chat.id });
      loadConversations();
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const handleBackToList = () => setShowMobileChatWindow(false);

  const getCurrentChats = () => {
    if (activeTab === "residents") return residents;
    if (activeTab === "personal") return personal;
    if (activeTab === "community") return communities;
    return entrepreneurs;
  };

  const filteredChats = getCurrentChats().filter((chat) =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="messages-page-fullscreen">
      <Nav />
      <div className="messages-container-fullscreen main-container">
        <div className="messages-header-bar">
          <h1>Messages</h1>
          <div className="tabs-section">
            {["residents", "personal", "community", "entrepreneurs"].map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "tab-btn active" : "tab-btn"}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedChat(null);
                  setShowMobileChatWindow(false);
                }}
              >
                {tab === "residents" && <Users size={18} />}
                {tab === "personal" && <User size={18} />}
                {tab === "community" && <Users size={18} />}
                {tab === "entrepreneurs" && <Briefcase size={18} />}
                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="messages-layout">
          <aside className={`chat-sidebar ${showMobileChatWindow ? "mobile-hidden" : ""}`}>
            <div className="sidebar-search">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="chat-list">
              {isLoading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
                  Loading conversations...
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="no-results">
                  <p>No conversations found</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-item ${selectedChat?.id === chat.id ? "active" : ""} ${
                      chat.status === "pending" ? "restricted" : ""
                    }`}
                    onClick={() => handleChatClick(chat)}
                  >
                    <div className="chat-avatar">
                      <div className="avatar-circle">
                        {chat.name.charAt(0).toUpperCase()}
                      </div>
                      {chat.unread > 0 && <span className="unread-badge">{chat.unread}</span>}
                    </div>
                    <div className="chat-info">
                      <div className="chat-top">
                        <h4 className="chat-name">{chat.name}</h4>
                        <span className="chat-time">{chat.time}</span>
                      </div>
                      <div className="chat-bottom">
                        <p className="chat-preview">{chat.lastMessage}</p>
                        {chat.status === "pending" && <Lock size={14} className="lock-icon" />}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* ✅ Chat window with scroll ref */}
          <section className={`chat-window ${showMobileChatWindow ? "mobile-show" : ""}`}>
            {selectedChat ? (
              <>
                <div className="chat-header manager">
                  <button className="mobile-back-btn" onClick={handleBackToList}>
                    <ArrowLeft size={20} />
                  </button>
                  <div className="chat-name-info">
                    <div className="header-avatar">
                      {selectedChat.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="header-name">{selectedChat.name}</h3>
                      {selectedChat.status && (
                        <span className={`header-status ${selectedChat.status}`}>
                          {selectedChat.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="header-actions">
                    {activeTab === "community" && (
                      <button
                        className="add-member-btn"
                        onClick={() => setShowAddMember(true)}
                      >
                        <UserPlus size={16} />
                        <span>Add Member</span>
                      </button>
                    )}
                    {activeTab === "entrepreneurs" && (
                      <button className="contact-btn">
                        <PhoneCall size={16} />
                        <span>Contact</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="chat-messages">
                  {conversation.map((msg) => (
                    <div key={msg.id} className={`message-wrapper ${msg.type}`}>
                      <div className="message-bubble">
                        <p className="message-text">{msg.text}</p>
                        <span className="message-time">{msg.time}</span>
                      </div>
                    </div>
                  ))}

                  {isSending && (
                    <div className="message-wrapper sent">
                      <div className="message-bubble" style={{ opacity: 0.6 }}>
                        <p className="message-text">Sending...</p>
                      </div>
                    </div>
                  )}

                  {/* 🔽 Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    className="message-input"
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSend}
                    className="send-btn"
                    disabled={isSending || !message.trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-chat">
                <MessageSquare size={64} className="empty-icon" />
                <h3>No conversation selected</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Messages;
