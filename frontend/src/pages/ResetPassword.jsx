import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import './Login.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(!!token);

  useEffect(() => {
    if (!token) setValidToken(false);
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.newPassword !== formData.confirmPassword) {
      setError('הסיסמאות לא תואמות');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('סיסמה חייבת להיות לפחות 6 תווים');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(getApiEndpoint('/api/auth/reset-password'), {
        token,
        newPassword: formData.newPassword
      });
      if (response.data.success) {
        setMessage(response.data.message);
        setFormData({ newPassword: '', confirmPassword: '' });
      } else {
        setError(response.data.message || 'אירעה שגיאה.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'אירעה שגיאה. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <main className="login-page" role="main">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <h1>איפוס סיסמה</h1>
              <p>קישור איפוס לא תקף או חסר. נא לבקש קישור חדש מדף שכחתי סיסמה.</p>
            </div>
            <div className="login-links">
              <Link to="/forgot-password">בקשת קישור חדש</Link>
              <Link to="/login">התחברות</Link>
              <Link to="/">דף הבית</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page" role="main">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>הגדר סיסמה חדשה</h1>
            <p>הזן סיסמה חדשה (לפחות 6 תווים)</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && (
            <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', color: '#2e7d32', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
              {message}
              <br />
              <Link to="/login" style={{ marginTop: '8px', display: 'inline-block' }}>התחבר עכשיו</Link>
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="newPassword">
                  <FaLock className="icon" /> סיסמה חדשה
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  placeholder="לפחות 6 תווים"
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <FaLock className="icon" /> אמת סיסמה
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="הכנס שוב את הסיסמה"
                  minLength="6"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'מעדכן...' : 'עדכן סיסמה'}
              </button>
            </form>
          )}

          <div className="login-links" style={{ marginTop: '20px' }}>
            <Link to="/login">התחברות</Link>
            <Link to="/">דף הבית</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ResetPassword;
