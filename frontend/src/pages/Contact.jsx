import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaUniversity } from 'react-icons/fa';
import './Contact.css';

// פרטי העברה בנקאית
const BANK_DETAILS = {
  bankNumber: '10',
  bankName: 'בנק לאומי',
  branch: '998',
  accountNumber: '40792324',
  accountName: 'דפי זיכרון דיגיטליים',
};

function Contact() {
  return (
    <main className="contact-page" role="main">
      <header className="contact-hero">
        <div className="container">
          <h1 className="contact-title">צור קשר</h1>
          <p className="contact-subtitle">להזמנות, פרטי העברה בנקאית וכל שאלה</p>
        </div>
      </header>

      <section className="contact-content">
        <div className="container">
          <div className="contact-methods">
            <div className="contact-card">
              <FaPhone className="contact-card-icon" />
              <h2>טלפון</h2>
              <a href="tel:0508254935" className="contact-phone-link">050-825-4935</a>
              <p className="contact-card-note">להזמנה, פרטי העברה והפעלת שמירה</p>
            </div>
            <div className="contact-card">
              <FaEnvelope className="contact-card-icon" />
              <h2>אימייל</h2>
              <a href="mailto:a0534166556@gmail.com">a0534166556@gmail.com</a>
            </div>
          </div>

          <div className="contact-bank-section">
            <h2 className="contact-bank-title">
              <FaUniversity aria-hidden="true" /> העברה בנקאית
            </h2>
            <p className="contact-bank-intro">
              אפשר לשלם בהעברה מחשבון הבנק. התשלום בהעברה בנקאית מתואם טלפונית בלבד – יש להתקשר אלינו לפני ביצוע ההעברה כדי לוודא את הסכום ואת מטרת התשלום, ולאחר ההעברה לעדכן אותנו כדי שנפעיל את השמירה.
            </p>
            <div className="contact-bank-details">
              <div className="contact-bank-row"><span>מספר בנק:</span> {BANK_DETAILS.bankNumber}</div>
              <div className="contact-bank-row"><span>בנק:</span> {BANK_DETAILS.bankName}</div>
              <div className="contact-bank-row"><span>סניף:</span> {BANK_DETAILS.branch}</div>
              <div className="contact-bank-row"><span>מספר חשבון:</span> {BANK_DETAILS.accountNumber}</div>
              <div className="contact-bank-row"><span>שם החשבון:</span> {BANK_DETAILS.accountName}</div>
            </div>
            <p className="contact-bank-note">
              לכל תשלום בהעברה בנקאית חובה ליצור קשר טלפוני מראש בטלפון <a href="tel:0508254935">050-825-4935</a> כדי לתאם את הפרטים ולהפעיל את השמירה.
            </p>
          </div>
        </div>
      </section>

      <footer className="contact-footer">
        <div className="container">
          <p>© 2025 דפי זיכרון דיגיטליים</p>
          <div className="footer-links">
            <Link to="/">דף הבית</Link>
            <Link to="/about">אודות</Link>
            <Link to="/pricing">תמחור</Link>
            <Link to="/support">משאבים למשפחות</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Contact;
