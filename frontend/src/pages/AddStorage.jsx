import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import { FaSpinner, FaDatabase, FaPlus } from 'react-icons/fa';
import './AddStorage.css';

const PRICE_PER_GB = 49;

function AddStorage() {
  const navigate = useNavigate();
  const [memorials, setMemorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [addForId, setAddForId] = useState(null);
  const [additionalGb, setAdditionalGb] = useState(1);

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
          <FaDatabase /> הוסף אחסון לדף זיכרון
        </h1>
        <p className="page-intro">
          ניתן לרכוש תוספת של גיגה (49₪ לגיגה) לדפים שכבר נשמרו במסלול בתשלום.
        </p>
        {error && <div className="alert alert-error">{error}</div>}

        {memorials.length === 0 ? (
          <div className="empty-state">
            <p>אין לך דפי זיכרון במסלול בתשלום.</p>
            <p>אפשרות זו זמינה רק אחרי רכישת תוכנית שמירה.</p>
            <Link to="/manage" className="btn btn-primary">ניהול דפי זיכרון</Link>
          </div>
        ) : (
          <div className="storage-list">
            {memorials.map((m) => {
              const usedGb = formatGb(Number(m.media_used_bytes));
              const limitBytes = Number(m.media_limit_bytes) || 2 * 1024 * 1024 * 1024;
              const limitGb = formatGb(limitBytes);
              const isOpen = addForId === m.id;
              return (
                <div key={m.id} className="storage-card">
                  <div className="storage-card-header">
                    <h2>{m.name || m.hebrewName || 'דף זיכרון'}</h2>
                    <span className="storage-usage">שימוש: {usedGb} / {limitGb} גיגה</span>
                  </div>
                  {!isOpen ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => { setAddForId(m.id); setAdditionalGb(1); setError(''); }}
                    >
                      <FaPlus /> הוסף גיגה
                    </button>
                  ) : (
                    <div className="add-form">
                      <label>
                        מספר גיגה (49₪ לגיגה):
                        <select
                          value={additionalGb}
                          onChange={(e) => setAdditionalGb(Number(e.target.value))}
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(n => (
                            <option key={n} value={n}>{n} גיגה — ₪{PRICE_PER_GB * n}</option>
                          ))}
                        </select>
                      </label>
                      <div className="add-form-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handlePurchaseAddon}
                          disabled={processing}
                        >
                          {processing ? 'מעביר לתשלום...' : `שלם ₪${PRICE_PER_GB * additionalGb}`}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setAddForId(null)}
                          disabled={processing}
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="back-link">
          <Link to="/manage">← חזרה לניהול דפי זיכרון</Link>
        </div>
      </div>
    </main>
  );
}

export default AddStorage;
