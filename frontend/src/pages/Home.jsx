import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FaPlus, FaQrcode, FaHeart, FaImages, FaBook, FaHistory, FaShareAlt, FaPrint, FaMusic, FaMapMarkerAlt, FaBell, FaFire, FaCalendarAlt, FaHandsHelping, FaChevronDown } from 'react-icons/fa';
import './Home.css';

const FAQ_ITEMS = [
  {
    question: 'מה זה דף זיכרון דיגיטלי?',
    answer: 'דף זיכרון דיגיטלי הוא אתר קטן המוקדש להנצחת יקירכם. אפשר להוסיף תמונות, סרטונים, סיפור חיים, ציר זמן, פרקי תהילים ומשניות, מיקום הקבר, אירועים שנתיים לזכר, והדלקת נר וירטואלי. המבקרים נכנסים דרך קישור או סריקת קוד QR על המצבה.'
  },
  {
    question: 'כמה עולה ליצור דף זיכרון?',
    answer: 'ניתן ליצור דף זיכרון בחינם – הוא יהיה פעיל 24 שעות (שמירה זמנית). לשמירה לאורך זמן יש תוכניות בתשלום: מנוי חודשי, שנתי, או הנצחה לכל החיים. המחירים מופיעים בדף יצירת הדף ובעמוד "תוכניות ומחירים".'
  },
  {
    question: 'האם אפשר לערוך את הדף אחרי שיצרתי אותו?',
    answer: 'כן. אם בחרת בתוכנית שמירה (מנוי או הנצחה) ואת/ה מחובר/ת לחשבון – אפשר לערוך את הדף בכל עת מדף "ניהול דפי זיכרון": לעדכן תמונות, טקסטים, אירועים ועוד.'
  },
  {
    question: 'איך משתפים את דף הזיכרון?',
    answer: 'בכל דף זיכרון יש כפתור "שתף" – אפשר לשלוח בוואטסאפ, באימייל או להעתיק את הקישור. בנוסף מקבלים קוד QR להדפסה ולהצבה על המצבה, כדי שמבקרים יוכלו לסרוק ולהגיע ישירות לדף.'
  },
  {
    question: 'האם הנתונים שלי בטוחים?',
    answer: 'התכנים שמועלים (תמונות, טקסטים) מאוחסנים בשרת מאובטח. לא נשתף את המידע עם צדדים שלישיים. לפרטים נוספים ראו את מדיניות הפרטיות באתר.'
  }
];

function Home() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  return (
    <main className="home" role="main">
      <Helmet>
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.origin + '/' : 'https://memoriesman.netlify.app/'} />
        <meta property="og:title" content="דפי זיכרון דיגיטליים" />
        <meta property="og:description" content="אנחנו כאן כדי לעזור לכם לשמור את הזיכרון בצורה מכובדת וברורה. צרו דף זיכרון – תמונות, סיפורים, תהילים ו־QR על המצבה." />
      </Helmet>
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
        <div className="hero-sparkle" aria-hidden="true">
          {[...Array(48)].map((_, i) => (
            <span
              key={i}
              className={`sparkle-dot sparkle--${(i % 3) + 1}${i % 5 === 0 ? ' sparkle--gold' : ''}`}
              style={{
                left: `${5 + (i * 2.1) % 90}%`,
                top: `${5 + (i * 5.3) % 90}%`,
                animationDelay: `${(i * 0.12) % 4}s`,
                animationDuration: `${3.5 + (i % 3) * 0.8}s`
              }}
            />
          ))}
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            ההנצחה הדיגיטלית של <span className="brand">דפי זיכרון</span>
          </h1>
          <p className="hero-tagline">דף הנצחה אישי שמחבר אתכם ליקיריכם בכל רגע</p>
          <p className="hero-subtitle">
            תמונות, סרטונים וטקסטים מרגשים במקום אחד. כרטיס עם קוד QR מחזיר אתכם לזיכרון החי – בכל זמן ובכל מקום.
          </p>
          <p className="hero-reassure">בכמה דקות תוכלו ליצור דף שכל המשפחה יכולה לצפות בו ולשתף. אפשר להתחיל בחינם.</p>
          <span className="hero-feel">להרגיש.</span>
          <div className="hero-buttons">
            <Link to="/create" className="btn btn-secondary">
              <FaPlus /> צור דף זיכרון עכשיו
            </Link>
            <a href="#how-it-works" className="btn btn-primary">
              מה זה דף זיכרון ואיך זה עובד?
            </a>
          </div>
          <div className="hero-links">
            <Link to="/gallery/example" className="hero-link">לדף זיכרון לדוגמה</Link>
            <Link to="/pricing" className="hero-link">לתוכניות ומחירים</Link>
          </div>
        </div>
      </header>

      <section id="how-it-works" className="features" aria-labelledby="features-heading">
        <div className="container">
          <h2 id="features-heading" className="section-title">איך זה עובד?</h2>
          <p className="how-intro">התהליך פשוט ומכבד. אתם מובילים – אנחנו מספקים את הכלים. שלושה צעדים קצרים ומגיעים לדף זיכרון מוכן לשיתוף.</p>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-step" aria-hidden="true">1</span>
              <div className="feature-icon">
                <FaHeart />
              </div>
              <h3>צור דף זיכרון</h3>
              <p>העלו תמונות, סרטונים וספרו את סיפור חייהם של יקיריכם. אפשר להשלים בהדרגה ולחזור לערוך.</p>
            </div>

            <div className="feature-card">
              <span className="feature-step" aria-hidden="true">2</span>
              <div className="feature-icon">
                <FaQrcode />
              </div>
              <h3>קבל קוד QR</h3>
              <p>הדפיסו את קוד ה-QR והציבו על המצבה. מבקרים סורקים ונגישים ישירות לדף עם תהילים וכל התכנים.</p>
            </div>

            <div className="feature-card">
              <span className="feature-step" aria-hidden="true">3</span>
              <div className="feature-icon">
                📖
              </div>
              <h3>שתפו והנציחו</h3>
              <p>שלחו את הקישור למשפחה וחברים. הדף נשאר זמין – לתמיד או לפי התוכנית שבחרתם.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="memorial-features-detail" aria-labelledby="memorial-detail-heading">
        <div className="container">
          <h2 id="memorial-detail-heading" className="section-title">מה יש בדף זיכרון?</h2>
          <p className="memorial-detail-intro">
            בכל התוכניות – זמנית, חודשית, שנתית או לצמיתות – יש את אותן התכונות. ההבדל הוא רק במשך השמירה: 24 שעות בחינם, או שמירה מתמשכת בתשלום. המבקרים יראו דף מסודר, נוח לצפייה ולשיתוף.
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

      <section className="faq-section" aria-labelledby="faq-heading">
        <div className="container">
          <h2 id="faq-heading" className="section-title">שאלות נפוצות</h2>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
                >
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                  >
                    <span className="faq-question-text">{item.question}</span>
                    <span className="faq-question-icon" aria-hidden="true">
                      <FaChevronDown />
                    </span>
                  </button>
                  <div
                    id={`faq-answer-${index}`}
                    className="faq-answer-wrap"
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    hidden={!isOpen}
                  >
                    <p className="faq-answer">{item.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cta-section" aria-labelledby="cta-heading">
        <div className="cta-candle" aria-hidden="true">
          <div className="cta-candle-glow" />
          <div className="cta-candle-body">
            <div className="cta-candle-wick" />
            <div className="cta-candle-flame-outer" />
            <div className="cta-candle-flame-inner" />
          </div>
          <div className="cta-candle-base" />
          <div className="cta-candle-shadow" />
        </div>
        <div className="container">
          <h2 id="cta-heading">התחל עכשיו</h2>
          <p className="cta-reassure">צור דף זיכרון משמעותי בכמה דקות. אפשר להתחיל בחינם – הדף יהיה פעיל 24 שעות, ולבחור שמירה ארוכה כשתחליטו.</p>
          <Link to="/create" className="btn btn-primary btn-cta-main">
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

