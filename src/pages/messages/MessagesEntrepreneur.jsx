import React, { useState, useEffect, useRef } from "react";
import Nav from "../../components/Nav";
import "../../styles/entrepreneur/messagesentrepreneur.css";
import { MessageSquare, Users, User, Send, PhoneCall, Search, ArrowLeft } from "lucide-react";
import { useSocket } from "../../contexts/SocketContext";
import { getConversations, getMessages, markConversationAsRead, getUnreadCount } from "../../utils/api";

function MessagesEntrepreneur() {
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState("property-manager");
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileChatWindow, setShowMobileChatWindow] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Real data
  const [allConversations, setAllConversations] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserId = localStorage.getItem("userId");

  // 🔽 Added scroll ref
  const messagesEndRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  // ⬇️ Scroll instantly when opening chat
  useEffect(() => {
    if (selectedChat) scrollToBottom(false);
  }, [selectedChat]);

  // ⬇️ Scroll smoothly on new messages
  useEffect(() => {
    scrollToBottom(true);
  }, [conversation]);

  const personal = [];

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

  const propertyManagers = allConversations.map((conv) => ({
    id: conv.id,
    name: conv.other_user_name,
    property: "Building",
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

      if (data.success) {
        setAllConversations(data.conversations);
      }
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

    socket.on("message_notification", () => {
      loadConversations();
    });

    socket.on("error", ({ message: errorMsg }) => {
      console.error("Socket error:", errorMsg);
      setIsSending(false);

      if (errorMsg.includes("approved bid") || errorMsg.includes("authorized")) {
        alert("🔒 You need an approved bid to message this property manager.");
      } else {
        alert(`Error: ${errorMsg}`);
      }
    });

    return () => {
      socket.off("new_message");
      socket.off("message_sent");
      socket.off("message_notification");
      socket.off("error");
    };
  }, [socket, selectedChat, currentUserId]);

  const handleSend = async () => {
    if (!message.trim() || !selectedChat || !socket || isSending) return;

    const messageData = {
      receiverId: selectedChat.other_user_id,
      content: message.trim(),
      conversationId: selectedChat.id,
    };

    try {
      setIsSending(true);
      socket.emit("send_message", messageData);
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setIsSending(false);
    }
  };

  const handleChatClick = async (chat) => {
    setSelectedChat(chat);
    setShowMobileChatWindow(true);

    if (socket) {
      socket.emit("join_conversation", chat.id);
    }

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
      if (socket) {
        socket.emit("mark_as_read", { conversationId: chat.id });
      }
      loadConversations();
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const handleBackToList = () => {
    setShowMobileChatWindow(false);
  };

  const getCurrentChats = () => {
    if (activeTab === "property-manager") return propertyManagers;
    return personal;
  };

  const filteredChats = getCurrentChats().filter((chat) =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="messages-entrepreneur-page-fullscreen">
      <Nav />

      <div className="messages-entrepreneur-container-fullscreen main-container">
        <div className="messages-entrepreneur-header-bar">
          <h1>Messages</h1>
          <div className="tabs-section-entrepreneur">
            <button
              className={
                activeTab === "property-manager"
                  ? "tab-btn-entrepreneur active"
                  : "tab-btn-entrepreneur"
              }
              onClick={() => {
                setActiveTab("property-manager");
                setSelectedChat(null);
                setShowMobileChatWindow(false);
              }}
            >
              <Users size={18} />
              <span>Property Managers</span>
            </button>
            <button
              className={
                activeTab === "personal"
                  ? "tab-btn-entrepreneur active"
                  : "tab-btn-entrepreneur"
              }
              onClick={() => {
                setActiveTab("personal");
                setSelectedChat(null);
                setShowMobileChatWindow(false);
              }}
            >
              <User size={18} />
              <span>Personal</span>
            </button>
          </div>
        </div>

        <div className="messages-entrepreneur-layout">
          <aside
            className={`chat-sidebar-entrepreneur ${
              showMobileChatWindow ? "mobile-hidden" : ""
            }`}
          >
            <div className="sidebar-search-entrepreneur">
              <Search size={16} className="search-icon-entrepreneur" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-entrepreneur"
              />
            </div>

            <div className="chat-list-entrepreneur">
              {isLoading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
                  Loading conversations...
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="no-results-entrepreneur">
                  <p>No conversations found</p>
                  {activeTab === "property-manager" && (
                    <small
                      style={{
                        display: "block",
                        marginTop: "8px",
                        fontSize: "12px",
                        color: "#999",
                      }}
                    >
                      After a property manager approves your bid, you can message them here
                    </small>
                  )}
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-item-entrepreneur ${
                      selectedChat?.id === chat.id ? "active" : ""
                    }`}
                    onClick={() => handleChatClick(chat)}
                  >
                    <div className="chat-avatar-entrepreneur">
                      <div className="avatar-circle-entrepreneur">
                        {chat.name.charAt(0).toUpperCase()}
                      </div>
                      {chat.unread > 0 && (
                        <span className="unread-badge-entrepreneur">{chat.unread}</span>
                      )}
                    </div>

                    <div className="chat-info-entrepreneur">
                      <div className="chat-top-entrepreneur">
                        <h4 className="chat-name-entrepreneur">{chat.name}</h4>
                        <span className="chat-time-entrepreneur">{chat.time}</span>
                      </div>
                      <div className="chat-bottom-entrepreneur">
                        <p className="chat-preview-entrepreneur">{chat.lastMessage}</p>
                      </div>
                      {chat.property && (
                        <p className="chat-property-entrepreneur">{chat.property}</p>
                      )}
                      {chat.role && (
                        <p className="chat-role-entrepreneur">{chat.role}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          <section
            className={`chat-window-entrepreneur ${
              showMobileChatWindow ? "mobile-show" : ""
            }`}
          >
            {selectedChat ? (
              <>
                <div className="chat-header-entrepreneur">
                  <div className="header-info-entrepreneur">
                    <button
                      className="mobile-back-btn-entrepreneur"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="header-avatar-entrepreneur">
                      {selectedChat.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="header-name-entrepreneur">{selectedChat.name}</h3>
                      {selectedChat.property && (
                        <p className="header-subtitle-entrepreneur">
                          {selectedChat.property}
                        </p>
                      )}
                      {selectedChat.role && (
                        <p className="header-subtitle-entrepreneur">
                          {selectedChat.role}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="header-actions-entrepreneur">
                    <button className="contact-btn-entrepreneur">
                      <PhoneCall size={16} />
                      <span>Contact</span>
                    </button>
                  </div>
                </div>

                <div className="chat-messages-entrepreneur">
                  {conversation.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message-wrapper-entrepreneur ${msg.type}`}
                    >
                      <div className="message-bubble-entrepreneur">
                        <p className="message-text-entrepreneur">{msg.text}</p>
                        <span className="message-time-entrepreneur">{msg.time}</span>
                      </div>
                    </div>
                  ))}

                  {isSending && (
                    <div className="message-wrapper-entrepreneur sent">
                      <div
                        className="message-bubble-entrepreneur"
                        style={{ opacity: 0.6 }}
                      >
                        <p className="message-text-entrepreneur">Sending...</p>
                      </div>
                    </div>
                  )}

                  {/* 🔽 Added scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area-entrepreneur">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    className="message-input-entrepreneur"
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSend}
                    className="send-btn-entrepreneur"
                    disabled={isSending || !message.trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-chat-entrepreneur">
                <MessageSquare size={64} className="empty-icon-entrepreneur" />
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

export default MessagesEntrepreneur;
