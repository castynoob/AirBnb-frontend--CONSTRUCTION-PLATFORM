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
import { useLanguage } from "../../contexts/LanguageContext";
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

function CustomerService() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("disputes");

  // Format date with locale
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Time ago with translations
  const timeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return t('customerService.justNow');
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${t('customerService.minutesAgo')}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${t('customerService.hoursAgo')}`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}${t('customerService.daysAgo')}`;
    return formatDate(dateString);
  };
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
        <h2>{t('customerService.myDisputes')}</h2>
        <button
          className="cs-btn cs-btn-primary"
          onClick={() => setShowDisputeModal(true)}
        >
          <Plus size={16} />
          {t('customerService.fileDispute')}
        </button>
      </div>

      {loading ? (
        <div className="cs-loading">
          <Loader2 size={24} className="spin" />
          <span>{t('customerService.loadingDisputes')}</span>
        </div>
      ) : disputes.length === 0 ? (
        <div className="cs-empty">
          <Scale size={48} />
          <h3>{t('customerService.noDisputesFiled')}</h3>
          <p>{t('customerService.noDisputesDesc')}</p>
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
        <h2>{t('customerService.supportTickets')}</h2>
        <button
          className="cs-btn cs-btn-primary"
          onClick={() => setShowTicketModal(true)}
        >
          <Plus size={16} />
          {t('customerService.newTicket')}
        </button>
      </div>

      {loading ? (
        <div className="cs-loading">
          <Loader2 size={24} className="spin" />
          <span>{t('customerService.loadingTickets')}</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="cs-empty">
          <MessageSquare size={48} />
          <h3>{t('customerService.noTickets')}</h3>
          <p>{t('customerService.noTicketsDesc')}</p>
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
        <h2>{t('customerService.helpFaq')}</h2>
      </div>

      <div className="cs-help-list">
        <div className="cs-help-item">
          <div className="cs-help-icon">
            <Scale size={20} />
          </div>
          <div className="cs-help-content">
            <h4>{t('customerService.faqDispute')}</h4>
            <p>{t('customerService.faqDisputeAnswer')}</p>
          </div>
        </div>

        <div className="cs-help-item">
          <div className="cs-help-icon">
            <MessageSquare size={20} />
          </div>
          <div className="cs-help-content">
            <h4>{t('customerService.faqSupport')}</h4>
            <p>{t('customerService.faqSupportAnswer')}</p>
          </div>
        </div>

        <div className="cs-help-item">
          <div className="cs-help-icon">
            <Settings size={20} />
          </div>
          <div className="cs-help-content">
            <h4>{t('customerService.faqProfile')}</h4>
            <p>{t('customerService.faqProfileAnswer')}</p>
          </div>
        </div>

        <div className="cs-help-item">
          <div className="cs-help-icon">
            <Briefcase size={20} />
          </div>
          <div className="cs-help-content">
            <h4>{t('customerService.faqDisputeTypes')}</h4>
            <p>{t('customerService.faqDisputeTypesAnswer')}</p>
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
              <h1>{t('customerService.pageTitle')}</h1>
              <p>{t('customerService.pageSubtitle')}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="cs-tabs">
            <button
              className={`cs-tab ${activeTab === "disputes" ? "active" : ""}`}
              onClick={() => setActiveTab("disputes")}
            >
              <Scale size={18} />
              <span>{t('customerService.tabDisputes')}</span>
            </button>
            <button
              className={`cs-tab ${activeTab === "tickets" ? "active" : ""}`}
              onClick={() => setActiveTab("tickets")}
            >
              <MessageSquare size={18} />
              <span>{t('customerService.tabSupport')}</span>
            </button>
            <button
              className={`cs-tab ${activeTab === "help" ? "active" : ""}`}
              onClick={() => setActiveTab("help")}
            >
              <HelpCircle size={18} />
              <span>{t('customerService.tabHelp')}</span>
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
                {t('customerService.disputeModalTitle')}
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
                  <label>{t('customerService.disputeType')} *</label>
                  <select
                    value={disputeForm.type}
                    onChange={(e) =>
                      setDisputeForm({ ...disputeForm, type: e.target.value })
                    }
                    required
                  >
                    <option value="">{t('customerService.selectType')}</option>
                    <option value="job_quality">{t('customerService.typeJobQuality')}</option>
                    <option value="payment">{t('customerService.typePayment')}</option>
                    <option value="non_delivery">{t('customerService.typeNonDelivery')}</option>
                    <option value="review_dispute">{t('customerService.typeReviewDispute')}</option>
                    <option value="contract_violation">{t('customerService.typeContractViolation')}</option>
                    <option value="other">{t('customerService.typeOther')}</option>
                  </select>
                </div>

                <div className="cs-form-group">
                  <label>{t('customerService.relatedJob')}</label>
                  <select
                    value={disputeForm.job_id}
                    onChange={(e) =>
                      setDisputeForm({ ...disputeForm, job_id: e.target.value })
                    }
                  >
                    <option value="">{t('customerService.selectJob')}</option>
                    {userJobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cs-form-group">
                  <label>{t('customerService.describeIssue')} *</label>
                  <textarea
                    value={disputeForm.reason}
                    onChange={(e) =>
                      setDisputeForm({ ...disputeForm, reason: e.target.value })
                    }
                    placeholder={t('customerService.describeIssuePlaceholder')}
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
                  {t('customerService.cancel')}
                </button>
                <button
                  type="submit"
                  className="cs-btn cs-btn-primary"
                  disabled={submittingDispute}
                >
                  {submittingDispute ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      {t('customerService.submitting')}
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      {t('customerService.submitDispute')}
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
                {t('customerService.ticketModalTitle')}
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
                  <label>{t('customerService.subject')} *</label>
                  <input
                    type="text"
                    value={ticketForm.subject}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, subject: e.target.value })
                    }
                    placeholder={t('customerService.subjectPlaceholder')}
                    required
                  />
                </div>

                <div className="cs-form-row">
                  <div className="cs-form-group">
                    <label>{t('customerService.category')}</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, category: e.target.value })
                      }
                    >
                      <option value="technical">{t('customerService.categoryTechnical')}</option>
                      <option value="account">{t('customerService.categoryAccount')}</option>
                      <option value="payment">{t('customerService.categoryPayment')}</option>
                      <option value="job_issue">{t('customerService.categoryJobIssue')}</option>
                      <option value="other">{t('customerService.categoryOther')}</option>
                    </select>
                  </div>
                  <div className="cs-form-group">
                    <label>{t('customerService.priority')}</label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, priority: e.target.value })
                      }
                    >
                      <option value="low">{t('customerService.priorityLow')}</option>
                      <option value="medium">{t('customerService.priorityMedium')}</option>
                      <option value="high">{t('customerService.priorityHigh')}</option>
                    </select>
                  </div>
                </div>

                <div className="cs-form-group">
                  <label>{t('customerService.description')} *</label>
                  <textarea
                    value={ticketForm.description}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, description: e.target.value })
                    }
                    placeholder={t('customerService.descriptionPlaceholder')}
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
                  {t('customerService.cancel')}
                </button>
                <button
                  type="submit"
                  className="cs-btn cs-btn-primary"
                  disabled={submittingTicket}
                >
                  {submittingTicket ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      {t('customerService.creating')}
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      {t('customerService.createTicket')}
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
                {t('customerService.dispute')} #{selectedDispute.dispute_number}
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
                <span className="cs-detail-label">{t('customerService.status')}</span>
                <span className={`cs-badge cs-badge-${getStatusColor(selectedDispute.status)}`}>
                  {selectedDispute.status?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="cs-detail-row">
                <span className="cs-detail-label">{t('customerService.type')}</span>
                <span>{selectedDispute.type?.replace(/_/g, " ")}</span>
              </div>
              <div className="cs-detail-row">
                <span className="cs-detail-label">{t('customerService.created')}</span>
                <span>{formatDate(selectedDispute.created_at)}</span>
              </div>
              {selectedDispute.job_title && (
                <div className="cs-detail-row">
                  <span className="cs-detail-label">{t('customerService.relatedJobLabel')}</span>
                  <span>{selectedDispute.job_title}</span>
                </div>
              )}
              <div className="cs-detail-section">
                <h4>{t('customerService.reason')}</h4>
                <p>{selectedDispute.reason}</p>
              </div>
              {selectedDispute.resolution && (
                <div className="cs-detail-section cs-resolution">
                  <h4>
                    <CheckCircle size={16} />
                    {t('customerService.resolution')}
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
                {t('customerService.ticket')} #{selectedTicket.ticket_number}
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
                <h4>{t('customerService.conversation')}</h4>
                <div className="cs-messages-list">
                  {ticketMessages.length === 0 ? (
                    <div className="cs-messages-empty">{t('customerService.noMessagesYet')}</div>
                  ) : (
                    ticketMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`cs-message ${msg.sender_type === "user" ? "sent" : "received"}`}
                      >
                        <div className="cs-message-header">
                          <span>{msg.sender_type === "user" ? t('customerService.you') : t('customerService.supportTeam')}</span>
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
                      placeholder={t('customerService.typeReply')}
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
                      {t('customerService.send')}
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
