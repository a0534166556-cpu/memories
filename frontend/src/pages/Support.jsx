import { Link } from 'react-router-dom';
import { FaHandsHelping, FaHeart, FaUsers } from 'react-icons/fa';
import './Support.css';

const SUPPORT_ORGS = [
  {
    name: 'יד שרה',
    description: 'שירותי סיוע, ליווי ותמיכה למשפחות בשעת אבל ובכלל – טלפון חם, ביקורי בית ולוויית אבלים.',
    url: 'https://www.yad-sarah.net',
    icon: FaHeart,
  },
  {
    name: 'עמותת "חמל" – ליווי רוחני וחברתי',
    description: 'תמיכה נפשית ורוחנית למשפחות אבלות, ליווי בשבעה ובתהליך האבל.',
    url: 'https://www.chevra.org.il',
    icon: FaUsers,
  },
  {
    name: 'ער"ן – עזרה ראשונה נפשית',
    description: 'קו סיוע נפשי 24/7 – תמיכה במשבר, אבל, בדידות ומצוקה נפשית.',
    url: 'https://www.eran.org.il',
    icon: FaHandsHelping,
  },
  {
    name: 'בית החולים הדסה – שירותי עבודה סוציאלית',
    description: 'ליווי משפחות בתהליך אבל, הפניה לשירותים קהילתיים ותמיכה נפשית.',
    url: 'https://www.hadassah.org.il',
    icon: FaHandsHelping,
  },
];

function Support() {
  return (
    <main className="support-page" role="main">
      <header className="support-hero">
        <div className="container">
          <h1 className="support-title">תמיכה וקהילה</h1>
          <p className="support-subtitle">משאבים למשפחות</p>
          <p className="support-intro">
            ריכזנו עבורכם קישורים לארגונים ועמותות המספקים תמיכה, ליווי ותמיכה נפשית למשפחות בשעת אבל ובכלל.
          </p>
        </div>
      </header>

      <section className="support-content">
        <div className="container">
          <div className="support-list">
            {SUPPORT_ORGS.map((org, i) => {
              const Icon = org.icon;
              return (
                <div key={i} className="support-card">
                  <div className="support-card-icon">
                    <Icon aria-hidden="true" />
                  </div>
                  <div className="support-card-body">
                    <h2 className="support-card-title">{org.name}</h2>
                    <p className="support-card-desc">{org.description}</p>
                    <a
                      href={org.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="support-card-link"
                    >
                      לאתר הארגון →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="support-footer">
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

export default Support;
