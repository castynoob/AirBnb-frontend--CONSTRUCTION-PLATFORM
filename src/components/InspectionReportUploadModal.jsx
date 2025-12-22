import React, { useState, useEffect } from 'react';
import '../styles/manager/inspectionreportupload.css';

export default function InspectionReportUploadModal({ isOpen, onClose, onSubmit, propertyId }) {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [inspectionId, setInspectionId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [editableData, setEditableData] = useState({});
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [properties, setProperties] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  // Field label mappings for better display
  const fieldLabels = {
    title: 'Title / Work Description',
    description: 'Description',
    category: 'Category',
    urgency: 'Urgency / Priority',
    budget: 'Budget',
    location: 'Location / Unit',
    dueDate: 'Due Date / Year',
    notes: 'Notes / Details',
    component: 'Component',
    uniformatCode: 'Uniformat Code',
    typeOfWork: 'Type of Work',
  };

  // Function to get friendly label for field
  const getFieldLabel = (fieldName) => {
    return fieldLabels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  };

  // Function to get input type based on field
  const getInputType = (key) => {
    if (key === 'budget') return 'number';
    if (key === 'dueDate') return 'date';
    return 'text';
  };

  // Fetch properties when modal opens
  useEffect(() => {
    if (isOpen) {
      // If propertyId is passed from parent, use it
      if (propertyId) {
        setSelectedPropertyId(propertyId);
      } else {
        // Otherwise, fetch all properties for user to select
        fetchProperties();
      }
    }
  }, [isOpen, propertyId]);

  const fetchProperties = async () => {
    setIsLoadingProperties(true);
    setError('');

    try {
      const userProfile = localStorage.getItem("userProfile");
      if (!userProfile) {
        throw new Error('User not logged in');
      }

      const user = JSON.parse(userProfile);
      const token = user?.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${API_BASE_URL}/api/properties`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch properties');
      }

      setProperties(data.properties || []);
    } catch (err) {
      setError(err.message || 'Failed to load properties');
      console.error('Fetch properties error:', err);
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];

    if (!uploadedFile) return;

    // Validate file type
    const fileExtension = uploadedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      setError('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
      return;
    }

    // Check if property is selected
    if (!selectedPropertyId) {
      setError('Please select a property first before uploading inspection report');
      return;
    }

    setFile(uploadedFile);
    setError('');
    setIsProcessing(true);

    try {
      // Upload to backend API
      const userProfile = localStorage.getItem("userProfile");
      if (!userProfile) {
        throw new Error('User not logged in');
      }

      const user = JSON.parse(userProfile);
      const token = user?.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('property_id', selectedPropertyId);

      const response = await fetch(`${API_BASE_URL}/api/inspections/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        // If response is not JSON, show status text
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }

      if (!response.ok) {
        // Enhanced error message with detected columns
        let errorMessage = result.message || result.error || `Failed to upload inspection report (${response.status})`;

        if (errorMessage.includes('Could not find "Title"')) {
          errorMessage = `Could not find "Title" or "Job Title" column.\n\n`;

          if (result.detectedColumns && result.detectedColumns.length > 0) {
            errorMessage += `Detected columns in your file:\n${result.detectedColumns.join(', ')}\n\n`;
          }

          errorMessage += `Required: Your Excel file must have at least ONE of these columns:\n\n`;
          errorMessage += `✓ English: "Title", "Job Title", "Task"\n`;
          errorMessage += `✓ French: "Titre", "Tâche"\n\n`;
          errorMessage += `Note: Keep your original language! The system automatically translates column headers.\n\n`;
          errorMessage += `Tip: Add a column header with one of these names, or rename an existing column.`;
        }

        throw new Error(errorMessage);
      }

      // Store inspection ID for later use
      setInspectionId(result.inspection.id);

      // Extract parsed jobs from backend response
      const jobs = result.parsedData.jobs || [];

      if (jobs.length === 0) {
        throw new Error('No valid jobs found in the Excel file');
      }

      setExtractedData(jobs);

      // Initialize editable data with extracted values
      const initialEditableData = {};
      jobs.forEach((row, index) => {
        initialEditableData[index] = { ...row };
      });
      setEditableData(initialEditableData);

      console.log('Upload successful:', result);
    } catch (err) {
      setError(err.message || 'Failed to upload Excel file. Please ensure it is properly formatted.');
      console.error('Upload error:', err);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (rowIndex, fieldName, value) => {
    setEditableData(prev => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [fieldName]: value
      }
    }));
  };

  const handleRemoveRow = (rowIndex) => {
    const newEditableData = { ...editableData };
    delete newEditableData[rowIndex];
    setEditableData(newEditableData);
  };

  const handleSubmit = async () => {
    // Convert editableData object to array, filtering out removed items
    const finalData = Object.values(editableData).filter(item => item !== undefined);

    if (finalData.length === 0) {
      setError('Please provide at least one inspection item');
      return;
    }

    if (!inspectionId) {
      setError('Inspection ID not found. Please try uploading the file again.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Get authentication token
      const userProfile = localStorage.getItem("userProfile");
      const user = JSON.parse(userProfile);
      const token = user?.token;

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      // Create jobs from inspection data using backend API
      const response = await fetch(`${API_BASE_URL}/api/inspections/${inspectionId}/create-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ jobs: finalData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create jobs from inspection');
      }

      console.log('Jobs created successfully:', result);

      // Call parent's onSubmit callback with the created jobs
      if (onSubmit) {
        onSubmit(result.jobs);
      }

      alert(`Successfully created ${result.jobs.length} jobs from inspection report!`);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to create jobs. Please try again.');
      console.error('Submit error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setExtractedData(null);
    setEditableData({});
    setInspectionId(null);
    setError('');
    setIsProcessing(false);
    // Only reset property selection if it wasn't passed from parent
    if (!propertyId) {
      setSelectedPropertyId('');
    }
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setExtractedData(null);
    setEditableData({});
    setInspectionId(null);
    setError('');
  };

  const handleDownloadTemplate = async () => {
    try {
      const userProfile = localStorage.getItem("userProfile");
      const user = JSON.parse(userProfile);
      const token = user?.token;

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${API_BASE_URL}/api/inspections/template`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'inspection-template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download template: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="uir-inspection-upload-modal">
      <div className="uir-modal-overlay" onClick={handleClose} />

      <div className="uir-modal-content uir-inspection-modal">
        <button className="uir-close-btn" onClick={handleClose}>×</button>

        <div className="uir-modal-header">
          <h2>Upload Inspection Report</h2>
          <p className="uir-subtitle">
            {!propertyId ? 'Select a property and upload' : 'Upload'} an Excel file containing inspection data, then review and verify the information
          </p>
        </div>

        {!extractedData ? (
          <div className="uir-upload-section">
            {/* Property Selection - only show if propertyId not passed from parent */}
            {!propertyId && (
              <div className="uir-property-selection-section">
                <h3>Step 1: Select Property</h3>
                {isLoadingProperties ? (
                  <div className="uir-loading-message">
                    <div className="uir-spinner"></div>
                    <span>Loading properties...</span>
                  </div>
                ) : (
                  <div className="uir-form-group">
                    <label htmlFor="property-select">
                      <svg className="uir-property-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Select Property <span className="uir-required">*</span>
                    </label>
                    <select
                      id="property-select"
                      value={selectedPropertyId}
                      onChange={(e) => {
                        setSelectedPropertyId(e.target.value);
                        setError('');
                      }}
                      className="uir-property-dropdown"
                    >
                      <option value="">-- Choose a Property --</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.building_name} - {property.address}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <h3>{!propertyId ? 'Step 2: Upload Excel File' : 'Upload Excel File'}</h3>
            <div className="uir-upload-area">
              <input
                type="file"
                id="excel-upload"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="uir-file-input"
              />
              <label htmlFor="excel-upload" className="uir-upload-label">
                <svg className="uir-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="uir-upload-text">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </span>
                <span className="uir-upload-hint">Excel files (.xlsx, .xls, .csv)</span>
              </label>
            </div>

            {error && (
              <div className="uir-error-message">
                <svg className="uir-error-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <div>
                  <div>{error}</div>
                  {error.includes('Could not find "Title"') && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #fcc' }}>
                      <strong>Quick Fix:</strong>
                      <ol style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '14px' }}>
                        <li>Open your Excel file</li>
                        <li>Add a header row at the top (if missing)</li>
                        <li>Name one column as:
                          <ul style={{ marginLeft: '20px', marginTop: '4px' }}>
                            <li>"Title" or "Titre" (for work description)</li>
                            <li>Or use any accepted name: "Job Title", "Task", "Tâche"</li>
                          </ul>
                        </li>
                        <li>Keep your other columns in French or English - both work!</li>
                        <li>Save and upload again</li>
                      </ol>
                      <button
                        onClick={handleDownloadTemplate}
                        style={{
                          marginTop: '12px',
                          padding: '8px 16px',
                          background: '#00A5A9',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}
                      >
                        Download Template Example
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="uir-processing-message">
                <div className="uir-spinner"></div>
                <span>Processing Excel file...</span>
              </div>
            )}

            <div className="uir-instructions">
              <div className="uir-instructions-header">
                <h3>Inspection Report Format Guidelines</h3>
                <button className="uir-template-download-btn" onClick={handleDownloadTemplate}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template
                </button>
              </div>
              <ul>
                <li><strong>✓ No translation needed!</strong> Keep your original French/English column names - the system automatically translates them</li>
                <li><strong>Supported formats:</strong> Standard inspection reports, maintenance plans, Uniformat-coded reports</li>
                <li><strong>Required column (at least ONE):</strong>
                  <ul style={{ marginTop: '8px', marginLeft: '20px', fontSize: '13px' }}>
                    <li>🇬🇧 English: "Title", "Job Title", "Task"</li>
                    <li>🇫🇷 French: "Titre", "Tâche"</li>
                  </ul>
                </li>
                <li><strong>Optional columns recognized:</strong>
                  <ul style={{ marginTop: '8px', marginLeft: '20px', fontSize: '13px' }}>
                    <li>Description / Détails</li>
                    <li>Component / Composant / Élément</li>
                    <li>Uniformat Code / Code Uniformat</li>
                    <li>Type of Work / Type de Travail</li>
                    <li>Budget / Cost / Coût Estimé</li>
                    <li>Location / Lieu / Zone</li>
                    <li>Due Date / Date / Échéance</li>
                  </ul>
                </li>
                <li><strong>Auto-detection:</strong> Categories from Uniformat codes (D50=Electrical, B20=Masonry, D20=Plumbing, etc.)</li>
                <li><strong>Budget:</strong> Supports single budget or min/max range</li>
                <li>First row must contain column headers</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="uir-review-section">
            <div className="uir-review-header">
              <div className="uir-review-info">
                <h3>Review & Verify Data</h3>
                <p>{Object.keys(editableData).length} items extracted from {file?.name}</p>
              </div>
              <button className="uir-reset-btn" onClick={handleReset}>
                <svg className="uir-reset-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Upload Different File
              </button>
            </div>

            {error && (
              <div className="uir-error-message">
                <svg className="uir-error-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                {error}
              </div>
            )}

            <div className="uir-data-table-container">
              <table className="uir-data-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    {extractedData[0] && Object.keys(extractedData[0]).map((key) => (
                      <th key={key}>{getFieldLabel(key)}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.map((row, rowIndex) => (
                    editableData[rowIndex] && (
                      <tr key={rowIndex}>
                        <td className="uir-row-number">{rowIndex + 1}</td>
                        {Object.keys(row).map((key) => {
                          const inputType = getInputType(key);
                          const displayValue = key === 'notes' || key === 'description'
                            ? editableData[rowIndex][key]
                            : (inputType === 'text' ? editableData[rowIndex][key] : editableData[rowIndex][key]);

                          return (
                            <td key={`${rowIndex}-${key}`}>
                              {(key === 'notes' || key === 'description') ? (
                                <textarea
                                  value={displayValue || ''}
                                  onChange={(e) => handleInputChange(rowIndex, key, e.target.value)}
                                  className="uir-data-input uir-data-textarea"
                                  rows="2"
                                />
                              ) : (
                                <input
                                  type={inputType}
                                  value={displayValue || ''}
                                  onChange={(e) => handleInputChange(rowIndex, key, e.target.value)}
                                  className="uir-data-input"
                                  placeholder={getFieldLabel(key)}
                                  step={inputType === 'number' ? '0.01' : undefined}
                                />
                              )}
                            </td>
                          );
                        })}
                        <td className="uir-action-cell">
                          <button
                            className="uir-delete-btn"
                            onClick={() => handleRemoveRow(rowIndex)}
                            title="Remove this row"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>

            <div className="uir-modal-actions">
              <button className="uir-cancel-btn" onClick={handleClose}>
                Cancel
              </button>
              <button className="uir-submit-btn" onClick={handleSubmit}>
                <svg className="uir-submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Submit Inspection Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
