import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import './StripePaymentModal.css';

const stripePublishableKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY) || '';

function PaymentForm({ clientSecret, paymentId, amount, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError('');
    setLoading(true);

    const returnUrl = `${window.location.origin}/payment/success-stripe?paymentId=${paymentId}`;

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          billing_details: {
            name: typeof window !== 'undefined' && window.__MEMORIAL_BILLING_NAME__ ? window.__MEMORIAL_BILLING_NAME__ : undefined
          }
        }
      }
    });

    if (submitError) {
      setError(submitError.message || 'אירעה שגיאה בתשלום');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.post(
        getApiEndpoint('/api/payments/confirm-stripe'),
        { paymentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.redirectUrl) {
        onSuccess(res.data.redirectUrl);
        return;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'אירעה שגיאה באישור התשלום');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <PaymentElement />
      {error && <p className="stripe-form-error">{error}</p>}
      <div className="stripe-form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
          ביטול
        </button>
        <button type="submit" className="btn btn-primary" disabled={!stripe || loading}>
          {loading ? <><FaSpinner className="spin" /> מתבצע תשלום...</> : `שלם ₪${amount}`}
        </button>
      </div>
    </form>
  );
}

export function StripePaymentModal({ clientSecret, paymentId, amount, onSuccess, onClose }) {
  if (!stripePublishableKey || !clientSecret) {
    return (
      <div className="stripe-modal-overlay" onClick={onClose}>
        <div className="stripe-modal" onClick={e => e.stopPropagation()}>
          <p>Stripe לא מוגדר. הגדר VITE_STRIPE_PUBLISHABLE_KEY.</p>
          <button type="button" className="btn btn-primary" onClick={onClose}>סגור</button>
        </div>
      </div>
    );
  }

  const stripePromise = loadStripe(stripePublishableKey);
  const options = { clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#667eea' } } };

  return (
    <div className="stripe-modal-overlay" onClick={onClose}>
      <div className="stripe-modal" onClick={e => e.stopPropagation()}>
        <div className="stripe-modal-header">
          <h2>תשלום בכרטיס / Google Pay / Apple Pay</h2>
          <button type="button" className="stripe-modal-close" onClick={onClose} aria-label="סגור">
            <FaTimes />
          </button>
        </div>
        <div className="stripe-modal-body">
          <p className="stripe-modal-amount">סכום: ₪{amount}</p>
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm
              clientSecret={clientSecret}
              paymentId={paymentId}
              amount={amount}
              onSuccess={onSuccess}
              onCancel={onClose}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
}

export function isStripeAvailable() {
  return !!stripePublishableKey;
}
