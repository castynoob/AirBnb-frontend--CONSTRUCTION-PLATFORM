import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  Package,
  TrendingUp,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  X,
  Check,
  Star,
  Eye,
  Download,
  Search,
  Filter
} from 'lucide-react';
import Nav from "../../components/Nav";
import '../../styles/supplier/supplierhomepage.css';

function SupplierHomepage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    unreadMessages: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const fetchSupplierData = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const userProfile = localStorage.getItem('userProfile');

    if (userProfile) {
      const user = JSON.parse(userProfile);

      try {
        // Fetch supplier profile
        const profileResponse = await fetch(`${API_BASE_URL}/api/users/supplier/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile({
            companyName: profileData.profile.company_name,
            email: profileData.profile.email,
            phone: profileData.profile.phone,
            catalogUrl: profileData.profile.catalog_pdf_url,
            image: profileData.profile.image
          });
        }

        // Fetch stats
        const statsResponse = await fetch(`${API_BASE_URL}/api/supplier-stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats({
            totalRequests: parseInt(statsData.stats.total_requests) || 0,
            pendingRequests: parseInt(statsData.stats.pending_requests) || 0,
            completedRequests: parseInt(statsData.stats.completed_requests) || 0,
            unreadMessages: 0 // TODO: implement when messages are ready
          });
        }

        // Fetch recent requests
        const requestsResponse = await fetch(`${API_BASE_URL}/api/supplier-requests`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          // Get all requests (filtering will be done on client side)
          setRecentRequests(requestsData.requests);
        }

      } catch (error) {
        console.error('Error fetching supplier data:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getProfileCompletionStatus = () => {
    if (!profile) return { percentage: 0, missing: [] };

    const checks = {
      'Profile Picture': !!profile.image,
      'Catalog Upload': !!profile.catalogUrl,
      'Phone Number': !!profile.phone
    };

    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const percentage = Math.round((completed / total) * 100);
    const missing = Object.entries(checks)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    return { percentage, missing };
  };

  const handleUpdateRequestStatus = async (requestId, status) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const userProfile = localStorage.getItem('userProfile');

    if (!userProfile) return;

    const user = JSON.parse(userProfile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/supplier-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Refresh the requests and stats
        fetchSupplierData();
      } else {
        const error = await response.json();
        console.error('Error updating request status:', error);
        alert(error.message || 'Failed to update request status');
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Failed to update request status');
    }
  };

  const handleAcceptRequest = (requestId) => {
    handleUpdateRequestStatus(requestId, 'in-progress');
  };

  const handleDeclineRequest = (requestId) => {
    if (confirm('Are you sure you want to decline this request?')) {
      handleUpdateRequestStatus(requestId, 'cancelled');
    }
  };

  const handleCompleteRequest = (requestId) => {
    if (confirm('Mark this request as completed?')) {
      handleUpdateRequestStatus(requestId, 'completed');
    }
  };

  const handleAddReceipt = (request) => {
    setSelectedRequest(request);
    setShowInvoiceModal(true);
    setInvoiceItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setDeliveryTerms('');
  };

  const handleAddInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveInvoiceItem = (index) => {
    if (invoiceItems.length > 1) {
      const newItems = invoiceItems.filter((_, i) => i !== index);
      setInvoiceItems(newItems);
    }
  };

  const handleInvoiceItemChange = (index, field, value) => {
    const newItems = [...invoiceItems];
    newItems[index][field] = field === 'description' ? value : parseFloat(value) || 0;
    setInvoiceItems(newItems);
  };

  const calculateTotalAmount = () => {
    return invoiceItems.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  };

  const handleSubmitInvoice = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const userProfile = localStorage.getItem('userProfile');

    if (!userProfile || !selectedRequest) return;

    // Validate items
    const hasEmptyDescription = invoiceItems.some(item => !item.description.trim());
    if (hasEmptyDescription) {
      alert('Please fill in all item descriptions');
      return;
    }

    const hasInvalidQuantity = invoiceItems.some(item => item.quantity <= 0);
    if (hasInvalidQuantity) {
      alert('Please enter valid quantities for all items');
      return;
    }

    const hasInvalidPrice = invoiceItems.some(item => item.unitPrice <= 0);
    if (hasInvalidPrice) {
      alert('Please enter valid prices for all items');
      return;
    }

    const user = JSON.parse(userProfile);
    const totalAmount = calculateTotalAmount();

    setIsSubmittingInvoice(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/supplier-invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          items: JSON.stringify(invoiceItems),
          totalAmount: totalAmount,
          deliveryTerms: deliveryTerms
        })
      });

      if (response.ok) {
        alert('Invoice/Receipt created successfully!');
        setShowInvoiceModal(false);
        setSelectedRequest(null);
        fetchSupplierData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleCloseModal = () => {
    setShowRequestModal(false);
    setSelectedRequest(null);
  };

  const handleDownloadPDF = (pdfUrl, fileName) => {
    // Open PDF in new tab for viewing/downloading
    window.open(pdfUrl, '_blank');
  };

  const filteredRequests = recentRequests.filter(request => {
    const matchesSearch = request.entrepreneur_company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.request_details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="supplier-home-layout">
        <Nav />
        <div className="supplier-home-loading">
          <div className="supplier-home-loader"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const profileStatus = getProfileCompletionStatus();

  return (
    <div className="supplier-home-layout">
      <Nav />
      <div className="supplier-home-container">
        {/* Fixed Profile Completion Alert */}
        {profileStatus.percentage < 100 && (
          <div className="supplier-home-alert-fixed">
            <AlertCircle size={18} />
            <div className="supplier-home-alert-content">
              <span>Profile {profileStatus.percentage}% complete</span>
              <button
                className="supplier-home-alert-link"
                onClick={() => navigate('/profile/supplier')}
              >
                Complete now
              </button>
            </div>
          </div>
        )}

        {/* Combined Header & Stats Section */}
        <div className="supplier-home-header-section">
          <div className="supplier-home-header-top">
            <div className="supplier-home-welcome">
              <h1>Welcome back, {profile?.companyName || 'Supplier'}!</h1>
              <p>Manage your material requests and communicate with construction companies</p>
            </div>
            <div className="supplier-home-profile-preview">
              <img
                src={profile?.image || "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=200"}
                alt={profile?.companyName}
                className="supplier-home-avatar"
                onClick={() => navigate('/profile/supplier')}
              />
            </div>
          </div>

          {/* Stats Grid - Integrated */}
          <div className="supplier-home-stats-grid">
            <div className="supplier-home-stat-card">
              <div className="supplier-home-stat-icon total">
                <Package size={24} />
              </div>
              <div className="supplier-home-stat-content">
                <div className="supplier-home-stat-label">Total Requests</div>
                <div className="supplier-home-stat-value">{stats.totalRequests}</div>
              </div>
            </div>

            <div className="supplier-home-stat-card">
              <div className="supplier-home-stat-icon pending">
                <Clock size={24} />
              </div>
              <div className="supplier-home-stat-content">
                <div className="supplier-home-stat-label">Pending Requests</div>
                <div className="supplier-home-stat-value">{stats.pendingRequests}</div>
              </div>
            </div>

            <div className="supplier-home-stat-card">
              <div className="supplier-home-stat-icon completed">
                <CheckCircle size={24} />
              </div>
              <div className="supplier-home-stat-content">
                <div className="supplier-home-stat-label">Completed</div>
                <div className="supplier-home-stat-value">{stats.completedRequests}</div>
              </div>
            </div>

            <div className="supplier-home-stat-card">
              <div className="supplier-home-stat-icon messages">
                <MessageSquare size={24} />
              </div>
              <div className="supplier-home-stat-content">
                <div className="supplier-home-stat-label">Unread Messages</div>
                <div className="supplier-home-stat-value">{stats.unreadMessages}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="supplier-home-content-grid">
          {/* Recent Requests */}
          <div className="supplier-home-section">
            <div className="supplier-home-section-header">
              <h2>
                <FileText size={20} />
                Material Requests
              </h2>
            </div>

            {/* Search and Filter Controls */}
            <div className="supplier-home-filters">
              <div className="supplier-home-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by company or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="supplier-home-search-input"
                />
              </div>
              <div className="supplier-home-filter-group">
                <Filter size={18} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="supplier-home-filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="supplier-home-section-body">
              {filteredRequests.length > 0 ? (
                <div className="supplier-home-requests-list">
                  {filteredRequests.map((request) => (
                    <div key={request.id} className="supplier-home-request-card">
                      <div className="supplier-home-request-header">
                        <div className="supplier-home-request-company">
                          <User size={16} />
                          {request.entrepreneur_company_name}
                        </div>
                        <span className={`supplier-home-request-status ${request.status}`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="supplier-home-request-details">
                        {request.request_details}
                      </div>
                      <div className="supplier-home-request-footer">
                        <div className="supplier-home-request-date">
                          <Calendar size={14} />
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                        <div className="supplier-home-request-actions">
                          <button
                            className="supplier-home-request-btn view"
                            onClick={() => handleViewRequest(request)}
                          >
                            <Eye size={16} />
                            View Request
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button
                                className="supplier-home-request-btn accept"
                                onClick={() => handleAcceptRequest(request.id)}
                              >
                                <Check size={16} />
                                Accept
                              </button>
                              <button
                                className="supplier-home-request-btn decline"
                                onClick={() => handleDeclineRequest(request.id)}
                              >
                                <X size={16} />
                                Decline
                              </button>
                            </>
                          )}
                          {request.status === 'in-progress' && (
                            <button
                              className="supplier-home-request-btn complete"
                              onClick={() => handleCompleteRequest(request.id)}
                            >
                              <CheckCircle size={16} />
                              Mark as Completed
                            </button>
                          )}
                          {request.status === 'completed' && (
                            <button
                              className="supplier-home-request-btn receipt"
                              onClick={() => handleAddReceipt(request)}
                            >
                              <FileText size={16} />
                              Add Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="supplier-home-empty-state">
                  <FileText size={48} color="#cbd5e1" />
                  <h3>{searchTerm || statusFilter !== 'all' ? 'No Matching Requests' : 'No Requests Yet'}</h3>
                  <p>{searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Material requests from entrepreneurs will appear here'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="supplier-home-section">
            <div className="supplier-home-section-header">
              <h2>
                <TrendingUp size={20} />
                Quick Actions
              </h2>
            </div>
            <div className="supplier-home-section-body">
              <div className="supplier-home-actions-list">
                <button
                  className="supplier-home-action-card"
                  onClick={() => navigate('/profile/supplier')}
                >
                  <div className="supplier-home-action-icon profile">
                    <User size={24} />
                  </div>
                  <div className="supplier-home-action-content">
                    <h3>View Profile</h3>
                    <p>Update your company information</p>
                  </div>
                </button>

                <button
                  className="supplier-home-action-card"
                  onClick={() => navigate('/messages/supplier')}
                >
                  <div className="supplier-home-action-icon messages">
                    <MessageSquare size={24} />
                  </div>
                  <div className="supplier-home-action-content">
                    <h3>Messages</h3>
                    <p>Chat with entrepreneurs</p>
                  </div>
                </button>

                {!profile?.catalogUrl && (
                  <button
                    className="supplier-home-action-card"
                    onClick={() => navigate('/profile/supplier')}
                  >
                    <div className="supplier-home-action-icon catalog">
                      <Upload size={24} />
                    </div>
                    <div className="supplier-home-action-content">
                      <h3>Upload Catalog</h3>
                      <p>Add your product catalog</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Request Details Modal */}
        {showRequestModal && selectedRequest && (
          <div className="supplier-home-modal-overlay" onClick={handleCloseModal}>
            <div className="supplier-home-modal" onClick={(e) => e.stopPropagation()}>
              <div className="supplier-home-modal-header">
                <h2>Request Details</h2>
                <button className="supplier-home-modal-close" onClick={handleCloseModal}>
                  <X size={24} />
                </button>
              </div>
              <div className="supplier-home-modal-body">
                <div className="supplier-home-modal-info">
                  <div className="supplier-home-modal-field">
                    <label>Company:</label>
                    <span>{selectedRequest.entrepreneur_company_name}</span>
                  </div>
                  <div className="supplier-home-modal-field">
                    <label>Status:</label>
                    <span className={`supplier-home-request-status ${selectedRequest.status}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                  <div className="supplier-home-modal-field">
                    <label>Date Submitted:</label>
                    <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                  </div>
                  <div className="supplier-home-modal-field">
                    <label>Contact Email:</label>
                    <span>{selectedRequest.entrepreneur_email}</span>
                  </div>
                  {selectedRequest.entrepreneur_phone && (
                    <div className="supplier-home-modal-field">
                      <label>Contact Phone:</label>
                      <span>{selectedRequest.entrepreneur_phone}</span>
                    </div>
                  )}
                </div>

                <div className="supplier-home-modal-section">
                  <h3>Request Details</h3>
                  <p className="supplier-home-modal-details">{selectedRequest.request_details}</p>
                </div>

                {selectedRequest.request_file_url && (
                  <div className="supplier-home-modal-section">
                    <h3>Attached Document</h3>
                    <div className="supplier-home-modal-pdf">
                      <iframe
                        src={selectedRequest.request_file_url}
                        title="Request Document"
                        className="supplier-home-pdf-viewer"
                      />
                      <button
                        className="supplier-home-request-btn view"
                        onClick={() => handleDownloadPDF(selectedRequest.request_file_url, 'request-document.pdf')}
                      >
                        <Download size={16} />
                        Open/Download PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="supplier-home-modal-footer">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      className="supplier-home-request-btn accept"
                      onClick={() => {
                        handleAcceptRequest(selectedRequest.id);
                        handleCloseModal();
                      }}
                    >
                      <Check size={16} />
                      Accept Request
                    </button>
                    <button
                      className="supplier-home-request-btn decline"
                      onClick={() => {
                        handleDeclineRequest(selectedRequest.id);
                        handleCloseModal();
                      }}
                    >
                      <X size={16} />
                      Decline Request
                    </button>
                  </>
                )}
                {selectedRequest.status === 'in-progress' && (
                  <button
                    className="supplier-home-request-btn complete"
                    onClick={() => {
                      handleCompleteRequest(selectedRequest.id);
                      handleCloseModal();
                    }}
                  >
                    <CheckCircle size={16} />
                    Mark as Completed
                  </button>
                )}
                <button className="supplier-home-request-btn" onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice/Receipt Modal */}
        {showInvoiceModal && selectedRequest && (
          <div className="supplier-home-modal-overlay" onClick={() => setShowInvoiceModal(false)}>
            <div className="supplier-home-modal supplier-home-invoice-modal" onClick={(e) => e.stopPropagation()}>
              <div className="supplier-home-modal-header">
                <h2>Create Invoice/Receipt</h2>
                <button className="supplier-home-modal-close" onClick={() => setShowInvoiceModal(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="supplier-home-modal-body">
                <div className="supplier-home-invoice-info">
                  <div className="supplier-home-invoice-field">
                    <label>Request ID:</label>
                    <span>{selectedRequest.id.substring(0, 8)}...</span>
                  </div>
                  <div className="supplier-home-invoice-field">
                    <label>Company:</label>
                    <span>{selectedRequest.entrepreneur_company_name}</span>
                  </div>
                </div>

                <div className="supplier-home-invoice-items-section">
                  <div className="supplier-home-invoice-items-header">
                    <h3>Invoice Items</h3>
                    <button
                      className="supplier-home-add-item-btn"
                      onClick={handleAddInvoiceItem}
                      type="button"
                    >
                      + Add Item
                    </button>
                  </div>

                  {invoiceItems.map((item, index) => (
                    <div key={index} className="supplier-home-invoice-item">
                      <div className="supplier-home-invoice-item-row">
                        <div className="supplier-home-invoice-input-group supplier-home-invoice-description">
                          <label>Description *</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleInvoiceItemChange(index, 'description', e.target.value)}
                            placeholder="Item description"
                            className="supplier-home-invoice-input"
                          />
                        </div>
                        <div className="supplier-home-invoice-input-group">
                          <label>Quantity *</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleInvoiceItemChange(index, 'quantity', e.target.value)}
                            min="1"
                            className="supplier-home-invoice-input"
                          />
                        </div>
                        <div className="supplier-home-invoice-input-group">
                          <label>Unit Price (₱) *</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleInvoiceItemChange(index, 'unitPrice', e.target.value)}
                            min="0"
                            step="0.01"
                            className="supplier-home-invoice-input"
                          />
                        </div>
                        <div className="supplier-home-invoice-input-group">
                          <label>Subtotal</label>
                          <div className="supplier-home-invoice-subtotal">
                            ₱{(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                        {invoiceItems.length > 1 && (
                          <button
                            className="supplier-home-remove-item-btn"
                            onClick={() => handleRemoveInvoiceItem(index)}
                            type="button"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="supplier-home-invoice-total">
                    <strong>Total Amount:</strong>
                    <span className="supplier-home-invoice-total-value">
                      ₱{calculateTotalAmount().toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="supplier-home-invoice-delivery">
                  <label>Delivery Terms</label>
                  <textarea
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    placeholder="Enter delivery terms, conditions, or notes..."
                    className="supplier-home-invoice-textarea"
                    rows="3"
                  />
                </div>
              </div>
              <div className="supplier-home-modal-footer">
                <button
                  className="supplier-home-request-btn"
                  onClick={() => setShowInvoiceModal(false)}
                  disabled={isSubmittingInvoice}
                >
                  Cancel
                </button>
                <button
                  className="supplier-home-request-btn accept"
                  onClick={handleSubmitInvoice}
                  disabled={isSubmittingInvoice}
                >
                  {isSubmittingInvoice ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SupplierHomepage;
