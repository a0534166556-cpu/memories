import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import { FaSpinner, FaEdit, FaEye, FaLock } from 'react-icons/fa';
import './ManageMemorials.css';

function ManageMemorials() {
  const navigate = useNavigate();
  const [memorials, setMemorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMemorials();
  }, []);

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
      const response = await axios.get(getApiEndpoint('/api/memorials/user/my'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setMemorials(response.data.memorials || []);
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
              <Link to="/create" className="btn btn-primary" style={{ display: 'inline-block', padding: '12px 24px' }}>
                צור דף זיכרון חדש
              </Link>
            </div>

            <div className="memorials-grid">
              {memorials.map((memorial) => {
                const statusInfo = getStatusText(memorial.status, memorial.expiryDate, memorial.canEdit);
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
                      {memorial.canEdit === 0 && (
                        <div className="no-edit-warning">
                          <FaLock style={{ fontSize: '0.8rem' }} />
                          <span>לא ניתן לערוך דף זה</span>
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
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ManageMemorials;
