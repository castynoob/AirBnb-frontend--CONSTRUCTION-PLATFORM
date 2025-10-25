import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import "../styles/entrepreneur/budgetunlock.css";
import logo from "../assets/logo.png";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const UnlockBudgetForm = ({ jobId, token, handleBudgetModal }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      const res = await fetch(`${API_BASE_URL}/api/payments/unlock-budget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_id: jobId,
          payment_method_id: paymentMethod.id,
        }),
      });

      const data = await res.json();
      console.log("PAYMENT DATA", data);

      if (res.ok) {
        setMessage("✅ Budget unlocked successfully!");
        setTimeout(() => {
          handleBudgetModal(true)
        }, 2000)
      } else {
        setMessage(`❌ ${data.error || data.message}`);
      }
    } catch (err) {
      setMessage("⚠️ Payment failed. Try again later.");
    }

    setLoading(false);
  };

  return (
    <div className="ub-overlay" onClick={() => handleBudgetModal(false)}>
      <div className="ub-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ub-close-btn" onClick={() => handleBudgetModal(false)}>
          &times;
        </button>

        <div className="ub-header">
          <img src={logo} alt="Intervos Logo" className="ub-logo" />
          <div>
            <h5 className="ub-title">Gain the Competitive Edge</h5>
            <p className="ub-subtitle">Unlock the hidden budget on this project.</p>
          </div>
        </div>

        <p className="ub-description">
          Get the full picture before placing your bid. Knowing the client’s
          actual budget helps you craft a winning proposal and stand out in the
          Intervos marketplace.
        </p>

        <div className="ub-summary">
          <div className="ub-summary-row">
            <span>Purpose</span>
            <strong>Unlock Job Budget</strong>
          </div>
          <div className="ub-summary-row">
            <span>Amount to Pay</span>
            <strong>$20.00</strong>
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
            {loading ? "Processing..." : "Unlock Now"}
          </button>
        </form>

        {message && <p className="ub-message">{message}</p>}

        <p className="ub-secure-text">🔒 Powered by Stripe — Secure, Fast, and Trusted.</p>
      </div>
    </div>
  );
};

export default function UnlockBudgetModal({ jobId, token, handleBudgetModal }) {
  return (
    <Elements stripe={stripePromise}>
      <UnlockBudgetForm
        jobId={jobId}
        token={token}
        handleBudgetModal={handleBudgetModal}
      />
    </Elements>
  );
}
