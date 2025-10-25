import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import "../styles/entrepreneur/subscriptionpayment.css"
import logo from "../assets/logo.png";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscriptionPaymentForm = ({ token, planType, handleCloseModal }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMessage("");

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement),
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${API_BASE_URL}/api/payments/create-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_type: planType,
          payment_method_id: paymentMethod.id,
        }),
      });

      const data = await res.json();
      console.log("SUBSCRIPTION DATA", data);

      if (res.ok) {
        setMessage("🎉 Subscription created successfully! Your 14-day free trial has started.");
        setIsSuccess(true)
      } else {
        setMessage(`❌ ${data.error || data.message}`);
      }
    } catch (err) {
      setMessage("⚠️ Payment failed. Please try again later.");
    }

    setLoading(false);
  };

  return (
    <div className="ub-overlay" onClick={() => handleCloseModal(isSuccess)}>
      <div className="ub-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ub-close-btn" onClick={() => handleCloseModal(isSuccess)}>
          &times;
        </button>

        <div className="ub-header">
          <img src={logo} alt="Intervos Logo" className="ub-logo" />
          <div>
            <h5 className="ub-title">Join Intervos Premium</h5>
            <p className="ub-subtitle">Empower your bids with exclusive insights & priority tools.</p>
          </div>
        </div>

        <p className="ub-description">
          Elevate your bidding strategy — access hidden budgets, unlock advanced analytics, and gain premium visibility to attract high-value clients.  
          <strong>Start your 14-day free trial today!</strong>
        </p>

        <div className="ub-summary">
          <div className="ub-summary-row">
            <span>Plan Selected</span>
            <strong>{planType === "premium" ? "Premium Plan" : "Basic Plan"}</strong>
          </div>
          <div className="ub-summary-row">
            <span>Price</span>
            <strong>{planType === "premium" ? "$429/month" : "$250/month"}</strong>
          </div>
          <div className="ub-summary-row trial-info">
            <span>Trial Period</span>
            <strong>14 Days Free</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="ub-form">
          <CardElement
            options={{
              style: {
                base: { fontSize: "16px", color: "#32325d" },
                invalid: { color: "#fa755a" },
              },
              hidePostalCode: true,
            }}
          />

          <button type="submit" disabled={!stripe || loading}>
            {loading ? "Processing..." : "Start Free Trial"}
          </button>
        </form>

        {message && <p className="ub-message">{message}</p>}

        <p className="ub-secure-text">🔒 Secure payments handled by Stripe.</p>
      </div>
    </div>
  );
};

export default function SubscriptionPaymentModal({ token, planType = "basic", handleCloseModal }) {
  return (
    <Elements stripe={stripePromise}>
      <SubscriptionPaymentForm
        token={token}
        planType={planType}
        handleCloseModal={handleCloseModal}
      />
    </Elements>
  );
}
