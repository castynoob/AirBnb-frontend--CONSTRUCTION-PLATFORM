import React, { useState } from "react";
import Nav from "../../components/Nav";
import "../../styles/message.css";
import { MessageSquare, Users, Briefcase, Send, PhoneCall, Lock, Search } from "lucide-react";

function Messages() {
  const [activeTab, setActiveTab] = useState("residents");
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const residents = [
    { 
      id: 1,
      name: "Sarah Johnson", 
      apt: "Unit 204", 
      lastMessage: "Thanks for fixing the elevator!",
      time: "2:30 PM",
      unread: 0
    },
    { 
      id: 2, 
      name: "James Lee", 
      apt: "Unit 305", 
      lastMessage: "There's a water leak in the kitchen.",
      time: "1:15 PM",
      unread: 2
    },
    { 
      id: 3, 
      name: "Maria Chen", 
      apt: "Unit 102", 
      lastMessage: "Can I schedule an inspection?",
      time: "Yesterday",
      unread: 0
    },
  ];

  const entrepreneurs = [
    { 
      id: 1, 
      name: "BuildRight Contractors", 
      status: "accepted", 
      lastMessage: "We'll start Monday.",
      time: "3:45 PM",
      unread: 1
    },
    { 
      id: 2, 
      name: "FixPro Plumbing", 
      status: "pending", 
      lastMessage: "Awaiting approval...",
      time: "12:00 PM",
      unread: 0
    },
    { 
      id: 3, 
      name: "Skyline Roofing", 
      status: "accepted", 
      lastMessage: "Materials are being delivered.",
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

  const filteredChats = (activeTab === "residents" ? residents : entrepreneurs).filter(
    chat => chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="homepage">
      <Nav />

      <div className="main-container">
        <header className="page-header">
          <h1>Messages</h1>
          <p>Communicate with residents and contractors.</p>
        </header>

        <div className="tabs-section">
          <button
            className={activeTab === "residents" ? "tab-btn active" : "tab-btn"}
            onClick={() => {
              setActiveTab("residents");
              setSelectedChat(null);
            }}
          >
            <Users size={18} />
            <span>Residents</span>
          </button>
          <button
            className={activeTab === "entrepreneurs" ? "tab-btn active" : "tab-btn"}
            onClick={() => {
              setActiveTab("entrepreneurs");
              setSelectedChat(null);
            }}
          >
            <Briefcase size={18} />
            <span>Entrepreneurs</span>
          </button>
        </div>

        <div className="messages-layout">
          {/* Sidebar Chat List */}
          <aside className="chat-sidebar">
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
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-item ${selectedChat?.id === chat.id ? "active" : ""} ${
                    chat.status === "pending" ? "restricted" : ""
                  }`}
                  onClick={() => chat.status !== "pending" && setSelectedChat(chat)}
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
                      {chat.status === "pending" && (
                        <Lock size={14} className="lock-icon" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredChats.length === 0 && (
                <div className="no-results">
                  <p>No conversations found</p>
                </div>
              )}
            </div>
          </aside>

          {/* Chat Window */}
          <section className="chat-window">
            {selectedChat ? (
              <>
                <div className="chat-header">
                  <div className="header-info">
                    <div className="header-avatar">
                      {selectedChat.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="header-name">{selectedChat.name}</h3>
                      {selectedChat.apt && (
                        <p className="header-subtitle">{selectedChat.apt}</p>
                      )}
                      {selectedChat.status && (
                        <span className={`header-status ${selectedChat.status}`}>
                          {selectedChat.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {activeTab === "entrepreneurs" && selectedChat.status === "accepted" && (
                    <button className="contact-btn">
                      <PhoneCall size={16} />
                      <span>Contact</span>
                    </button>
                  )}
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
                </div>

                <div className="chat-input-area">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    className="message-input"
                  />
                  <button onClick={handleSend} className="send-btn">
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