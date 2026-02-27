import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import { FaSpinner, FaDatabase, FaPlus } from 'react-icons/fa';
import { StripePaymentModal, isStripeAvailable } from '../components/StripePaymentModal';
import './AddStorage.css';

const PRICE_PER_GB = 100;
const SITE_URL = 'https://memoriesman.netlify.app';

function AddStorage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hideExternalPayment = useMemo(() => searchParams.get('in_app') === '1', [searchParams]);
  const [memorials, setMemorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [addForId, setAddForId] = useState(null);
  const [additionalGb, setAdditionalGb] = useState(1);
  const [stripeModal, setStripeModal] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?redirect=/add-storage');
      return;
    }
    fetchMemorials();
  }, [navigate]);

  const fetchMemorials = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const myIds = JSON.parse(localStorage.getItem('myMemorialIds') || '[]');
      let url = getApiEndpoint('/api/memorials/user/my');
      if (myIds.length > 0) url += `?ids=${encodeURIComponent(JSON.stringify(myIds))}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const paid = (res.data.memorials || []).filter(m => m.status && m.status !== 'temporary');
        setMemorials(paid);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בטעינת הדפים');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseAddon = async () => {
    if (!addForId || additionalGb < 1 || additionalGb > 10) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?redirect=/add-storage');
      return;
    }
    setProcessing(true);
    try {
      const amount = PRICE_PER_GB * additionalGb;
      const res = await axios.post(
        getApiEndpoint('/api/payments/create'),
        { memorialId: addForId, planType: 'storage-addon', additionalGb, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.approveUrl) {
        window.location.href = res.data.approveUrl;
      } else {
        setError(res.data?.message || 'שגיאה ביצירת התשלום');
        setProcessing(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה ביצירת התשלום');
      setProcessing(false);
    }
  };

  const handleStripeAddon = async () => {
    if (!addForId || additionalGb < 1 || additionalGb > 10) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?redirect=/add-storage');
      return;
    }
    setProcessing(true);
    setStripeModal(null);
    try {
      const amount = PRICE_PER_GB * additionalGb;
      const res = await axios.post(
        getApiEndpoint('/api/payments/create-intent'),
        { memorialId: addForId, planType: 'storage-addon', additionalGb, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.clientSecret) {
        setStripeModal({
          clientSecret: res.data.clientSecret,
          paymentId: res.data.paymentId,
          amount
        });
      } else {
        setError(res.data?.message || 'שגיאה ביצירת תשלום');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה ביצירת תשלום');
    } finally {
      setProcessing(false);
    }
  };

  const formatGb = (bytes) => {
    if (bytes == null || !Number.isFinite(bytes)) return '—';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2);
  };

  if (loading) {
    return (
      <main className="add-storage-page">
        <div className="container">
          <p className="loading-msg"><FaSpinner className="spin" /> טוען...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="add-storage-page">
      <div className="container">
        <h1 className="page-title">
          <FaDatabase /> הוסף אחסון
        </h1>
        <div className="empty-state">
          <p>אפשרות רכישת תוספת אחסון (גיגה) אינה זמינה יותר.</p>
          <p>בכל התוכניות מוגבל האחסון לתמונות וסרטונים.</p>
          <Link to="/manage" className="btn btn-primary">חזרה לניהול דפי זיכרון</Link>
        </div>
        <div className="back-link">
          <Link to="/manage">← חזרה לניהול דפי זיכרון</Link>
        </div>
      </div>

      {stripeModal && (
        <StripePaymentModal
          clientSecret={stripeModal.clientSecret}
          paymentId={stripeModal.paymentId}
          amount={stripeModal.amount}
          onSuccess={() => {
            setStripeModal(null);
            setAddForId(null);
            fetchMemorials();
            navigate('/add-storage');
          }}
          onClose={() => setStripeModal(null)}
        />
      )}
    </main>
  );
}

export default AddStorage;
