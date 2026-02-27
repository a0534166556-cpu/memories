import { Link } from 'react-router-dom';
import { FaPlus, FaQrcode, FaHeart, FaImages, FaBook, FaHistory, FaShareAlt, FaPrint, FaMusic, FaMapMarkerAlt, FaBell, FaFire, FaCalendarAlt, FaHandsHelping } from 'react-icons/fa';
import './Home.css';

function Home() {
  return (
    <main className="home" role="main">
      {/* Navigation Header */}
      <nav className="top-navigation">
        <div className="container">
          <div className="nav-links">
            <Link to="/" className="nav-link">דף הבית</Link>
            <Link to="/about" className="nav-link">אודותינו</Link>
            <Link to="/support" className="nav-link">משאבים למשפחות</Link>
            <Link to="/memorial-prayers" className="nav-link">סדר תפילות לאזכרה</Link>
            {localStorage.getItem('token') && (
              <Link to="/manage" className="nav-link">ניהול דפי זיכרון</Link>
            )}
            {!localStorage.getItem('token') ? (
              <Link to="/login" className="nav-link">התחברות</Link>
            ) : (
              <span 
                className="nav-link" 
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.reload();
                }}
                style={{ cursor: 'pointer' }}
              >
                התנתק
              </span>
            )}
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-content">
          <h1 className="hero-title">דפי זיכרון דיגיטליים</h1>
          <p className="hero-subtitle">
            שמרו את זכרם של יקיריכם לנצח עם דף זיכרון דיגיטלי המשלב תמונות, סרטונים, היסטוריה ופרקי תהילים
          </p>
          <div className="hero-buttons">
            <Link to="/create" className="btn btn-primary">
              <FaPlus /> צור דף זיכרון עכשיו
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

      <section className="memorial-features-detail" aria-labelledby="memorial-detail-heading">
        <div className="container">
          <h2 id="memorial-detail-heading" className="section-title">מה יש בדף זיכרון?</h2>
          <p className="memorial-detail-intro">
            כל דף זיכרון יכול לכלול את כל האפשרויות הבאות — בהתאם למה שבחרת להעלות ולהגדיר. המבקרים יראו דף מסודר, נוח לצפייה ולשיתוף.
          </p>
          <div className="memorial-detail-grid">
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaHeart /></div>
              <h3>פרופיל ותקציר</h3>
              <p>שם, תאריכי לידה ופטירה, תמונה ראשית ותקציר קצר — מוצגים בראש הדף.</p>
            </div>
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaImages /></div>
              <h3>גלריית זיכרונות</h3>
              <p>תמונות וסרטונים במצגת נוחה — גלילה, תמיכה בתמונה ובסרטון.</p>
            </div>
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaBook /></div>
              <h3>סיפור חיים</h3>
              <p>טקסט ביוגרפיה שמספר את סיפור חייהם של הנפטר/ת.</p>
            </div>
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaHistory /></div>
              <h3>ציר חיים</h3>
              <p>אירועים לאורך השנים עם תאריכים ותיאורים — ציר זמן ויזואלי.</p>
            </div>
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaBook /></div>
              <h3>פרקי תהילים ומשניות</h3>
              <p>פרקי תהילים ומשניות לעילוי הנשמה — קריאה נוחה מהמסך.</p>
            </div>
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaFire /></div>
              <h3>הדלקת נר וירטואלי</h3>
              <p>מבקרים יכולים להדליק נר זיכרון וירטואלי בדף.</p>
            </div>
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon">💬</div>
              <h3>תנחומים</h3>
              <p>מבקרים יכולים להשאיר הודעת תנחומים בדף הזיכרון.</p>
            </div>
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaMapMarkerAlt /></div>
              <h3>מיקום הקבורה</h3>
              <p>כתובת בית העלמין וקישור להנחיות ניווט — אם הוגדר.</p>
            </div>
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaMusic /></div>
              <h3>מוזיקת רקע</h3>
              <p>שיר או מוזיקה ברקע הדף — ניתן להפעיל/להשהה.</p>
            </div>
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaBell /></div>
              <h3>תזכורת לאזכרה</h3>
              <p>הרשמה לקבלת תזכורת במייל לפני תאריך האזכרה.</p>
            </div>
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaQrcode /></div>
              <h3>QR Code</h3>
              <p>קוד QR להדפסה והצבה על המצבה — סריקה מובילה ישירות לדף.</p>
            </div>
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaShareAlt /></div>
              <h3>שיתוף</h3>
              <p>שיתוף בוואטסאפ, באימייל, העתקת קישור או שיתוף דרך המערכת.</p>
            </div>
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaPrint /></div>
              <h3>הדפסה ונגישות</h3>
              <p>הדפסת הדף לצורך שמירה או אזכרה, ובחירת גודל טקסט נוח לקריאה.</p>
            </div>
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaCalendarAlt /></div>
              <h3>אירועים לזכרו</h3>
              <p>אירוע שנתי לזכרו: כותרת, תאריך, מקום, קישור לדף פרטים או רישום (אופציונלי), וטקסט קצר — מוצג בדף עם כפתור "פרטים ורישום" אם הוזן קישור.</p>
            </div>
            <Link to="/support" className="memorial-detail-card memorial-detail-card-link">
              <div className="memorial-detail-icon"><FaHandsHelping /></div>
              <h3>משאבים למשפחות</h3>
              <p>קישורים לארגוני תמיכה — יד שרה, עמותות ללוויית אבלים, תמיכה נפשית ועוד.</p>
            </Link>
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
        <div className="footer-links">
          <Link to="/">דף הבית</Link>
          <Link to="/about">אודות</Link>
          <Link to="/privacy">מדיניות פרטיות</Link>
          <Link to="/support">משאבים למשפחות</Link>
        </div>
      </footer>
    </main>
  );
}

export default Home;

