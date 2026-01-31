import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import './Login.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await axios.post(getApiEndpoint('/api/auth/forgot-password'), { email: email.trim() });
      if (response.data.success) {
        setMessage(response.data.message);
        setEmail('');
      } else {
        setError(response.data.message || 'אירעה שגיאה.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'אירעה שגיאה. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page" role="main">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>שכחתי סיסמה</h1>
            <p>הזן את כתובת האימייל שלך ונשלח אליך קישור לאיפוס הסיסמה</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message" style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', color: '#2e7d32', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>{message}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">
                <FaEnvelope className="icon" /> אימייל
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                disabled={!!message}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || !!message}>
              {loading ? 'שולח...' : message ? 'נשלח' : 'שלח קישור לאיפוס סיסמה'}
            </button>
          </form>

          <div className="login-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/login">חזרה להתחברות</Link>
          </div>
          <div className="login-links" style={{ marginTop: '16px' }}>
            <Link to="/">דף הבית</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ForgotPassword;
