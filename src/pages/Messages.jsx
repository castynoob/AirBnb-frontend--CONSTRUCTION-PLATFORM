import React, { useState } from "react";
import Nav from "../components/Nav";
import "../styles/message.css";
import { MessageSquare, Users, Briefcase, Send, PhoneCall } from "lucide-react";

function Messages() {
  const [activeTab, setActiveTab] = useState("residents");
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");

  // Placeholder data
  const residents = [
    { id: 1, name: "Sarah Johnson", apt: "Unit 204", lastMessage: "Thanks for fixing the elevator!" },
    { id: 2, name: "James Lee", apt: "Unit 305", lastMessage: "There’s a water leak in the kitchen." },
    { id: 3, name: "Maria Chen", apt: "Unit 102", lastMessage: "Can I schedule an inspection?" },
  ];

  const entrepreneurs = [
    { id: 1, name: "BuildRight Contractors", status: "accepted", lastMessage: "We’ll start Monday." },
    { id: 2, name: "FixPro Plumbing", status: "pending", lastMessage: "Awaiting approval..." },
    { id: 3, name: "Skyline Roofing", status: "accepted", lastMessage: "Materials are being delivered." },
  ];

  const handleSend = () => {
    if (!message.trim()) return;
    alert(`Message sent to ${selectedChat.name}: "${message}"`);
    setMessage("");
  };

  return (
    <div className="homepage">
      <Nav />

      <div className="main-container">
        <header className="header">
          <h1 className="page-title">Messages</h1>
          <div className="tabs">
            <button
              className={activeTab === "residents" ? "tab active" : "tab"}
              onClick={() => {
                setActiveTab("residents");
                setSelectedChat(null);
              }}
            >
              <Users size={18} />
              Residents
            </button>
            <button
              className={activeTab === "entrepreneurs" ? "tab active" : "tab"}
              onClick={() => {
                setActiveTab("entrepreneurs");
                setSelectedChat(null);
              }}
            >
              <Briefcase size={18} />
              Entrepreneurs
            </button>
          </div>
        </header>

        <div className="messages-container">
          {/* Sidebar Chat List */}
          <aside className="chat-list">
            <div className="chat-section-title">
              {activeTab === "residents" ? "Residents" : "Entrepreneurs"}
            </div>

            {(activeTab === "residents" ? residents : entrepreneurs).map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${selectedChat?.id === chat.id ? "active" : ""} ${
                  chat.status === "pending" ? "disabled" : ""
                }`}
                onClick={() => chat.status !== "pending" && setSelectedChat(chat)}
              >
                <div className="chat-avatar">
                  <div className="avatar-circle">
                    {chat.name[0]}
                  </div>
                </div>

                <div className="chat-preview">
                  <h4>{chat.name}</h4>
                  <p>{chat.lastMessage}</p>
                </div>

                {chat.status === "pending" && (
                  <span className="restricted-tag">Restricted</span>
                )}
              </div>
            ))}
          </aside>

          {/* Chat Window */}
          <section className="chat-window">
            {selectedChat ? (
              <>
                <div className="chat-header">
                  <div>
                    <h3>{selectedChat.name}</h3>
                    {selectedChat.apt && (
                      <small className="chat-subtitle">{selectedChat.apt}</small>
                    )}
                  </div>

                  {activeTab === "entrepreneurs" && selectedChat.status === "accepted" && (
                    <button className="contact-btn">
                      <PhoneCall size={16} /> Contact
                    </button>
                  )}
                </div>

                <div className="chat-messages">
                  <div className="message received">Hi there! How can I help?</div>
                  <div className="message sent">Just checking on progress.</div>
                </div>

                <div className="chat-input">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button onClick={handleSend} className="send-btn">
                    <Send size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="no-chat">
                <MessageSquare size={48} />
                <p>Select a chat to start messaging</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Messages;
