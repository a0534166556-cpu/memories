import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FaHeart, FaCrown, FaCheckCircle, FaClock, FaSpinner, FaUser } from 'react-icons/fa';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import { memorialPageFeatures } from '../data/memorialFeatures';
import './SaveMemorial.css';

// כשנפתח מהאפליקציה (TWA) עם ?in_app=1 – לא להציג תשלום חיצוני (מדיניות Google Play)
function useHideExternalPayment() {
  const [searchParams] = useSearchParams();
  return useMemo(() => searchParams.get('in_app') === '1', [searchParams]);
}

function SaveMemorial() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hideExternalPayment = useHideExternalPayment();
  const [memorial, setMemorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
  const [stripeModal, setStripeModal] = useState(null);
  const [stripeAvailable, setStripeAvailable] = useState(false);
  const [StripeModalComponent, setStripeModalComponent] = useState(null);
  const [payplusAvailable, setPayplusAvailable] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMemorial();
    }
  }, [id]);

  useEffect(() => {
    const key = typeof import.meta !== 'undefined' && import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) return;
    import('@stripe/stripe-js').then(() => setStripeAvailable(true)).catch(() => {});
  }, []);

  useEffect(() => {
    axios.get(getApiEndpoint('/api/payment-methods')).then((r) => {
      if (r.data && r.data.success && r.data.payplus) setPayplusAvailable(true);
    }).catch(() => {});
  }, []);

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
        'monthly': { price: 12, name: 'מנוי חודשי' },
        'annual': { price: 100, name: 'שמירה שנתית' },
        'lifetime': { price: 399, name: 'תשלום חד פעמי (עם עריכה)' }
      };

      const plan = plans[planType];
      if (!plan) {
        setProcessing(false);
        return;
      }

      const requestUrl = getApiEndpoint('/api/payments/create');
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.trim()}`
      };

      if (import.meta.env?.DEV) {
        console.log('🔑 Token exists:', !!token);
        console.log('🌐 Request URL:', requestUrl);
        console.log('📦 Request body:', { memorialId: id, planType: planType, amount: plan.price });
      }

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

  const plansForStripe = {
    monthly: { price: 12 },
    annual: { price: 100 },
    lifetime: { price: 399 },
    'lifetime-premium': { price: 549 }
  };

  const handlePayPlusPayment = async (planType, preferBit = false) => {
    const token = localStorage.getItem('token');
    if (!token?.trim()) {
      alert('נדרש להתחבר כדי לבצע תשלום.');
      navigate(`/login?redirect=/save/${id}&plan=${planType}`);
      return;
    }
    const plan = plansForStripe[planType];
    if (!plan) return;
    setProcessing(true);
    try {
      const res = await axios.post(
        getApiEndpoint('/api/payments/create-payplus'),
        { memorialId: id, planType, amount: plan.price, preferBit },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.paymentLink) {
        window.location.href = res.data.paymentLink;
      } else {
        alert(res.data?.message || 'שגיאה ביצירת קישור תשלום');
        setProcessing(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה ביצירת קישור תשלום');
      setProcessing(false);
    }
  };

  const handleStripePayment = async (planType) => {
    const token = localStorage.getItem('token');
    if (!token?.trim()) {
      alert('נדרש להתחבר כדי לבצע תשלום.');
      navigate(`/login?redirect=/save/${id}&plan=${planType}`);
      return;
    }
    const plan = plansForStripe[planType];
    if (!plan) return;
    setProcessing(true);
    setStripeModal(null);
    try {
      const res = await axios.post(
        getApiEndpoint('/api/payments/create-intent'),
        { memorialId: id, planType, amount: plan.price },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.clientSecret) {
        setStripeModal({
          clientSecret: res.data.clientSecret,
          paymentId: res.data.paymentId,
          amount: plan.price
        });
        try {
          const mod = await import('../components/StripePaymentModal');
          setStripeModalComponent(() => mod.StripePaymentModal);
        } catch (e) {
          if (import.meta.env?.DEV) console.error(e);
          setStripeModal(null);
          alert('לא ניתן לטעון טופס התשלום. נסה שוב.');
        }
      } else {
        alert(res.data?.message || 'שגיאה ביצירת תשלום');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה ביצירת תשלום');
    } finally {
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
          {/* Option 1 - Temporary (Free, 24 hours) */}
          <div className="save-option basic">
            <div className="option-header">
              <FaClock className="option-icon" />
              <h2>שמירה זמנית</h2>
            </div>
            <div className="option-content">
              <p className="save-option-memorial-note">אם תבחר לשמור — הדף יכלול את כל האפשרויות המפורטות בתוכניות למטה.</p>
              <ul className="option-features">
                <li>הדף פעיל ל-24 שעות</li>
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

          {/* Option 2 - Monthly */}
          <div className="save-option annual">
            <div className="option-header">
              <FaHeart className="option-icon" />
              <h2>מנוי חודשי</h2>
            </div>
            <div className="option-content">
              <div className="option-price">
                <span className="price-amount">₪12</span>
                <span className="price-period">לחודש</span>
              </div>
              <div className="save-option-memorial-features">
                <h4 className="save-option-memorial-features-title">
                  <span className="memorial-features-title-emoji">✨</span>
                  מה כלול בדף הזיכרון
                </h4>
                <ul className="option-features memorial-features-inline">
                  {memorialPageFeatures.map((f, i) => {
                    const FeatureIcon = f.Icon;
                    return (
                      <li key={i} className="memorial-feature-row">
                        <span className="save-feature-icon-wrap">
                          <FeatureIcon className="save-feature-icon" />
                        </span>
                        <span>{f.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <h4 className="save-option-plan-benefits-title">יתרונות התוכנית:</h4>
              <ul className="option-features">
                <li>✅ הדף נשמר</li>
                <li>✅ אפשר לערוך ולהוסיף תכנים</li>
                <li>✅ QR נשאר פעיל</li>
                <li>✅ גמישות – ניתן להפסיק או להמשיך</li>
              </ul>
            </div>
            {hideExternalPayment ? (
              <p className="save-option-or" style={{ marginTop: '12px' }}>
                תשלום זמין בדפדפן.{' '}
                <a href="https://memoriesman.netlify.app" target="_blank" rel="noopener">גלשו לאתר</a>
              </p>
            ) : (
              <>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => handleSelectOption('monthly')}
                  disabled={processing}
                >
                  מנוי חודשי
                </button>
                {payplusAvailable && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline btn-full"
                      style={{ marginTop: '8px', fontSize: '0.9rem' }}
                      onClick={() => handlePayPlusPayment('monthly')}
                      disabled={processing}
                    >
                      או: כרטיס אשראי / Google Pay / Apple Pay (PayPlus)
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-full"
                      style={{ marginTop: '6px', fontSize: '0.9rem' }}
                      onClick={() => handlePayPlusPayment('monthly', true)}
                      disabled={processing}
                    >
                      או: ביט
                    </button>
                  </>
                )}
                {stripeAvailable && (
                  <button
                    type="button"
                    className="btn btn-outline btn-full"
                    style={{ marginTop: '8px', fontSize: '0.9rem' }}
                    onClick={() => handleStripePayment('monthly')}
                    disabled={processing}
                  >
                    או: כרטיס אשראי / Google Pay / Apple Pay
                  </button>
                )}
              </>
            )}
          </div>

          {/* Option 3 - Annual */}
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
              <div className="save-option-memorial-features">
                <h4 className="save-option-memorial-features-title">
                  <span className="memorial-features-title-emoji">✨</span>
                  מה כלול בדף הזיכרון
                </h4>
                <ul className="option-features memorial-features-inline">
                  {memorialPageFeatures.map((f, i) => {
                    const FeatureIcon = f.Icon;
                    return (
                      <li key={i} className="memorial-feature-row">
                        <span className="save-feature-icon-wrap">
                          <FeatureIcon className="save-feature-icon" />
                        </span>
                        <span>{f.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <h4 className="save-option-plan-benefits-title">יתרונות התוכנית:</h4>
              <ul className="option-features">
                <li>✅ הדף נשמר</li>
                <li>✅ אפשר לערוך ולהוסיף תכנים</li>
                <li>✅ QR נשאר פעיל</li>
                <li>✅ תמיכה בסיסית</li>
              </ul>
            </div>
            {hideExternalPayment ? (
              <p className="save-option-or" style={{ marginTop: '12px' }}>
                תשלום זמין בדפדפן.{' '}
                <a href="https://memoriesman.netlify.app" target="_blank" rel="noopener">גלשו לאתר</a>
              </p>
            ) : (
              <>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => handleSelectOption('annual')}
                  disabled={processing}
                >
                  שמור את הדף
                </button>
                {payplusAvailable && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline btn-full"
                      style={{ marginTop: '8px', fontSize: '0.9rem' }}
                      onClick={() => handlePayPlusPayment('annual')}
                      disabled={processing}
                    >
                      או: כרטיס אשראי / Google Pay / Apple Pay (PayPlus)
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-full"
                      style={{ marginTop: '6px', fontSize: '0.9rem' }}
                      onClick={() => handlePayPlusPayment('annual', true)}
                      disabled={processing}
                    >
                      או: ביט
                    </button>
                  </>
                )}
                {stripeAvailable && (
                  <button
                    type="button"
                    className="btn btn-outline btn-full"
                    style={{ marginTop: '8px', fontSize: '0.9rem' }}
                    onClick={() => handleStripePayment('annual')}
                    disabled={processing}
                  >
                    או: כרטיס אשראי / Google Pay / Apple Pay
                  </button>
                )}
              </>
            )}
          </div>

          {/* Option 3 - Lifetime with Edit (Recommended) */}
          <div className="save-option lifetime popular">
            <div className="popular-badge">המומלץ</div>
            <div className="option-header">
              <FaCrown className="option-icon" />
              <h2>תשלום חד פעמי</h2>
              <p className="option-subtitle">עם אפשרות עריכה</p>
            </div>
            <div className="option-content">
              <div className="option-price">
                <span className="price-amount">₪399</span>
                <span className="price-period">חד-פעמי</span>
              </div>
              <div className="save-option-memorial-features">
                <h4 className="save-option-memorial-features-title">
                  <span className="memorial-features-title-emoji">✨</span>
                  מה כלול בדף הזיכרון
                </h4>
                <ul className="option-features memorial-features-inline">
                  {memorialPageFeatures.map((f, i) => {
                    const FeatureIcon = f.Icon;
                    return (
                      <li key={i} className="memorial-feature-row">
                        <span className="save-feature-icon-wrap">
                          <FeatureIcon className="save-feature-icon" />
                        </span>
                        <span>{f.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <h4 className="save-option-plan-benefits-title">יתרונות התוכנית:</h4>
              <ul className="option-features">
                <li>✅ שמירה קבועה</li>
                <li>✅ עריכה חופשית</li>
                <li>✅ תחזוקת אתר 15₪ לשנה (חינם בשנתיים הראשונות, מתחייב מהשנה השלישית)</li>
                <li>✅ גיבוי • תמיכה מלאה</li>
              </ul>
            </div>
            {hideExternalPayment ? (
              <p className="save-option-or" style={{ marginTop: '12px' }}>
                תשלום זמין בדפדפן.{' '}
                <a href="https://memoriesman.netlify.app" target="_blank" rel="noopener">גלשו לאתר</a>
              </p>
            ) : (
              <>
                <button
                  className="btn btn-primary btn-full btn-highlight"
                  onClick={() => handleSelectOption('lifetime')}
                  disabled={processing}
                >
                  תשלום חד פעמי
                </button>
                {payplusAvailable && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline btn-full"
                      style={{ marginTop: '8px', fontSize: '0.9rem' }}
                      onClick={() => handlePayPlusPayment('lifetime')}
                      disabled={processing}
                    >
                      או: כרטיס אשראי / Google Pay / Apple Pay (PayPlus)
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-full"
                      style={{ marginTop: '6px', fontSize: '0.9rem' }}
                      onClick={() => handlePayPlusPayment('lifetime', true)}
                      disabled={processing}
                    >
                      או: ביט
                    </button>
                  </>
                )}
                {stripeAvailable && (
                  <button
                    type="button"
                    className="btn btn-outline btn-full"
                    style={{ marginTop: '8px', fontSize: '0.9rem' }}
                    onClick={() => handleStripePayment('lifetime')}
                    disabled={processing}
                  >
                    או: כרטיס אשראי / Google Pay / Apple Pay
                  </button>
                )}
              </>
            )}
          </div>

        </div>

        {stripeModal && StripeModalComponent && (
          <StripeModalComponent
            clientSecret={stripeModal.clientSecret}
            paymentId={stripeModal.paymentId}
            amount={stripeModal.amount}
            onSuccess={(redirectUrl) => {
              setStripeModal(null);
              setStripeModalComponent(null);
              navigate(redirectUrl);
            }}
            onClose={() => {
              setStripeModal(null);
              setStripeModalComponent(null);
            }}
          />
        )}

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
