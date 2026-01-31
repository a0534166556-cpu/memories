import { Link } from 'react-router-dom';
import './About.css';

function DeleteAccount() {
  return (
    <main className="about-page" role="main" style={{ direction: 'rtl', textAlign: 'right' }}>
      <header className="about-hero">
        <div className="container">
          <h1 className="about-title">מחיקת חשבון</h1>
          <p className="about-subtitle">
            דפי זיכרון דיגיטליים – בקשת מחיקת חשבון ונתונים
          </p>
        </div>
      </header>

      <section className="about-content">
        <div className="container">
          <div className="about-section">
            <h2>איך לבקש מחיקת חשבון</h2>
            <p>
              אם ברצונך למחוק את חשבונך ואת הנתונים המשויכים אליו, אנא שלח אימייל לכתובת:
            </p>
            <p style={{ marginTop: '1rem' }}>
              <strong>
                <a href="mailto:a0534166556@gmail.com">a0534166556@gmail.com</a>
              </strong>
            </p>
            <p>
              נא לציין בנושא: <strong>בקשת מחיקת חשבון</strong>, ולוודא שהאימייל נשלח מכתובת האימייל הרשומה בחשבון.
            </p>
          </div>

          <div className="about-section">
            <h2>מה יימחק</h2>
            <ul style={{ paddingRight: '1.5rem' }}>
              <li>נתוני החשבון (שם, אימייל)</li>
              <li>קישור החשבון לדפי הזיכרון שיצרת (דפי הזיכרון עצמם יכולים להישמר או להימחק – לפי בקשתך)</li>
            </ul>
          </div>

          <div className="about-section">
            <h2>תקופת עיבוד</h2>
            <p>
              הבקשה תטופל בתוך עד 30 יום. לאחר מכן הנתונים יימחקו מהמערכת.
            </p>
          </div>

          <p style={{ marginTop: '2rem' }}>
            <Link to="/">חזרה לדף הבית</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default DeleteAccount;
