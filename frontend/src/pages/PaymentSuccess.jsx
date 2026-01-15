import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('paymentId');
  const orderId = searchParams.get('token') || searchParams.get('PayerID');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // PayPal returns 'token' as orderId parameter
    const token = searchParams.get('token');
    if (paymentId && token) {
      confirmPayment(token);
    } else {
      setError('חסרים פרטי תשלום');
      setLoading(false);
    }
  }, [paymentId, searchParams]);

  const confirmPayment = async (paypalOrderId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(
        getApiEndpoint('/api/payments/confirm'),
        { orderId: paypalOrderId, paymentId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        // Redirect to memorial page after 3 seconds
        setTimeout(() => {
          if (response.data.memorialId) {
            navigate(`/memorial/${response.data.memorialId}`);
          } else {
            navigate('/');
          }
        }, 3000);
      } else {
        setError('אירעה שגיאה באישור התשלום');
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      setError(err.response?.data?.message || 'אירעה שגיאה באישור התשלום');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="payment-page">
        <div className="payment-container">
          <FaSpinner className="spinner-large" />
          <h2>מאשר תשלום...</h2>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="payment-page">
        <div className="payment-container error">
          <h2>שגיאה</h2>
          <p>{error}</p>
          <Link to="/pricing" className="btn btn-primary">
            חזור לתמחור
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="payment-page">
      <div className="payment-container success">
        <FaCheckCircle className="success-icon" />
        <h1>תשלום בוצע בהצלחה!</h1>
        <p>תודה על רכישתך. הדף זיכרון שלך זמין כעת.</p>
        <div className="payment-actions">
          <Link to="/create" className="btn btn-primary">
            צור דף זיכרון
          </Link>
          <Link to="/" className="btn btn-secondary">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </main>
  );
}

export default PaymentSuccess;
