import React, { useState } from "react";
import Nav from "../../components/Nav";
import "../../styles/entrepreneur/messagesentrepreneur.css"
import { MessageSquare, Users, User, Send, PhoneCall, Search, ArrowLeft } from "lucide-react";

function MessagesEntrepreneur() {
  const [activeTab, setActiveTab] = useState("property-manager");
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileChatWindow, setShowMobileChatWindow] = useState(false);

  const propertyManagers = [
    { 
      id: 1,
      name: "John Anderson", 
      property: "Building A", 
      lastMessage: "When can you start the roofing project?",
      time: "2:30 PM",
      unread: 2
    },
    { 
      id: 2, 
      name: "Lisa Martinez", 
      property: "Building B", 
      lastMessage: "The bid looks good. Let's proceed.",
      time: "1:15 PM",
      unread: 0
    },
    { 
      id: 3, 
      name: "David Chen", 
      property: "Building C", 
      lastMessage: "Can you send an updated quote?",
      time: "Yesterday",
      unread: 1
    },
    { 
      id: 4, 
      name: "Sarah Williams", 
      property: "Building D", 
      lastMessage: "Thank you for the quick response!",
      time: "2 days ago",
      unread: 0
    },
  ];

  const personal = [
    { 
      id: 1,
      name: "Mike Johnson", 
      role: "Business Partner", 
      lastMessage: "Let's review the contracts tomorrow.",
      time: "3:15 PM",
      unread: 1
    },
    { 
      id: 2, 
      name: "Emma Davis", 
      role: "Supplier", 
      lastMessage: "Materials will arrive on Monday.",
      time: "1:45 PM",
      unread: 0
    },
    { 
      id: 3, 
      name: "Robert Taylor", 
      role: "Accountant", 
      lastMessage: "Invoice has been processed.",
      time: "Yesterday",
      unread: 0
    },
  ];

  // Sample conversation
  const conversation = [
    { id: 1, text: "Hi there! How can I help?", type: "received", time: "2:25 PM" },
    { id: 2, text: "Just checking on progress.", type: "sent", time: "2:27 PM" },
    { id: 3, text: "Everything is on schedule. We'll have an update by tomorrow.", type: "received", time: "2:30 PM" },
  ];

  const handleSend = () => {
    if (!message.trim()) return;
    console.log(`Message sent to ${selectedChat.name}: "${message}"`);
    setMessage("");
  };

  const handleChatClick = (chat) => {
    setSelectedChat(chat);
    setShowMobileChatWindow(true);
  };

  const handleBackToList = () => {
    setShowMobileChatWindow(false);
  };

  const getCurrentChats = () => {
    if (activeTab === "property-manager") return propertyManagers;
    return personal;
  };

  const filteredChats = getCurrentChats().filter(
    chat => chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="messages-entrepreneur-page-fullscreen">
      <Nav />

      <div className="messages-entrepreneur-container-fullscreen main-container">
        <div className="messages-entrepreneur-header-bar">
          <h1>Messages</h1>
          <div className="tabs-section-entrepreneur">
            <button
              className={activeTab === "property-manager" ? "tab-btn-entrepreneur active" : "tab-btn-entrepreneur"}
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
              className={activeTab === "personal" ? "tab-btn-entrepreneur active" : "tab-btn-entrepreneur"}
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
          {/* Sidebar Chat List */}
          <aside className={`chat-sidebar-entrepreneur ${showMobileChatWindow ? 'mobile-hidden' : ''}`}>
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
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-item-entrepreneur ${selectedChat?.id === chat.id && selectedChat?.name === chat.name ? "active" : ""}`}
                  onClick={() => handleChatClick(chat)}
                >
                  <div className="chat-avatar-entrepreneur">
                    <div className="avatar-circle-entrepreneur">
                      {chat.name.charAt(0).toUpperCase()}
                    </div>
                    {chat.unread > 0 && <span className="unread-badge-entrepreneur">{chat.unread}</span>}
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
              ))}

              {filteredChats.length === 0 && (
                <div className="no-results-entrepreneur">
                  <p>No conversations found</p>
                </div>
              )}
            </div>
          </aside>

          {/* Chat Window */}
          <section className={`chat-window-entrepreneur ${showMobileChatWindow ? 'mobile-show' : ''}`}>
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
                        <p className="header-subtitle-entrepreneur">{selectedChat.property}</p>
                      )}
                      {selectedChat.role && (
                        <p className="header-subtitle-entrepreneur">{selectedChat.role}</p>
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
                    <div key={msg.id} className={`message-wrapper-entrepreneur ${msg.type}`}>
                      <div className="message-bubble-entrepreneur">
                        <p className="message-text-entrepreneur">{msg.text}</p>
                        <span className="message-time-entrepreneur">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="chat-input-area-entrepreneur">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    className="message-input-entrepreneur"
                  />
                  <button onClick={handleSend} className="send-btn-entrepreneur">
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