import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await axios.post(getApiEndpoint('/api/auth/login'), {
          email: formData.email,
          password: formData.password
        });

        if (response.data.success) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          navigate(redirectTo);
        }
      } else {
        // Signup
        if (formData.password !== formData.confirmPassword) {
          setError('הסיסמאות לא תואמות');
          setLoading(false);
          return;
        }

        const response = await axios.post(getApiEndpoint('/api/auth/signup'), {
          name: formData.name,
          email: formData.email,
          password: formData.password
        });

        if (response.data.success) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          navigate(redirectTo);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'אירעה שגיאה. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page" role="main">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>{isLogin ? 'התחברות' : 'הרשמה'}</h1>
            <p>
              {isLogin 
                ? 'ברוך הבא! התחבר לחשבון שלך'
                : 'צור חשבון חדש והתחל ליצור דפי זיכרון'
              }
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">
                  <FaUser className="icon" /> שם מלא
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="הכנס את שמך המלא"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">
                <FaEnvelope className="icon" /> אימייל
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <FaLock className="icon" /> סיסמה
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="הכנס סיסמה"
                minLength="6"
              />
            </div>

            {!isLogin && (
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
            )}

            {isLogin && (
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  זכור אותי
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  שכחת סיסמה?
                </Link>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'מעבד...' : (isLogin ? 'התחבר' : 'הירשם')}
            </button>
          </form>

          <div className="login-footer">
            <p>
              {isLogin ? 'עדיין אין לך חשבון? ' : 'כבר יש לך חשבון? '}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({
                    email: '',
                    password: '',
                    name: '',
                    confirmPassword: ''
                  });
                }}
              >
                {isLogin ? 'הירשם עכשיו' : 'התחבר'}
              </button>
            </p>
          </div>

          <div className="login-links">
            <Link to="/">חזרה לדף הבית</Link>
            <Link to="/pricing">צפה בתמחור</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;
