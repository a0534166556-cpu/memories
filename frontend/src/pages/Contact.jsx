import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import { FaPhone, FaEnvelope, FaUniversity, FaPaperPlane, FaLightbulb, FaSpinner } from 'react-icons/fa';
import './Contact.css';

const INBOX_EMAIL = 'a0534166556@gmail.com';

// פרטי העברה בנקאית
const BANK_DETAILS = {
  bankNumber: '10',
  bankName: 'בנק לאומי',
  branch: '998',
  accountNumber: '40792324',
  accountName: 'דפי זיכרון דיגיטליים',
};

function buildMailtoLink({ name, email, siteSuggestions, memorialFeatures }) {
  const subject = encodeURIComponent('הצעות לשיפור האתר ומה להוסיף לדף הזיכרון שלי');
  const body = encodeURIComponent(
    `שם: ${name || ''}\nאימייל לחזרה: ${email || ''}\n\n--- הצעות לשיפור האתר ---\n${siteSuggestions || ''}\n\n--- מה אשמח שיופיע בדף הזיכרון שלי ---\n${memorialFeatures || ''}`
  );
  return `mailto:${INBOX_EMAIL}?subject=${subject}&body=${body}`;
}

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [siteSuggestions, setSiteSuggestions] = useState('');
  const [memorialFeatures, setMemorialFeatures] = useState('');
  const [status, setStatus] = useState({ type: null, message: '' });
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const mail = (email || '').trim();
    const site = (siteSuggestions || '').trim();
    const mem = (memorialFeatures || '').trim();
    if (!mail || (!site && !mem)) {
      setStatus({
        type: 'err',
        message: 'נא למלא את כתובת האימייל ולפחות אחד משני השדות הארוכים.'
      });
      return;
    }
    if (site.length < 4 && mem.length < 4) {
      setStatus({
        type: 'err',
        message: 'נא לכתוב לפחות כמה מילים באחד מהשדות.'
      });
      return;
    }
    setStatus({ type: null, message: '' });
    setSending(true);
    try {
      const res = await axios.post(getApiEndpoint('/api/contact/feedback'), {
        name: name.trim(),
        email: mail,
        siteSuggestions: site,
        memorialFeatures: mem
      });
      if (res.data?.success) {
        setStatus({ type: 'ok', message: res.data.message || 'ההודעה נשלחה בהצלחה. תודה רבה — נקרא ונשקול כל הצעה.' });
        setName('');
        setEmail('');
        setSiteSuggestions('');
        setMemorialFeatures('');
      } else {
        setStatus({ type: 'err', message: res.data?.message || 'אירעה שגיאה. נסו שוב.' });
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.mailtoFallback) {
        window.location.href = buildMailtoLink({ name, email, siteSuggestions, memorialFeatures });
        setStatus({
          type: 'ok',
          message: 'שליחת אימייל מהשרת אינה מוגדרת כרגע. פתחנו את תיבת הדואר שלכם — שלחו משם ונקבל את ההודעה.'
        });
      } else {
        setStatus({
          type: 'err',
          message: data?.message || err.message || 'אירעה שגיאה בשליחה. נסו שוב או שלחו אימייל ישירות.'
        });
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="contact-page" role="main">
      <Helmet>
        <title>צור קשר | דפי זיכרון דיגיטליים</title>
        <meta
          name="description"
          content="צור קשר לשאלות, תשלום בהעברה בנקאית, והצעות לשיפור האתר ולתכנים שתרצו בדף הזיכרון שלכם."
        />
      </Helmet>
      <header className="contact-hero">
        <div className="container">
          <h1 className="contact-title">צור קשר</h1>
          <p className="contact-subtitle">
            שאלות, תשלום, והזדמנות לשלוח לנו הצעות לשיפור האתר — ולספר מה חשוב לכם שיופיע בדף ההנצחה של יקיריכם
          </p>
        </div>
      </header>

      <section className="contact-content">
        <div className="container">
          <div className="contact-methods">
            <div className="contact-card">
              <FaPhone className="contact-card-icon" />
              <h2>טלפון</h2>
              <a href="tel:0508254935" className="contact-phone-link">
                050-825-4935
              </a>
              <p className="contact-card-note">להזמנה, פרטי העברה והפעלת שמירה</p>
            </div>
            <div className="contact-card">
              <FaEnvelope className="contact-card-icon" />
              <h2>אימייל</h2>
              <a href={`mailto:${INBOX_EMAIL}`}>{INBOX_EMAIL}</a>
            </div>
          </div>

          <section className="contact-suggestions" aria-labelledby="contact-suggestions-title">
            <FaLightbulb className="contact-suggestions-icon" aria-hidden="true" />
            <h2 id="contact-suggestions-title">הצעות לשיפור האתר ולדף הזיכרון שלכם</h2>
            <p className="contact-suggestions-text">
              רוצים שנוסיף יכולת באתר? חסר לכם משהו בדף ההנצחה? מלאים את הטופס ולוחצים שליחה — ההודעה תישלח
              ישירות למייל שלנו, ותקבלו אישור שהתקבלה.
            </p>

            <form className="contact-feedback-form" onSubmit={handleSubmit} noValidate>
              <div className="contact-feedback-row">
                <label className="contact-feedback-label" htmlFor="contact-name">
                  שם (אופציונלי)
                </label>
                <input
                  id="contact-name"
                  className="contact-feedback-input"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="לדוגמה: יעל כהן"
                  maxLength={120}
                />
              </div>
              <div className="contact-feedback-row">
                <label className="contact-feedback-label" htmlFor="contact-email">
                  אימייל לחזרה <span className="contact-required">*</span>
                </label>
                <input
                  id="contact-email"
                  className="contact-feedback-input"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  dir="ltr"
                />
              </div>
              <div className="contact-feedback-row">
                <label className="contact-feedback-label" htmlFor="contact-site">
                  הצעות לשיפור האתר (ניווט, תכונות, ניסוח, נגישות…)
                </label>
                <textarea
                  id="contact-site"
                  className="contact-feedback-textarea"
                  value={siteSuggestions}
                  onChange={(e) => setSiteSuggestions(e.target.value)}
                  placeholder="למשל: הייתי שמח שתוסיפו… / קשה לי למצוא… / חסר הסבר על…"
                  rows={5}
                  maxLength={8000}
                />
              </div>
              <div className="contact-feedback-row">
                <label className="contact-feedback-label" htmlFor="contact-memorial">
                  מה תרצו שיופיע או יתווסף בדף הזיכרון של יקיריכם?
                </label>
                <textarea
                  id="contact-memorial"
                  className="contact-feedback-textarea"
                  value={memorialFeatures}
                  onChange={(e) => setMemorialFeatures(e.target.value)}
                  placeholder="למשל: גלריה גדולה יותר, אזור לסיפורי משפחה, מזמור נוסף, שדה לציטוט…"
                  rows={5}
                  maxLength={8000}
                />
              </div>

              {status.message && (
                <p
                  className={`contact-feedback-status contact-feedback-status--${status.type === 'ok' ? 'ok' : 'err'}`}
                  role="alert"
                >
                  {status.message}
                </p>
              )}

              <div className="contact-suggestions-actions">
                <button type="submit" className="contact-suggestions-cta" disabled={sending}>
                  {sending ? (
                    <>
                      <FaSpinner className="contact-suggestions-spinner" aria-hidden="true" /> שולח...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane aria-hidden="true" /> שלח הודעה
                    </>
                  )}
                </button>
              </div>
              <p className="contact-suggestions-hint">
                נא למלא לפחות אחד משני השדות הארוכים (הצעה לשיפור האתר או מה לדף הזיכרון), ואת האימייל לחזרה.
                ההודעה תישלח ישירות למייל שלנו.
              </p>
            </form>
          </section>

          <div className="contact-bank-section">
            <h2 className="contact-bank-title">
              <FaUniversity aria-hidden="true" /> העברה בנקאית
            </h2>
            <p className="contact-bank-intro">
              אפשר לשלם בהעברה מחשבון הבנק. התשלום בהעברה בנקאית מתואם טלפונית בלבד – יש להתקשר אלינו לפני ביצוע
              ההעברה כדי לוודא את הסכום ואת מטרת התשלום, ולאחר ההעברה לעדכן אותנו כדי שנפעיל את השמירה.
            </p>
            <div className="contact-bank-details">
              <div className="contact-bank-row">
                <span>מספר בנק:</span> {BANK_DETAILS.bankNumber}
              </div>
              <div className="contact-bank-row">
                <span>בנק:</span> {BANK_DETAILS.bankName}
              </div>
              <div className="contact-bank-row">
                <span>סניף:</span> {BANK_DETAILS.branch}
              </div>
              <div className="contact-bank-row">
                <span>מספר חשבון:</span> {BANK_DETAILS.accountNumber}
              </div>
              <div className="contact-bank-row">
                <span>שם החשבון:</span> {BANK_DETAILS.accountName}
              </div>
            </div>
            <p className="contact-bank-note">
              לכל תשלום בהעברה בנקאית חובה ליצור קשר טלפוני מראש בטלפון{' '}
              <a href="tel:0508254935">050-825-4935</a> כדי לתאם את הפרטים ולהפעיל את השמירה.
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
