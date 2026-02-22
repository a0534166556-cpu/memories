import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import './PaymentSuccess.css';

function PaymentSuccessStripe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('paymentId');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (paymentId) {
      confirmStripe();
    } else {
      setError('חסר מזהה תשלום');
      setLoading(false);
    }
  }, [paymentId]);

  const confirmStripe = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.post(
        getApiEndpoint('/api/payments/confirm-stripe'),
        { paymentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setSuccess(true);
        const redirectUrl = response.data.redirectUrl || '/';
        setTimeout(() => navigate(redirectUrl), 2500);
      } else {
        setError(response.data.message || 'אירעה שגיאה באישור התשלום');
      }
    } catch (err) {
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
          <Link to="/" className="btn btn-primary">חזרה לדף הבית</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="payment-page">
      <div className="payment-container success">
        <FaCheckCircle className="success-icon" />
        <h1>תשלום בוצע בהצלחה!</h1>
        <p>מעביר אותך...</p>
      </div>
    </main>
  );
}

export default PaymentSuccessStripe;
