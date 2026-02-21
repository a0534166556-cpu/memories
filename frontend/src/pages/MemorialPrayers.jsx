import { Link } from 'react-router-dom';
import { pageTitle, sections } from '../data/memorialPrayersContent';
import { tehilimData } from '../data/tehilim';
import './MemorialPrayers.css';

function MemorialPrayers() {
  return (
    <>
      <nav className="top-navigation memorial-prayers-nav">
        <div className="container">
          <div className="nav-links">
            <Link to="/" className="nav-link">דף הבית</Link>
            <Link to="/about" className="nav-link">אודותינו</Link>
            <Link to="/memorial-prayers" className="nav-link active">סדר תפילות לאזכרה</Link>
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
      <main className="memorial-prayers-page" role="main">
        <div className="container">
        <header className="prayers-header">
          <h1>{pageTitle}</h1>
        </header>

        <div className="prayers-content">
          {sections.map((section, index) => (
            <section key={index} className="prayer-section">
              {section.title && <h2 className="section-title">{section.title}</h2>}
              {section.sub && <h3 className="section-sub">{section.sub}</h3>}
              <div className="section-body">
                {section.psalmChapter && tehilimData[section.psalmChapter] ? (
                  tehilimData[section.psalmChapter].verses.map((verse, i) => (
                    <p key={i}>{verse}</p>
                  ))
                ) : section.body ? (
                  section.body.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))
                ) : null}
              </div>
            </section>
          ))}
        </div>

        <div className="prayers-footer">
          <Link to="/">← חזרה לדף הבית</Link>
        </div>
      </div>
    </main>
    </>
  );
}

export default MemorialPrayers;
