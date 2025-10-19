import React, { useState } from 'react';
import "../styles/entrepreneur/paymentmethodcard.css";

export default function PaymentMethodCard({handleShowPayment}) {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  return (
    <div className="payment-card">
        <button className='close-payment' onClick={() => handleShowPayment(0)}>x</button>
      <div className="payment-header">
        <h2 className="payment-title">Payment Method</h2>
        <p className="payment-subtitle">Select your preferred payment method</p>
      </div>

      <div className="payment-methods">
        <div 
          className={`method-option ${selectedMethod === 'card' ? 'active' : ''}`}
          onClick={() => setSelectedMethod('card')}
        >
          <div className="method-icon">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="4" y="12" width="40" height="28" rx="4" fill="#0F223D"/>
              <rect x="4" y="16" width="40" height="6" fill="#00A5A9"/>
              <rect x="8" y="28" width="12" height="4" rx="2" fill="#D9E1E7"/>
              <rect x="8" y="34" width="8" height="2" rx="1" fill="#D9E1E7"/>
            </svg>
          </div>
          <span className="method-label">Credit/Debit Card</span>
        </div>

        <div 
          className={`method-option ${selectedMethod === 'paypal' ? 'active' : ''}`}
          onClick={() => setSelectedMethod('paypal')}
        >
          <div className="method-icon">
            <svg viewBox="0 0 48 48" fill="none">
              <path d="M18 10h12c4.4 0 8 3.6 8 8 0 4.4-3.6 8-8 8h-6l-2 8h-4l2-8h-2c-4.4 0-8-3.6-8-8 0-4.4 3.6-8 8-8z" fill="#003087"/>
              <path d="M14 18h12c4.4 0 8 3.6 8 8 0 4.4-3.6 8-8 8h-6l-2 8h-4l2-8h-2c-4.4 0-8-3.6-8-8 0-4.4 3.6-8 8-8z" fill="#009CDE"/>
            </svg>
          </div>
          <span className="method-label">PayPal</span>
        </div>
      </div>

      {selectedMethod === 'card' && (
        <div className="payment-form">
          <div className="form-group">
            <label className="form-label">Card Number</label>
            <input
              type="text"
              name="cardNumber"
              className="form-input"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.cardNumber}
              onChange={(e) => {
                const formatted = formatCardNumber(e.target.value);
                setCardDetails(prev => ({ ...prev, cardNumber: formatted }));
              }}
              maxLength="19"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cardholder Name</label>
            <input
              type="text"
              name="cardName"
              className="form-input"
              placeholder="John Doe"
              value={cardDetails.cardName}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input
                type="text"
                name="expiryDate"
                className="form-input"
                placeholder="MM/YY"
                value={cardDetails.expiryDate}
                onChange={(e) => {
                  const formatted = formatExpiryDate(e.target.value);
                  setCardDetails(prev => ({ ...prev, expiryDate: formatted }));
                }}
                maxLength="5"
              />
            </div>

            <div className="form-group">
              <label className="form-label">CVV</label>
              <input
                type="text"
                name="cvv"
                className="form-input"
                placeholder="123"
                value={cardDetails.cvv}
                onChange={handleInputChange}
                maxLength="4"
              />
            </div>
          </div>

          <button className="submit-btn">Confirm Payment</button>
        </div>
      )}

      {selectedMethod === 'paypal' && (
        <div className="payment-form">
          <div className="paypal-info">
            <div className="paypal-logo">
              <svg viewBox="0 0 120 40" fill="none">
                <path d="M45 10h20c6 0 10 4 10 10s-4 10-10 10h-10l-3 10h-7l3-10h-3c-6 0-10-4-10-10s4-10 10-10z" fill="#003087"/>
                <path d="M40 15h20c6 0 10 4 10 10s-4 10-10 10h-10l-3 10h-7l3-10h-3c-6 0-10-4-10-10s4-10 10-10z" fill="#009CDE"/>
              </svg>
            </div>
            <p className="paypal-text">
              You will be redirected to PayPal to complete your payment securely.
            </p>
            <div className="paypal-note">
              Click "Continue with PayPal" to proceed to the secure payment portal
            </div>
          </div>

          <button className="submit-btn">Continue with PayPal</button>
        </div>
      )}
    </div>
  );
}