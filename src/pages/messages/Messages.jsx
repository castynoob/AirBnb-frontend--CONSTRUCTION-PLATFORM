import React, { useState } from "react";
import Nav from "../../components/Nav";
import "../../styles/manager/message.css"
import { MessageSquare, Users, User, Briefcase, Send, PhoneCall, Lock, Search, UserPlus, X, ArrowLeft } from "lucide-react";

function Messages() {
  const [activeTab, setActiveTab] = useState("residents");
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [showMobileChatWindow, setShowMobileChatWindow] = useState(false);

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
    { 
      id: 4, 
      name: "Robert Williams", 
      apt: "Unit 501", 
      lastMessage: "Heating system working great now.",
      time: "2 days ago",
      unread: 0
    },
  ];

  const personal = [
    { 
      id: 1,
      name: "David Martinez", 
      role: "Building Manager", 
      lastMessage: "Meeting scheduled for tomorrow.",
      time: "3:15 PM",
      unread: 1
    },
    { 
      id: 2, 
      name: "Emily Chen", 
      role: "Maintenance Staff", 
      lastMessage: "All inspections complete.",
      time: "1:45 PM",
      unread: 0
    },
    { 
      id: 3, 
      name: "Michael Brown", 
      role: "Security Manager", 
      lastMessage: "Updated security protocols sent.",
      time: "Yesterday",
      unread: 0
    },
  ];

  const communities = [
    { 
      id: 1,
      name: "Building A Residents", 
      members: "24 members", 
      lastMessage: "Weekly maintenance scheduled for Friday.",
      time: "3:20 PM",
      unread: 3,
      membersList: ["Sarah Johnson", "James Lee", "Maria Chen", "Robert Williams"]
    },
    { 
      id: 2, 
      name: "Emergency Response Team", 
      members: "8 members", 
      lastMessage: "All clear on the elevator inspection.",
      time: "1:45 PM",
      unread: 0,
      membersList: ["David Martinez", "Emily Chen", "Michael Brown"]
    },
    { 
      id: 3, 
      name: "Rooftop Garden Committee", 
      members: "12 members", 
      lastMessage: "New plants arriving next week!",
      time: "Yesterday",
      unread: 1,
      membersList: ["Sarah Johnson", "Maria Chen"]
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
    { 
      id: 4, 
      name: "Elite HVAC Services", 
      status: "accepted", 
      lastMessage: "Annual maintenance complete.",
      time: "2 days ago",
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

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) return;
    console.log(`Adding member to ${selectedChat.name}: ${newMemberEmail}`);
    alert(`Invitation sent to ${newMemberEmail} to join ${selectedChat.name}!`);
    setNewMemberEmail("");
    setShowAddMember(false);
  };

  const handleChatClick = (chat) => {
    if (chat.status === "pending") return;
    setSelectedChat(chat);
    setShowMobileChatWindow(true);
  };

  const handleBackToList = () => {
    setShowMobileChatWindow(false);
  };

  const getCurrentChats = () => {
    if (activeTab === "residents") return residents;
    if (activeTab === "personal") return personal;
    if (activeTab === "community") return communities;
    return entrepreneurs;
  };

  const filteredChats = getCurrentChats().filter(
    chat => chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="messages-page-fullscreen">
      <Nav />

      <div className="messages-container-fullscreen main-container ">
        <div className="messages-header-bar">
          <h1>Messages</h1>
          <div className="tabs-section">
            <button
              className={activeTab === "residents" ? "tab-btn active" : "tab-btn"}
              onClick={() => {
                setActiveTab("residents");
                setSelectedChat(null);
                setShowMobileChatWindow(false);
              }}
            >
              <Users size={18} />
              <span>Residents</span>
            </button>
            <button
              className={activeTab === "personal" ? "tab-btn active" : "tab-btn"}
              onClick={() => {
                setActiveTab("personal");
                setSelectedChat(null);
                setShowMobileChatWindow(false);
              }}
            >
              <User size={18} />
              <span>Personal</span>
            </button>
            <button
              className={activeTab === "community" ? "tab-btn active" : "tab-btn"}
              onClick={() => {
                setActiveTab("community");
                setSelectedChat(null);
                setShowMobileChatWindow(false);
              }}
            >
              <Users size={18} />
              <span>Community</span>
            </button>
            <button
              className={activeTab === "entrepreneurs" ? "tab-btn active" : "tab-btn"}
              onClick={() => {
                setActiveTab("entrepreneurs");
                setSelectedChat(null);
                setShowMobileChatWindow(false);
              }}
            >
              <Briefcase size={18} />
              <span>Entrepreneurs</span>
            </button>
          </div>
        </div>

        <div className="messages-layout">
          {/* Sidebar Chat List */}
          <aside className={`chat-sidebar ${showMobileChatWindow ? 'mobile-hidden' : ''}`}>
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
                  className={`chat-item ${selectedChat?.id === chat.id && selectedChat?.name === chat.name ? "active" : ""} ${
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
                      {chat.status === "pending" && (
                        <Lock size={14} className="lock-icon" />
                      )}
                    </div>
                    {chat.members && (
                      <p className="chat-members">{chat.members}</p>
                    )}
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
          <section className={`chat-window ${showMobileChatWindow ? 'mobile-show' : ''}`}>
            {selectedChat ? (
              <>
                <div className="chat-header manager">
                    <button 
                      className="mobile-back-btn"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="chat-name-info">
                      <div className="header-avatar">
                        {selectedChat.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="header-name">{selectedChat.name}</h3>
                        {selectedChat.apt && (
                          <p className="header-subtitle">{selectedChat.apt}</p>
                        )}
                        {selectedChat.role && (
                          <p className="header-subtitle">{selectedChat.role}</p>
                        )}
                        {selectedChat.members && (
                          <p className="header-subtitle">{selectedChat.members}</p>
                        )}
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
                    {activeTab === "entrepreneurs" && selectedChat.status === "accepted" && (
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

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Member to {selectedChat?.name}</h2>
                <button 
                  className="modal-close-btn"
                  onClick={() => setShowAddMember(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                <p className="modal-description">
                  Enter the email address of the member you want to add to this community.
                </p>
                
                {selectedChat?.membersList && (
                  <div className="current-members">
                    <h4>Current Members:</h4>
                    <ul>
                      {selectedChat.membersList.map((member, index) => (
                        <li key={index}>{member}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="member-email">Member Email</label>
                  <input
                    id="member-email"
                    type="email"
                    placeholder="Enter email address..."
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="modal-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="modal-cancel-btn"
                  onClick={() => setShowAddMember(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-submit-btn"
                  onClick={handleAddMember}
                  disabled={!newMemberEmail.trim()}
                >
                  <UserPlus size={16} />
                  Add Member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;