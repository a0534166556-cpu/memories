import { Link } from 'react-router-dom';
import { FaHeart, FaQrcode, FaHistory, FaUsers, FaEnvelope, FaPhone, FaBook, FaMapMarkerAlt, FaBell, FaFire, FaShieldAlt } from 'react-icons/fa';
import './About.css';

function About() {
  return (
    <main className="about-page" role="main">
      <header className="about-hero">
        <div className="container">
          <h1 className="about-title">אודותינו</h1>
          <p className="about-subtitle">
            דפי זיכרון דיגיטליים – דרך מודרנית ומכבדת להנציח את זכרם של יקירינו
          </p>
        </div>
      </header>

      <section className="about-content">
        <div className="container">
          <div className="about-section">
            <h2>המטרה והחזון שלנו</h2>
            <p>
              אנו מאמינים שכל אדם ראוי להיזכר בכבוד ובאהבה. דפי זיכרון דיגיטליים מאפשרים למשפחות 
              ליצור מקום מרגש ומכבד להנצחת יקיריהן – נגיש מכל מקום בעולם, בכל עת, לכל החיים.
            </p>
            <p>
              באמצעות טכנולוגיה מתקדמת אנו שומרים את הזיכרונות, הסיפורים והתמונות היקרות ביותר, 
              ומאפשרים לדורות הבאים להתחבר לשורשיהם ולשמור על קשר עם המורשת המשפחתית. 
              המטרה שלנו היא להפוך את ההנצחה לנגישה, פשוטה ומלאת כבוד – כך שכל משפחה תוכל 
              לשמר את סיפור חייו של יקירה בלי תלות במקום או בזמן.
            </p>
          </div>

          <div className="about-section">
            <h2>מה אנחנו מציעים</h2>
            <p className="about-section-intro">
              כל דף זיכרון כולל מגוון כלים להנצחה מלאה ומרגשת. להלן התכונות העיקריות:
            </p>
            <div className="features-list">
              <div className="feature-item">
                <FaQrcode className="feature-icon" />
                <div>
                  <h3>QR Code ייחודי למצבה</h3>
                  <p>כל דף זיכרון מקבל קוד QR ייחודי שניתן להדפיס ולהציב על המצבה. מבקרים סורקים את הקוד ומגיעים ישירות לדף הזיכרון מהטלפון – בלי להקליד כתובת.</p>
                </div>
              </div>
              <div className="feature-item">
                <FaHeart className="feature-icon" />
                <div>
                  <h3>תמונות, סרטונים ומוזיקה</h3>
                  <p>אלבום דיגיטלי עשיר: העלו תמונות וסרטונים, בחרו מוזיקת רקע לדף, ותיעדו את הרגעים החשובים בחיי הנפטר. האחסון מאובטח בענן ונגיש תמיד.</p>
                </div>
              </div>
              <div className="feature-item">
                <FaHistory className="feature-icon" />
                <div>
                  <h3>סיפור חיים וציר זמן</h3>
                  <p>תיעוד אירועים משמעותיים לאורך החיים – שנים, כותרות ותיאורים – במבנה כרונולוגי וברור. אפשר להוסיף תקציר פתיח ליד התמונה הראשית.</p>
                </div>
              </div>
              <div className="feature-item">
                <FaBook className="feature-icon" />
                <div>
                  <h3>פרקי תהילים ומשניות</h3>
                  <p>בחירת פרקי תהילים ומשניות להצגה בדף הזיכרון – לקריאה בעלייה לקבר או ביום השנה. הטקסטים מוצגים במלואם ונוחים לקריאה.</p>
                </div>
              </div>
              <div className="feature-item">
                <FaMapMarkerAlt className="feature-icon" />
                <div>
                  <h3>מיקום הקבר</h3>
                  <p>אפשר להוסיף שם בית עלמין, כתובת וקואורדינטות GPS – או לשלוח מיקום מהטלפון ולהדביק קישור מגוגל מפות – כדי שמבקרים יוכלו לנווט בקלות לקבר.</p>
                </div>
              </div>
              <div className="feature-item">
                <FaUsers className="feature-icon" />
                <div>
                  <h3>הודעות תנחומים</h3>
                  <p>משפחה וחברים יכולים להשאיר הודעות תנחומים ישירות בדף הזיכרון. ההודעות מוצגות בכבוד ומאפשרות להנציח גם את דברי המבקרים.</p>
                </div>
              </div>
              <div className="feature-item">
                <FaFire className="feature-icon" />
                <div>
                  <h3>נר זיכרון וירטואלי</h3>
                  <p>מבקרים יכולים "להדליק" נר זיכרון וירטואלי בדף – סמל מרגש של זיכרון וכבוד.</p>
                </div>
              </div>
              <div className="feature-item">
                <FaBell className="feature-icon" />
                <div>
                  <h3>תזכורת ליום השנה</h3>
                  <p>הרשמה לתזכורת במייל – ביום הפטירה ו/או עשרה ימים לפני – כדי לא לפספס את יום האזכרה.</p>
                </div>
              </div>
            </div>
            <p className="about-note">
              בנוסף, באתר דף <Link to="/memorial-prayers">סדר תפילות לאזכרה</Link> – תפילות ופרקי תהילים לטקס עלייה לקבר, במלואם.
            </p>
          </div>

          <div className="about-section">
            <h2>איך זה עובד?</h2>
            <p className="about-section-intro">
              יצירת דף זיכרון פשוטה ומדורגת. ניתן להתחיל בחינם ולשדרג כשמחליטים להנציח לצמיתות.
            </p>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>צרו דף זיכרון</h3>
                  <p>העלו תמונות וסרטונים, כתבו סיפור חיים, ציר זמן, בחרו פרקי תהילים ומשניות, והוסיפו מיקום הקבר אם תרצו. אין צורך בידע טכני.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>בדקו וקבלו QR Code</h3>
                  <p>אחרי השמירה תקבלו קישור לדף ו־QR Code ייחודי להדפסה. הדף פעיל זמנית (24 שעות) עד שתבחרו תוכנית שמירה.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>בחרו תוכנית שמירה</h3>
                  <p>מנוי חודשי (12₪), שנתי (100₪), תשלום חד פעמי (399₪). תחזוקה 15₪ לשנה מהשנה השלישית.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>הציבו על המצבה ושתפו</h3>
                  <p>הדפיסו את ה־QR Code והציבו על המצבה. כל אחד יכול לסרוק ולגשת לדף מכל מקום. אפשר לערוך את הדף גם אחרי השמירה.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="about-section">
            <h2>ערכים ואבטחה</h2>
            <ul className="values-list">
              <li><FaHeart className="value-icon" /> <strong>כבוד והקפדה</strong> – אנחנו מטפלים בזיכרונות ובתכנים ברגישות מקסימלית.</li>
              <li><FaShieldAlt className="value-icon" /> <strong>אבטחה וגיבוי</strong> – התכנים מאוחסנים בענן מאובטח; אין תלות במכשיר בודד.</li>
              <li><strong>נגישות</strong> – הדפים נגישים מכל מכשיר (מחשב, טאבלט, טלפון) ובכל מקום.</li>
              <li><strong>תמיכה</strong> – צוותנו זמין לשאלות, להנחיה ולתמיכה בתהליך ההנצחה.</li>
            </ul>
          </div>

          <div className="about-section">
            <h2>צור קשר</h2>
            <p>
              יש לך שאלות על השירות, על התמחור או על יצירת דף זיכרון? רוצה עזרה בבחירת תוכנית או בהדפסת ה־QR? 
              נשמח לעזור – צרו איתנו קשר במייל או בטלפון.
            </p>
            <div className="contact-info">
              <div className="contact-item">
                <FaEnvelope className="contact-icon" />
                <a href="mailto:a0534166556@gmail.com">a0534166556@gmail.com</a>
              </div>
              <div className="contact-item">
                <FaPhone className="contact-icon" />
                <div className="contact-phone">
                  <a href="tel:0508254935">050-825-4935</a>
                  <span className="contact-phone-label">דבר עם נציג מטעמנו לפרטים</span>
                </div>
              </div>
            </div>
          </div>

          <div className="about-cta">
            <Link to="/create" className="btn btn-primary">
              צור דף זיכרון
            </Link>
          </div>
        </div>
      </section>

      <footer className="about-footer">
        <div className="container">
          <p>© 2025 דפי זיכרון דיגיטליים - שומרים זיכרונות לנצח</p>
          <div className="footer-links">
            <Link to="/">דף הבית</Link>
            <Link to="/about">אודות</Link>
            <Link to="/privacy">מדיניות פרטיות</Link>
            <Link to="/support">משאבים למשפחות</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default About;
