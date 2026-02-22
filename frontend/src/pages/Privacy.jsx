import { Link } from 'react-router-dom';
import { FaShieldAlt } from 'react-icons/fa';
import './Privacy.css';

function Privacy() {
  return (
    <main className="privacy-page" role="main">
      <header className="privacy-hero">
        <div className="container">
          <h1 className="privacy-title">
            <FaShieldAlt style={{ marginLeft: '10px' }} />
            מדיניות פרטיות
          </h1>
          <p className="privacy-subtitle">
            דפי זיכרון דיגיטליים – כבוד לפרטיותך
          </p>
        </div>
      </header>

      <section className="privacy-content">
        <div className="container">
          <div className="privacy-section">
            <h2>מידע שאנו אוספים</h2>
            <p>כדי לספק את השירות, אנו אוספים:</p>
            <ul>
              <li><strong>שם מלא</strong> – בהרשמה, לזיהוי החשבון שלך.</li>
              <li><strong>כתובת אימייל</strong> – להתחברות, שחזור סיסמה ותקשורת.</li>
              <li><strong>מזהה משתמש (User ID)</strong> – מזהה ייחודי לחשבון ולדפי הזיכרון שלך.</li>
              <li><strong>מידע פיננסי</strong> – היסטוריית רכישות ותשלומים (תחזוקה, אחסון, שמירה לצמיתות). התשלום מתבצע דרך ספקים חיצוניים (PayPal, PayPlus, Stripe) – פרטי כרטיס אשראי לא נשמרים אצלנו.</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>שימוש במידע</h2>
            <p>
              אנו משתמשים במידע כדי להפעיל את השירות: ניהול חשבון, דפי זיכרון, תשלומים ותמיכה.
              איננו מוכרים את המידע לצדדים שלישיים.
            </p>
          </div>

          <div className="privacy-section">
            <h2>אבטחה ושמירה</h2>
            <p>
              סיסמאות מוצפנות. התכנים (תמונות, טקסטים) מאוחסנים בענן מאובטח. הנתונים מועברים בחיבור מאובטח (HTTPS). אנו נוקטים אמצעים סבירים להגנה על הנתונים.
            </p>
          </div>

          <div className="privacy-section">
            <h2>זכויות ומגע</h2>
            <p>
              יש לך זכות לבקש גישה למידע שלך או מחיקת חשבון. לבקשות או שאלות בנושא פרטיות: <a href="mailto:a0534166556@gmail.com">a0534166556@gmail.com</a>.
              ניתן לשלוח בקשה למחיקת חשבון דרך <Link to="/delete-account">דף מחיקת החשבון</Link>.
            </p>
          </div>

          <div className="privacy-section">
            <h2>עדכונים</h2>
            <p>
              עדכונים למדיניות זו יפורסמו בדף זה. המשך שימוש בשירות לאחר עדכון מהווה הסכמה לגרסה המעודכנת.
            </p>
          </div>
        </div>
      </section>

      <footer className="privacy-footer">
        <div className="container">
          <p>© 2025 דפי זיכרון דיגיטליים</p>
          <div className="footer-links">
            <Link to="/">דף הבית</Link>
            <Link to="/about">אודות</Link>
            <Link to="/pricing">תמחור</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Privacy;
