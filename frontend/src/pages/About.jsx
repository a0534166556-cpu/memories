import { Link } from 'react-router-dom';
import { FaHeart, FaQrcode, FaHistory, FaUsers, FaEnvelope, FaPhone } from 'react-icons/fa';
import './About.css';

function About() {
  return (
    <main className="about-page" role="main">
      <header className="about-hero">
        <div className="container">
          <h1 className="about-title">אודותינו</h1>
          <p className="about-subtitle">
            דפי זיכרון דיגיטליים - דרך מודרנית ומכבדת להנציח את זכרם של יקירינו
          </p>
        </div>
      </header>

      <section className="about-content">
        <div className="container">
          <div className="about-section">
            <h2>המטרה שלנו</h2>
            <p>
              אנו מאמינים שכל אדם ראוי להיזכר בכבוד ובאהבה. דפי זיכרון דיגיטליים מאפשרים למשפחות 
              ליצור מקום מרגש ומכבד להנצחת יקיריהן, נגיש מכל מקום בעולם, לכל החיים.
            </p>
            <p>
              באמצעות טכנולוגיה מתקדמת, אנו שומרים את הזיכרונות, הסיפורים והתמונות היקרות ביותר, 
              ומאפשרים לדורות הבאים להתחבר לשורשיהם ולשמור על קשר עם המורשת המשפחתית.
            </p>
          </div>

          <div className="about-section">
            <h2>מה אנחנו מציעים</h2>
            <div className="features-list">
              <div className="feature-item">
                <FaQrcode className="feature-icon" />
                <div>
                  <h3>QR Code למצבה</h3>
                  <p>כל דף זיכרון מקבל QR Code ייחודי אותו ניתן להדפיס ולהציב על המצבה</p>
                </div>
              </div>
              <div className="feature-item">
                <FaHistory className="feature-icon" />
                <div>
                  <h3>ציר זמן חיים</h3>
                  <p>תיעוד אירועים חשובים לאורך החיים בצורה מסודרת ומרגשת</p>
                </div>
              </div>
              <div className="feature-item">
                <FaHeart className="feature-icon" />
                <div>
                  <h3>תמונות וסרטונים</h3>
                  <p>אלבום דיגיטלי עשיר המכיל את הרגעים החשובים ביותר</p>
                </div>
              </div>
              <div className="feature-item">
                <FaUsers className="feature-icon" />
                <div>
                  <h3>הודעות תנחומים</h3>
                  <p>אפשרות למשפחה וחברים להשאיר הודעות תנחומים ולהגיב</p>
                </div>
              </div>
            </div>
          </div>

          <div className="about-section">
            <h2>איך זה עובד?</h2>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>צרו דף זיכרון</h3>
                  <p>העלו תמונות, סרטונים, כתבו סיפור חיים וציר זמן</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>קבלו QR Code</h3>
                  <p>אחרי יצירת הדף, תקבלו QR Code ייחודי להדפסה</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>הציבו על המצבה</h3>
                  <p>הדפיסו את ה-QR Code והציבו אותו על המצבה</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>שתפו עם המשפחה</h3>
                  <p>כל אחד יכול לסרוק את הקוד ולגשת לדף הזיכרון מכל מקום</p>
                </div>
              </div>
            </div>
          </div>

          <div className="about-section">
            <h2>צור קשר</h2>
            <p>
              יש לך שאלות או הצעות? אנחנו כאן לעזור!
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
          </div>
        </div>
      </footer>
    </main>
  );
}

export default About;
