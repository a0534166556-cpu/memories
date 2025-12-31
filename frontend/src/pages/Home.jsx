import { Link } from 'react-router-dom';
import { FaPlus, FaQrcode, FaHeart, FaImages } from 'react-icons/fa';
import './Home.css';

function Home() {
  return (
    <main className="home" role="main">
      <header className="hero">
        <div className="hero-content">
          <h1 className="hero-title">דפי זיכרון דיגיטליים</h1>
          <p className="hero-subtitle">
            שמרו את זכרם של יקיריכם לנצח עם דף זיכרון דיגיטלי המשלב תמונות, סרטונים, היסטוריה ופרקי תהילים
          </p>
          <div className="hero-buttons">
            <Link to="/create" className="btn btn-primary">
              <FaPlus /> צור דף זיכרון חדש
            </Link>
            <Link to="/gallery/example" className="btn btn-secondary" aria-label="צפה בדף זיכרון לדוגמה">
              <FaImages /> דף זיכרון לדוגמה
            </Link>
          </div>
        </div>
      </header>

      <section className="features" aria-labelledby="features-heading">
        <div className="container">
          <h2 id="features-heading" className="section-title">איך זה עובד?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaHeart />
              </div>
              <h3>צור דף זיכרון</h3>
              <p>העלה תמונות, סרטונים, וספר את סיפור חייהם של יקיריך</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaQrcode />
              </div>
              <h3>קבל QR Code</h3>
              <p>הדפס את ה-QR code והצב אותו על המצבה</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                📖
              </div>
              <h3>גישה מהירה</h3>
              <p>סרוק את הקוד בטלפון ונווט ישירות לדף הזיכרון עם פרקי תהילים</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section" aria-labelledby="cta-heading">
        <div className="container">
          <h2 id="cta-heading">התחל עכשיו</h2>
          <p>צור דף זיכרון משמעותי בכמה דקות</p>
          <Link to="/create" className="btn btn-primary">
            יצירת דף זיכרון
          </Link>
        </div>
      </section>

      <footer className="footer">
        <p>© 2025 דפי זיכרון דיגיטליים - שומרים זיכרונות לנצח</p>
      </footer>
    </main>
  );
}

export default Home;

