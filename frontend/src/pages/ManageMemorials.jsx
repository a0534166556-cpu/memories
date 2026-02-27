import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import { FaSpinner, FaEdit, FaEye, FaLock, FaTrash, FaInfinity } from 'react-icons/fa';
import { StripePaymentModal, isStripeAvailable } from '../components/StripePaymentModal';
import './ManageMemorials.css';

const SITE_URL = 'https://memoriesman.netlify.app';

function ManageMemorials() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hideExternalPayment = useMemo(() => searchParams.get('in_app') === '1', [searchParams]);
  const [memorials, setMemorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [grantingId, setGrantingId] = useState(null);
  const [payingMaintenanceId, setPayingMaintenanceId] = useState(null);
  const [extendingMonthlyId, setExtendingMonthlyId] = useState(null);
  const [stripeModal, setStripeModal] = useState(null);

  useEffect(() => {
    fetchMemorials();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAdmin(false);
      return;
    }

    try {
      const response = await axios.get(getApiEndpoint('/api/auth/me'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (import.meta.env?.DEV) {
        console.log('Admin check - API response:', response.data);
      }
      if (response.data.success && response.data.user) {
        const userEmail = response.data.user.email;
        const normalizedUserEmail = userEmail ? userEmail.toLowerCase().trim() : '';
        const adminEmail = 'a0534166556@gmail.com';
        const isAdminUser = normalizedUserEmail === adminEmail;
        if (import.meta.env?.DEV) {
          console.log('Admin check - Is admin:', isAdminUser);
        }
        setIsAdmin(isAdminUser);
      } else {
        if (import.meta.env?.DEV) console.log('Admin check - No user data in response');
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    }
  };

  const fetchMemorials = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('נדרש להתחבר כדי לראות את דפי הזיכרון שלך');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get memorial IDs from localStorage (created before login or without login)
      const myMemorialIds = JSON.parse(localStorage.getItem('myMemorialIds') || '[]');
      
      // Build query with localStorage IDs if any
      let url = getApiEndpoint('/api/memorials/user/my');
      if (myMemorialIds && myMemorialIds.length > 0) {
        url += `?ids=${encodeURIComponent(JSON.stringify(myMemorialIds))}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const fetchedMemorials = response.data.memorials || [];
        
        // Link memorials to user account if they don't have userId yet
        // This ensures temporary memorials created before login are linked to the account
        const unlinkedMemorials = fetchedMemorials.filter(m => !m.userId && m.status === 'temporary');
        if (unlinkedMemorials.length > 0) {
          // Try to link them (silent, no error if fails)
          try {
            const linkResponse = await axios.post(
              getApiEndpoint('/api/memorials/link-to-user'),
              { memorialIds: unlinkedMemorials.map(m => m.id) },
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            
            if (linkResponse.data.success && linkResponse.data.linkedCount > 0) {
              if (import.meta.env?.DEV) {
                console.log(`✅ Linked ${linkResponse.data.linkedCount} temporary memorial(s) to user account`);
              }
              // Re-fetch to get updated list with userId linked
              const refreshedResponse = await axios.get(url, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (refreshedResponse.data.success) {
                setMemorials(refreshedResponse.data.memorials || []);
                return;
              }
            }
          } catch (linkErr) {
            if (import.meta.env?.DEV) console.warn('Could not link memorials to user account:', linkErr);
            // Continue with unlinked memorials - they'll still show up
          }
        }
        
        setMemorials(fetchedMemorials);
      } else {
        setError('שגיאה בטעינת דפי הזיכרון');
      }
    } catch (err) {
      console.error('Error fetching memorials:', err);
      if (err.response?.status === 401) {
        setError('ההתחברות פגה. אנא התחבר שוב');
        localStorage.removeItem('token');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (err.response?.status === 503) {
        setError('השרת זמנית לא זמין. אנא נסה שוב בעוד כמה רגעים');
      } else {
        setError('שגיאה בטעינת דפי הזיכרון. אנא נסה שוב');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status, expiryDate, canEdit) => {
    if (status === 'lifetime') {
      return { text: 'שמירה לצמיתות', className: 'status-lifetime' };
    }
    if (status === 'active' || status === 'annual') {
      return { text: 'שמירה שנתית', className: 'status-active' };
    }
    if (status === 'temporary') {
      if (expiryDate && new Date(expiryDate) < new Date()) {
        return { text: 'פג תוקף', className: 'status-expired' };
      }
      return { text: 'זמני', className: 'status-temporary' };
    }
    return { text: 'לא ידוע', className: 'status-default' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'לא צוין';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDelete = async (memorialId) => {
    if (!window.confirm('האם אתה בטוח שאתה רוצה למחוק את דף הזיכרון הזה? פעולה זו לא ניתנת לביטול.')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('נדרש להתחבר כדי למחוק דף זיכרון');
      return;
    }

    try {
      // Get memorial IDs from localStorage to verify ownership for temporary memorials
      const myMemorialIds = JSON.parse(localStorage.getItem('myMemorialIds') || '[]');
      
      const response = await axios.delete(getApiEndpoint(`/api/memorials/${memorialId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Memorial-Ids': JSON.stringify(myMemorialIds)
        }
      });

      if (response.data.success) {
        // Remove from localStorage if it was there
        const updatedIds = myMemorialIds.filter(id => id !== memorialId);
        localStorage.setItem('myMemorialIds', JSON.stringify(updatedIds));
        
        // Refresh the list
        fetchMemorials();
      } else {
        alert('שגיאה במחיקת דף הזיכרון: ' + (response.data.message || 'שגיאה לא ידועה'));
      }
    } catch (err) {
      console.error('Error deleting memorial:', err);
      const errorMessage = err.response?.data?.message || err.message || 'שגיאה לא ידועה';
      alert('שגיאה במחיקת דף הזיכרון: ' + errorMessage);
    }
  };

  const handleGrantLifetime = async (memorialId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!window.confirm('להעניק שמירה חד פעמית לדף הזיכרון הזה?')) return;

    setGrantingId(memorialId);
    try {
      const response = await axios.patch(
        getApiEndpoint(`/api/memorials/${memorialId}/grant-lifetime`),
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data.success) {
        await fetchMemorials();
      } else {
        alert('שגיאה: ' + (response.data.message || 'לא ניתן להעניק שמירה לצמיתות'));
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'שגיאה לא ידועה';
      alert('שגיאה בהענקת שמירה לצמיתות: ' + msg);
    } finally {
      setGrantingId(null);
    }
  };

  const handlePayMaintenance = async (memorialId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setPayingMaintenanceId(memorialId);
    try {
      const res = await axios.post(
        getApiEndpoint('/api/payments/create'),
        { memorialId, planType: 'maintenance', amount: 15 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.approveUrl) {
        window.location.href = res.data.approveUrl;
      } else {
        alert(res.data?.message || 'שגיאה ביצירת תשלום תחזוקה');
        setPayingMaintenanceId(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה ביצירת תשלום תחזוקה');
      setPayingMaintenanceId(null);
    }
  };

  const handleStripeMaintenance = async (memorialId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setStripeModal(null);
    try {
      const res = await axios.post(
        getApiEndpoint('/api/payments/create-intent'),
        { memorialId, planType: 'maintenance', amount: 15 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.clientSecret) {
        setStripeModal({
          clientSecret: res.data.clientSecret,
          paymentId: res.data.paymentId,
          amount: 15
        });
      } else {
        alert(res.data?.message || 'שגיאה ביצירת תשלום');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה ביצירת תשלום תחזוקה');
    }
  };

  const handleExtendMonthly = async (memorialId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setExtendingMonthlyId(memorialId);
    try {
      const res = await axios.post(
        getApiEndpoint('/api/payments/create'),
        { memorialId, planType: 'monthly', amount: 12 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.approveUrl) {
        window.location.href = res.data.approveUrl;
      } else {
        alert(res.data?.message || 'שגיאה ביצירת תשלום');
        setExtendingMonthlyId(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה ביצירת תשלום');
      setExtendingMonthlyId(null);
    }
  };

  const handleStripeExtendMonthly = async (memorialId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setStripeModal(null);
    try {
      const res = await axios.post(
        getApiEndpoint('/api/payments/create-intent'),
        { memorialId, planType: 'monthly', amount: 12 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.clientSecret) {
        setStripeModal({
          clientSecret: res.data.clientSecret,
          paymentId: res.data.paymentId,
          amount: 12
        });
      } else {
        alert(res.data?.message || 'שגיאה ביצירת תשלום');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה ביצירת תשלום');
    }
  };

  const handleCleanupTestMemorials = async () => {
    if (!window.confirm('האם אתה בטוח שאתה רוצה למחוק את כל דפי הבדיקה הישנים (ללא משתמש)? פעולה זו לא ניתנת לביטול.')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('נדרש להתחבר. אנא התחבר מחדש.');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.delete(getApiEndpoint('/api/memorials/cleanup/test'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(response.data.message || `נמחקו ${response.data.deletedCount} דפי בדיקה ישנים`);
        fetchMemorials();
      } else {
        alert('שגיאה במחיקת דפי הבדיקה');
      }
    } catch (err) {
      console.error('Error cleaning up test memorials:', err);
      alert('שגיאה במחיקת דפי הבדיקה: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteAllMemorials = async () => {
    const total = memorials.length;
    if (total === 0) {
      alert('אין דפי זיכרון למחוק.');
      return;
    }
    const msg = `אזהרה: אתה עומד למחוק את כל ${total} דפי הזיכרון במערכת.\nפעולה זו לא ניתנת לביטול.\n\nלהמשיך?`;
    if (!window.confirm(msg)) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('נדרש להתחבר. אנא התחבר מחדש.');
      navigate('/login');
      return;
    }
    try {
      const response = await axios.delete(getApiEndpoint('/api/memorials/cleanup/all'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        alert(response.data.message || `נמחקו ${response.data.deletedCount} דפי זיכרון`);
        fetchMemorials();
      } else {
        alert(response?.data?.message || 'שגיאה במחיקת דפי הזיכרון');
      }
    } catch (err) {
      console.error('Error deleting all memorials:', err);
      alert('שגיאה: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="manage-memorials-page">
        <div className="manage-container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <FaSpinner className="spinner-large" />
            <h2 style={{ color: 'white', marginTop: '20px' }}>טוען את דפי הזיכרון שלך...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-memorials-page">
        <div className="manage-container">
          <div className="error-message">{error}</div>
          {!localStorage.getItem('token') && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', padding: '12px 24px' }}>
                התחבר
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="manage-memorials-page">
      <div className="manage-container">
        <div className="manage-header">
          <h1>ניהול דפי זיכרון</h1>
          <p className="subtitle">כל דפי הזיכרון שיצרת</p>
        </div>

        {memorials.length === 0 ? (
          <div className="no-memorials">
            <h2>עדיין לא יצרת דפי זיכרון</h2>
            <p>התחל ליצור דף זיכרון דיגיטלי ראשון</p>
            <Link to="/create" className="btn btn-primary" style={{ display: 'inline-block', padding: '12px 24px', marginTop: '20px' }}>
              צור דף זיכרון חדש
            </Link>
          </div>
        ) : (
          <>
            <div className="actions-bar">
              <Link to="/create" className="btn btn-primary" style={{ display: 'inline-block', padding: '12px 24px', marginLeft: '10px' }}>
                צור דף זיכרון חדש
              </Link>
              {isAdmin && (
                <>
                  <button
                    onClick={handleDeleteAllMemorials}
                    className="btn btn-outline"
                    style={{ display: 'inline-block', padding: '12px 24px', marginRight: '10px', background: '#dc3545', color: '#fff', borderColor: '#dc3545' }}
                  >
                    <FaTrash style={{ marginLeft: '5px' }} />
                    מחק את כל דפי הזיכרון
                  </button>
                  <button
                    onClick={handleCleanupTestMemorials}
                    className="btn btn-outline"
                    style={{ display: 'inline-block', padding: '12px 24px', marginRight: '10px', background: '#fff', color: '#856404', borderColor: '#856404' }}
                  >
                    <FaTrash style={{ marginLeft: '5px' }} />
                    מחק דפי בדיקה ישנים (ללא משתמש)
                  </button>
                </>
              )}
            </div>

            <div className="memorials-grid">
              {memorials.map((memorial) => {
                const statusInfo = getStatusText(memorial.status, memorial.expiryDate, memorial.canEdit);
                const isPaid = memorial.status && memorial.status !== 'temporary';
                const isLifetime = isPaid && !memorial.expiryDate;
                const maintenanceDue = isLifetime && memorial.maintenance_paid_until != null && new Date(memorial.maintenance_paid_until) < new Date();
                const isExpiredPaid = isPaid && memorial.expiryDate && new Date(memorial.expiryDate) < new Date();
                return (
                  <div key={memorial.id} className="memorial-card">
                    <div className="card-header">
                      <h3>{memorial.hebrewName || memorial.name}</h3>
                      <span className={`status-badge ${statusInfo.className}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <div className="card-body">
                      {memorial.name && memorial.name !== memorial.hebrewName && (
                        <div className="memorial-name">{memorial.name}</div>
                      )}
                      <div className="created-date">
                        נוצר: {formatDate(memorial.createdAt)}
                      </div>
                      {memorial.expiryDate && memorial.status === 'temporary' && (
                        <div className="created-date">
                          תפוגה: {formatDate(memorial.expiryDate)}
                        </div>
                      )}
                      {memorial.status === 'temporary' && !memorial.userId && (
                        <div className="no-edit-warning" style={{ color: '#2196F3', background: '#e3f2fd', padding: '5px 10px', borderRadius: '4px', fontSize: '0.85rem' }}>
                          <span>📌 דף זמני - יקושר לחשבונך אוטומטית</span>
                        </div>
                      )}
                      {memorial.canEdit === 0 && (
                        <div className="no-edit-warning">
                          <FaLock style={{ fontSize: '0.8rem' }} />
                          <span>לא ניתן לערוך דף זה</span>
                        </div>
                      )}
                      {!memorial.userId && isAdmin && memorial.status !== 'temporary' && (
                        <div className="no-edit-warning" style={{ color: '#f57c00' }}>
                          <span>⚠️ דף בדיקה ישן (ללא משתמש)</span>
                        </div>
                      )}
                      {maintenanceDue && (
                        <div className="no-edit-warning" style={{ color: '#856404', background: '#fff3cd', padding: '6px 10px', borderRadius: '6px', fontSize: '0.9rem' }}>
                          <span>חייב בתשלום תחזוקה 15₪ לשנה</span>
                        </div>
                      )}
                      {isExpiredPaid && (
                        <div className="no-edit-warning" style={{ color: '#721c24', background: '#f8d7da', padding: '6px 10px', borderRadius: '6px', fontSize: '0.9rem' }}>
                          <span>מנוי פג תוקף – הארך בחודש (15₪) או בחר תוכנית אחרת</span>
                        </div>
                      )}
                    </div>
                    <div className="card-actions">
                      <Link
                        to={`/memorial/${memorial.id}`}
                        className="btn btn-outline"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaEye style={{ marginLeft: '5px' }} />
                        צפה
                      </Link>
                      {memorial.canEdit === 1 ? (
                        <Link
                          to={`/edit/${memorial.id}`}
                          className="btn btn-primary"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <FaEdit style={{ marginLeft: '5px' }} />
                          ערוך
                        </Link>
                      ) : (
                        <button className="btn btn-disabled" disabled>
                          <FaLock style={{ marginLeft: '5px' }} />
                          נעול
                        </button>
                      )}
                      {isAdmin && memorial.status !== 'lifetime' && (
                        <button
                          onClick={() => handleGrantLifetime(memorial.id)}
                          disabled={grantingId === memorial.id}
                          className="btn btn-outline"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#e8f5e9',
                            color: '#2e7d32',
                            borderColor: '#2e7d32'
                          }}
                          title="הענק שמירה חד פעמית"
                        >
                          {grantingId === memorial.id ? (
                            <>מעניק…</>
                          ) : (
                            <>
                              <FaInfinity style={{ marginLeft: '5px' }} />
                              חד פעמי
                            </>
                          )}
                        </button>
                      )}
                      {/* Users can delete their own memorials, admins can delete any */}
                      <button
                        onClick={() => handleDelete(memorial.id)}
                        className="btn btn-outline"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: '#fff',
                          color: '#dc3545',
                          borderColor: '#dc3545'
                        }}
                      >
                        <FaTrash style={{ marginLeft: '5px' }} />
                        מחק
                      </button>
                      {maintenanceDue && (
                        <>
                          {hideExternalPayment ? (
                            <p style={{ fontSize: '0.9rem', margin: '8px 0' }}>
                              תשלום זמין בדפדפן.{' '}
                              <a href={SITE_URL} target="_blank" rel="noopener">גלשו לאתר</a>
                            </p>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePayMaintenance(memorial.id)}
                                disabled={payingMaintenanceId === memorial.id}
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                {payingMaintenanceId === memorial.id ? 'מעביר לתשלום...' : 'שלם תחזוקה 15₪ (PayPal)'}
                              </button>
                              {isStripeAvailable() && (
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  style={{ fontSize: '0.85rem', marginTop: '4px' }}
                                  onClick={() => handleStripeMaintenance(memorial.id)}
                                >
                                  או: כרטיס / Google Pay / Apple Pay
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                      {isExpiredPaid && (
                        <>
                          {hideExternalPayment ? (
                            <p style={{ fontSize: '0.9rem', margin: '8px 0' }}>
                              תשלום זמין בדפדפן.{' '}
                              <a href={SITE_URL} target="_blank" rel="noopener">גלשו לאתר</a>
                            </p>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleExtendMonthly(memorial.id)}
                                disabled={extendingMonthlyId === memorial.id}
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}
                              >
                                {extendingMonthlyId === memorial.id ? 'מעביר לתשלום...' : 'הארך מנוי חודשי 15₪ (PayPal)'}
                              </button>
                              {isStripeAvailable() && (
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  style={{ fontSize: '0.85rem', marginTop: '4px' }}
                                  onClick={() => handleStripeExtendMonthly(memorial.id)}
                                >
                                  או: כרטיס / Google Pay / Apple Pay
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {stripeModal && (
          <StripePaymentModal
            clientSecret={stripeModal.clientSecret}
            paymentId={stripeModal.paymentId}
            amount={stripeModal.amount}
            onSuccess={() => {
              setStripeModal(null);
              fetchMemorials();
            }}
            onClose={() => setStripeModal(null)}
          />
        )}
      </div>
    </div>
  );
}

export default ManageMemorials;
