import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaHeart, FaCrown, FaCheckCircle, FaClock, FaSpinner, FaUser } from 'react-icons/fa';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import './SaveMemorial.css';

function SaveMemorial() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [memorial, setMemorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);

  useEffect(() => {
    if (id) {
      fetchMemorial();
    }
  }, [id]);

  const fetchMemorial = async () => {
    try {
      const response = await axios.get(getApiEndpoint(`/api/memorials/${id}`));
      if (response.data.success) {
        setMemorial(response.data.memorial);
        if (response.data.memorial.expiryDate) {
          const expiry = new Date(response.data.memorial.expiryDate);
          setExpiryDate(expiry);
        }
      }
    } catch (error) {
      console.error('Error fetching memorial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (planType) => {
    if (planType === 'skip') {
      // Skip payment - continue to memorial page
      navigate(`/memorial/${id}`);
      return;
    }

    // Get token fresh from localStorage
    const token = localStorage.getItem('token');
    
    if (!token || !token.trim()) {
      // No token - redirect to login
      alert('נדרש להתחבר כדי לבצע תשלום. תועבר לדף ההתחברות...');
      navigate(`/login?redirect=/save/${id}&plan=${planType}`);
      return;
    }

    setProcessing(true);

    try {
      const plans = {
        'annual': { price: 100, name: 'שמירה שנתית' },
        'lifetime': { price: 445, name: 'הנצחה חד פעמית (עם עריכה)' },
        'lifetime-no-edit': { price: 375, name: 'הנצחה חד פעמית (בלי עריכה)' },
        'lifetime-premium': { price: 699, name: 'הנצחה פרימיום (7 גיגה)' }
      };

      const plan = plans[planType];
      if (!plan) {
        setProcessing(false);
        return;
      }

      // Debug: Log token before sending
      console.log('🔑 Token exists:', !!token);
      console.log('🔑 Token length:', token ? token.length : 0);
      console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'none');
      
      const requestUrl = getApiEndpoint('/api/payments/create');
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.trim()}`
      };
      
      console.log('🌐 Request URL:', requestUrl);
      console.log('📋 Request headers:', JSON.stringify(requestHeaders, null, 2));
      console.log('📦 Request body:', { memorialId: id, planType: planType, amount: plan.price });
      
      // Create payment with PayPal
      const response = await axios.post(
        requestUrl,
        {
          memorialId: id,
          planType: planType,
          amount: plan.price
        },
        {
          headers: requestHeaders
        }
      );

      if (response.data.success && response.data.approveUrl) {
        // Redirect to PayPal
        window.location.href = response.data.approveUrl;
      } else {
        alert('אירעה שגיאה ביצירת התשלום');
        setProcessing(false);
      }
    } catch (err) {
      console.error('Payment creation error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      if (err.response?.status === 401) {
        // Token expired or invalid - clear and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('ההתחברות פגה. אנא התחבר שוב.');
        navigate(`/login?redirect=/save/${id}&plan=${planType}`);
      } else {
        alert(err.response?.data?.message || 'אירעה שגיאה ביצירת התשלום');
      }
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="save-memorial-page">
        <div className="save-container">
          <FaSpinner className="spinner-large" />
          <p>טוען...</p>
        </div>
      </main>
    );
  }

  if (!memorial) {
    return (
      <main className="save-memorial-page">
        <div className="save-container">
          <h1>דף זיכרון לא נמצא</h1>
          <Link to="/" className="btn btn-primary">חזרה לדף הבית</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="save-memorial-page">
      <div className="save-container">
        <div className="save-header">
          <FaCheckCircle className="success-icon" />
          <h1>הדף מוכן 🤍</h1>
          <p className="save-subtitle">
            יצרת דף זיכרון מכבד.
            <br />
            כדי לשמור אותו, לערוך בעתיד
            <br />
            ולוודא שיישאר זמין לאורך זמן —
            <br />
            יש לבחור אפשרות המשך.
          </p>
          
          {/* Registration suggestion for editing */}
          {!localStorage.getItem('token') && (
            <div className="registration-suggestion">
              <FaUser className="suggestion-icon" />
              <div className="suggestion-text">
                <strong>רוצה לערוך את הדף בעתיד?</strong>
                <p>הירשם עכשיו בחינם כדי לשמור את הדף שלך ולערוך אותו בכל עת</p>
              </div>
              <Link to={`/login?redirect=/save/${id}`} className="btn btn-outline">
                הירשם עכשיו (חינם)
              </Link>
            </div>
          )}
        </div>

        <div className="save-options">
          {/* Option 1 - Temporary (Free, 48 hours) */}
          <div className="save-option basic">
            <div className="option-header">
              <FaClock className="option-icon" />
              <h2>שמירה זמנית</h2>
            </div>
            <div className="option-content">
              <ul className="option-features">
                <li>הדף פעיל ל-48 שעות</li>
                <li>ללא עריכה עתידית</li>
                {expiryDate && (
                  <li className="expiry-info">
                    יפוג ב-{expiryDate.toLocaleDateString('he-IL', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </li>
                )}
              </ul>
            </div>
            <button
              className="btn btn-secondary btn-full"
              onClick={() => handleSelectOption('skip')}
              disabled={processing}
            >
              המשך ללא שמירה
            </button>
            {!localStorage.getItem('token') && (
              <Link 
                to={`/login?redirect=/memorial/${id}`} 
                className="btn btn-outline btn-full"
                style={{ marginTop: '10px' }}
              >
                <FaUser /> הירשם לעריכה בעתיד (חינם)
              </Link>
            )}
          </div>

          {/* Option 2 - Annual */}
          <div className="save-option annual">
            <div className="option-header">
              <FaHeart className="option-icon" />
              <h2>שמירה וניהול שנתי</h2>
            </div>
            <div className="option-content">
              <div className="option-price">
                <span className="price-amount">₪100</span>
                <span className="price-period">לשנה</span>
              </div>
              <ul className="option-features">
                <li>✅ הדף נשמר</li>
                <li>✅ אפשר לערוך ולהוסיף תכנים</li>
                <li>✅ QR נשאר פעיל</li>
                <li>✅ תמיכה בסיסית</li>
              </ul>
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={() => handleSelectOption('annual')}
              disabled={processing}
            >
              שמור את הדף
            </button>
          </div>

          {/* Option 3 - Lifetime with Edit (Recommended) */}
          <div className="save-option lifetime popular">
            <div className="popular-badge">המומלץ</div>
            <div className="option-header">
              <FaCrown className="option-icon" />
              <h2>הנצחה חד פעמית</h2>
              <p className="option-subtitle">עם אפשרות עריכה</p>
            </div>
            <div className="option-content">
              <div className="option-price">
                <span className="price-amount">₪445</span>
                <span className="price-period">חד-פעמי</span>
              </div>
              <ul className="option-features">
                <li>✅ שמירה קבועה</li>
                <li>✅ עריכה חופשית</li>
                <li>✅ תחזוקת אתר 45₪ (כלול)</li>
                <li>✅ עד 2 גיגה תמונות וסרטונים</li>
                <li>✅ גיבוי • תמיכה מלאה</li>
              </ul>
            </div>
            <button
              className="btn btn-primary btn-full btn-highlight"
              onClick={() => handleSelectOption('lifetime')}
              disabled={processing}
            >
              הנצחה חד פעמית
            </button>
          </div>

          {/* Option 4 - Lifetime without Edit */}
          <div className="save-option lifetime-no-edit">
            <div className="option-header">
              <FaCrown className="option-icon" />
              <h2>הנצחה חד פעמית</h2>
              <p className="option-subtitle">בלי אפשרות עריכה</p>
            </div>
            <div className="option-content">
              <div className="option-price">
                <span className="price-amount">₪375</span>
                <span className="price-period">חד-פעמי</span>
              </div>
              <ul className="option-features">
                <li>✅ שמירה קבועה</li>
                <li>❌ ללא אפשרות עריכה</li>
                <li>✅ תחזוקת אתר 45₪ (כלול)</li>
                <li>✅ עד 2 גיגה תמונות וסרטונים</li>
                <li>✅ גיבוי • תמיכה בסיסית • QR פעיל</li>
              </ul>
            </div>
            <button
              className="btn btn-secondary btn-full"
              onClick={() => handleSelectOption('lifetime-no-edit')}
              disabled={processing}
            >
              הנצחה חד פעמית
            </button>
          </div>

          {/* Option 5 - Lifetime Premium 7GB */}
          <div className="save-option lifetime-premium">
            <div className="option-header">
              <FaCrown className="option-icon" />
              <h2>הנצחה פרימיום</h2>
              <p className="option-subtitle">עד 7 גיגה אחסון</p>
            </div>
            <div className="option-content">
              <div className="option-price">
                <span className="price-amount">₪699</span>
                <span className="price-period">חד-פעמי</span>
              </div>
              <ul className="option-features">
                <li>✅ שמירה קבועה</li>
                <li>✅ עריכה חופשית</li>
                <li>✅ תחזוקת אתר 45₪ (כלול)</li>
                <li>✅ עד 7 גיגה תמונות וסרטונים</li>
                <li>✅ גיבוי • תמיכה מלאה</li>
              </ul>
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={() => handleSelectOption('lifetime-premium')}
              disabled={processing}
            >
              הנצחה פרימיום
            </button>
          </div>
        </div>

        <div className="save-footer">
          <Link to={`/memorial/${id}`} className="view-link">
            צפה בדף הזיכרון
          </Link>
        </div>
      </div>
    </main>
  );
}

export default SaveMemorial;
