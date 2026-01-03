import { useState, useEffect, useCallback } from "react";
import {
  Headphones,
  Scale,
  MessageSquare,
  Settings,
  HelpCircle,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Send,
  Loader2,
  FileText,
  User,
  Briefcase,
  Eye,
} from "lucide-react";
import Nav from "../../components/Nav";
import "./customerservice.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Status colors
const getStatusColor = (status) => {
  const colors = {
    open: "warning",
    under_review: "info",
    resolved: "success",
    closed: "secondary",
    escalated: "danger",
    in_progress: "info",
    waiting_on_user: "warning",
  };
  return colors[status] || "secondary";
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Time ago
const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateString);
};

function CustomerService() {
  const [activeTab, setActiveTab] = useState("disputes");
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Disputes state
  const [disputes, setDisputes] = useState([]);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);

  // Support tickets state
  const [tickets, setTickets] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);

  // New dispute form
  const [disputeForm, setDisputeForm] = useState({
    type: "",
    reported_id: "",
    job_id: "",
    reason: "",
  });
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // New ticket form
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "other",
    priority: "medium",
    description: "",
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Reply form
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Jobs list for dispute form
  const [userJobs, setUserJobs] = useState([]);

  useEffect(() => {
    const profileString = localStorage.getItem("userProfile");
    if (profileString) {
      setUserProfile(JSON.parse(profileString));
    }
  }, []);

  // Fetch user's disputes
  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/disputes/my-disputes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
      }
    } catch (err) {
      console.error("Error fetching disputes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's support tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's jobs (for dispute form)
  const fetchUserJobs = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/jobs/my-jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUserJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "disputes") {
      fetchDisputes();
      fetchUserJobs();
    } else if (activeTab === "tickets") {
      fetchTickets();
    }
  }, [activeTab, fetchDisputes, fetchTickets, fetchUserJobs]);

  // Submit new dispute
  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    if (!disputeForm.type || !disputeForm.reason) return;

    try {
      setSubmittingDispute(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/disputes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(disputeForm),
      });

      if (response.ok) {
        setShowDisputeModal(false);
        setDisputeForm({ type: "", reported_id: "", job_id: "", reason: "" });
        fetchDisputes();
      }
    } catch (err) {
      console.error("Error submitting dispute:", err);
    } finally {
      setSubmittingDispute(false);
    }
  };

  // Submit new ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.description) return;

    try {
      setSubmittingTicket(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/support/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticketForm),
      });

      if (response.ok) {
        setShowTicketModal(false);
        setTicketForm({
          subject: "",
          category: "other",
          priority: "medium",
          description: "",
        });
        fetchTickets();
      }
    } catch (err) {
      console.error("Error submitting ticket:", err);
    } finally {
      setSubmittingTicket(false);
    }
  };

  // View ticket details and messages
  const handleViewTicket = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/support/tickets/${ticket.id}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTicketMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // Send reply to ticket
  const handleSendReply = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      setSendingMessage(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/support/tickets/${selectedTicket.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: newMessage }),
        }
      );

      if (response.ok) {
        setNewMessage("");
        handleViewTicket(selectedTicket);
      }
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const renderDisputes = () => (
    <div className="cs-section">
      <div className="cs-section-header">
        <h2>My Disputes</h2>
        <button
          className="cs-btn cs-btn-primary"
          onClick={() => setShowDisputeModal(true)}
        >
          <Plus size={16} />
          File a Dispute
        </button>
      </div>

      {loading ? (
        <div className="cs-loading">
          <Loader2 size={24} className="spin" />
          <span>Loading disputes...</span>
        </div>
      ) : disputes.length === 0 ? (
        <div className="cs-empty">
          <Scale size={48} />
          <h3>No Disputes Filed</h3>
          <p>You haven't filed any disputes yet.</p>
        </div>
      ) : (
        <div className="cs-list">
          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="cs-card"
              onClick={() => setSelectedDispute(dispute)}
            >
              <div className="cs-card-header">
                <span className="cs-card-number">#{dispute.dispute_number}</span>
                <span className={`cs-badge cs-badge-${getStatusColor(dispute.status)}`}>
                  {dispute.status?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="cs-card-body">
                <h4>{dispute.type?.replace(/_/g, " ")}</h4>
                <p>{dispute.reason?.substring(0, 100)}...</p>
              </div>
              <div className="cs-card-footer">
                <span className="cs-card-date">
                  <Clock size={14} />
                  {timeAgo(dispute.created_at)}
                </span>
                <ChevronRight size={18} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTickets = () => (
    <div className="cs-section">
      <div className="cs-section-header">
        <h2>Support Tickets</h2>
        <button
          className="cs-btn cs-btn-primary"
          onClick={() => setShowTicketModal(true)}
        >
          <Plus size={16} />
          New Ticket
        </button>
      </div>

      {loading ? (
        <div className="cs-loading">
          <Loader2 size={24} className="spin" />
          <span>Loading tickets...</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="cs-empty">
          <MessageSquare size={48} />
          <h3>No Support Tickets</h3>
          <p>You haven't created any support tickets yet.</p>
        </div>
      ) : (
        <div className="cs-list">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="cs-card"
              onClick={() => handleViewTicket(ticket)}
            >
              <div className="cs-card-header">
                <span className="cs-card-number">#{ticket.ticket_number}</span>
                <span className={`cs-badge cs-badge-${getStatusColor(ticket.status)}`}>
                  {ticket.status?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="cs-card-body">
                <h4>{ticket.subject}</h4>
                <p>{ticket.description?.substring(0, 100)}...</p>
              </div>
              <div className="cs-card-footer">
                <span className="cs-card-date">
                  <Clock size={14} />
                  {timeAgo(ticket.created_at)}
                </span>
                <ChevronRight size={18} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHelp = () => (
    <div className="cs-section">
      <div className="cs-section-header">
        <h2>Help & FAQ</h2>
      </div>

      <div className="cs-help-list">
        <div className="cs-help-item">
          <div className="cs-help-icon">
            <Scale size={20} />
          </div>
          <div className="cs-help-content">
            <h4>How do I file a dispute?</h4>
            <p>
              Go to the "Disputes" tab and click "File a Dispute". Select the type
              of dispute, provide details about the issue, and submit. Our team
              will review it within 24-48 hours.
            </p>
          </div>
        </div>

        <div className="cs-help-item">
          <div className="cs-help-icon">
            <MessageSquare size={20} />
          </div>
          <div className="cs-help-content">
            <h4>How do I contact support?</h4>
            <p>
              Create a support ticket in the "Support" tab. Describe your issue
              and our team will respond as soon as possible.
            </p>
          </div>
        </div>

        <div className="cs-help-item">
          <div className="cs-help-icon">
            <Settings size={20} />
          </div>
          <div className="cs-help-content">
            <h4>How do I update my profile?</h4>
            <p>
              Go to your Profile page and click "Edit Profile" to update your
              personal information, company details, and contact info.
            </p>
          </div>
        </div>

        <div className="cs-help-item">
          <div className="cs-help-icon">
            <Briefcase size={20} />
          </div>
          <div className="cs-help-content">
            <h4>What types of disputes can I file?</h4>
            <p>
              You can file disputes for: Job Quality issues, Payment problems,
              Non-delivery of services, Review disputes, and Contract violations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="cs-page">
      <Nav />
      <main className="cs-main">
        <div className="cs-container">
          {/* Header */}
          <div className="cs-header">
            <div className="cs-header-icon">
              <Headphones size={28} />
            </div>
            <div className="cs-header-text">
              <h1>Customer Service</h1>
              <p>Get help, file disputes, and contact support</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="cs-tabs">
            <button
              className={`cs-tab ${activeTab === "disputes" ? "active" : ""}`}
              onClick={() => setActiveTab("disputes")}
            >
              <Scale size={18} />
              <span>Disputes</span>
            </button>
            <button
              className={`cs-tab ${activeTab === "tickets" ? "active" : ""}`}
              onClick={() => setActiveTab("tickets")}
            >
              <MessageSquare size={18} />
              <span>Support</span>
            </button>
            <button
              className={`cs-tab ${activeTab === "help" ? "active" : ""}`}
              onClick={() => setActiveTab("help")}
            >
              <HelpCircle size={18} />
              <span>Help</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="cs-content">
            {activeTab === "disputes" && renderDisputes()}
            {activeTab === "tickets" && renderTickets()}
            {activeTab === "help" && renderHelp()}
          </div>
        </div>
      </main>

      {/* File Dispute Modal */}
      {showDisputeModal && (
        <div className="cs-modal-overlay" onClick={() => setShowDisputeModal(false)}>
          <div className="cs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cs-modal-header">
              <h3>
                <Scale size={20} />
                File a Dispute
              </h3>
              <button
                className="cs-modal-close"
                onClick={() => setShowDisputeModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitDispute}>
              <div className="cs-modal-body">
                <div className="cs-form-group">
                  <label>Dispute Type *</label>
                  <select
                    value={disputeForm.type}
                    onChange={(e) =>
                      setDisputeForm({ ...disputeForm, type: e.target.value })
                    }
                    required
                  >
                    <option value="">Select type...</option>
                    <option value="job_quality">Job Quality Issue</option>
                    <option value="payment">Payment Problem</option>
                    <option value="non_delivery">Non-Delivery</option>
                    <option value="review_dispute">Review Dispute</option>
                    <option value="contract_violation">Contract Violation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="cs-form-group">
                  <label>Related Job (Optional)</label>
                  <select
                    value={disputeForm.job_id}
                    onChange={(e) =>
                      setDisputeForm({ ...disputeForm, job_id: e.target.value })
                    }
                  >
                    <option value="">Select job...</option>
                    {userJobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cs-form-group">
                  <label>Describe the Issue *</label>
                  <textarea
                    value={disputeForm.reason}
                    onChange={(e) =>
                      setDisputeForm({ ...disputeForm, reason: e.target.value })
                    }
                    placeholder="Please describe the issue in detail..."
                    rows={5}
                    required
                  />
                </div>
              </div>
              <div className="cs-modal-footer">
                <button
                  type="button"
                  className="cs-btn cs-btn-secondary"
                  onClick={() => setShowDisputeModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cs-btn cs-btn-primary"
                  disabled={submittingDispute}
                >
                  {submittingDispute ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Dispute
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showTicketModal && (
        <div className="cs-modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="cs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cs-modal-header">
              <h3>
                <MessageSquare size={20} />
                Create Support Ticket
              </h3>
              <button
                className="cs-modal-close"
                onClick={() => setShowTicketModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitTicket}>
              <div className="cs-modal-body">
                <div className="cs-form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    value={ticketForm.subject}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, subject: e.target.value })
                    }
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div className="cs-form-row">
                  <div className="cs-form-group">
                    <label>Category</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, category: e.target.value })
                      }
                    >
                      <option value="technical">Technical Issue</option>
                      <option value="account">Account Problem</option>
                      <option value="payment">Payment & Billing</option>
                      <option value="job_issue">Job Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="cs-form-group">
                    <label>Priority</label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, priority: e.target.value })
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="cs-form-group">
                  <label>Description *</label>
                  <textarea
                    value={ticketForm.description}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, description: e.target.value })
                    }
                    placeholder="Please describe your issue in detail..."
                    rows={5}
                    required
                  />
                </div>
              </div>
              <div className="cs-modal-footer">
                <button
                  type="button"
                  className="cs-btn cs-btn-secondary"
                  onClick={() => setShowTicketModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cs-btn cs-btn-primary"
                  disabled={submittingTicket}
                >
                  {submittingTicket ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Create Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Dispute Modal */}
      {selectedDispute && (
        <div className="cs-modal-overlay" onClick={() => setSelectedDispute(null)}>
          <div className="cs-modal cs-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="cs-modal-header">
              <h3>
                <Scale size={20} />
                Dispute #{selectedDispute.dispute_number}
              </h3>
              <button
                className="cs-modal-close"
                onClick={() => setSelectedDispute(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="cs-modal-body">
              <div className="cs-detail-row">
                <span className="cs-detail-label">Status</span>
                <span className={`cs-badge cs-badge-${getStatusColor(selectedDispute.status)}`}>
                  {selectedDispute.status?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="cs-detail-row">
                <span className="cs-detail-label">Type</span>
                <span>{selectedDispute.type?.replace(/_/g, " ")}</span>
              </div>
              <div className="cs-detail-row">
                <span className="cs-detail-label">Created</span>
                <span>{formatDate(selectedDispute.created_at)}</span>
              </div>
              {selectedDispute.job_title && (
                <div className="cs-detail-row">
                  <span className="cs-detail-label">Related Job</span>
                  <span>{selectedDispute.job_title}</span>
                </div>
              )}
              <div className="cs-detail-section">
                <h4>Reason</h4>
                <p>{selectedDispute.reason}</p>
              </div>
              {selectedDispute.resolution && (
                <div className="cs-detail-section cs-resolution">
                  <h4>
                    <CheckCircle size={16} />
                    Resolution
                  </h4>
                  <p>{selectedDispute.resolution}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Ticket Modal */}
      {selectedTicket && (
        <div className="cs-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="cs-modal cs-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="cs-modal-header">
              <h3>
                <MessageSquare size={20} />
                Ticket #{selectedTicket.ticket_number}
              </h3>
              <button
                className="cs-modal-close"
                onClick={() => setSelectedTicket(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="cs-modal-body">
              <div className="cs-ticket-info">
                <h4>{selectedTicket.subject}</h4>
                <div className="cs-ticket-meta">
                  <span className={`cs-badge cs-badge-${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status?.replace(/_/g, " ")}
                  </span>
                  <span className="cs-ticket-date">{formatDate(selectedTicket.created_at)}</span>
                </div>
                <p className="cs-ticket-desc">{selectedTicket.description}</p>
              </div>

              <div className="cs-messages">
                <h4>Conversation</h4>
                <div className="cs-messages-list">
                  {ticketMessages.length === 0 ? (
                    <div className="cs-messages-empty">No messages yet</div>
                  ) : (
                    ticketMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`cs-message ${msg.sender_type === "user" ? "sent" : "received"}`}
                      >
                        <div className="cs-message-header">
                          <span>{msg.sender_type === "user" ? "You" : "Support"}</span>
                          <span>{timeAgo(msg.created_at)}</span>
                        </div>
                        <div className="cs-message-body">{msg.message}</div>
                      </div>
                    ))
                  )}
                </div>

                {selectedTicket.status !== "closed" && selectedTicket.status !== "resolved" && (
                  <div className="cs-reply-form">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                    />
                    <button
                      className="cs-btn cs-btn-primary"
                      onClick={handleSendReply}
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      {sendingMessage ? (
                        <Loader2 size={16} className="spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      Send
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerService;
