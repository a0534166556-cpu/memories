import { Link } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import './Gallery.css';

const sampleMemorials = [
  {
    id: 'legacy-familial',
    name: 'משה כהן',
    years: '1932 – 2020',
    description: 'איש משפחה חם ואהוב, מורה ומחנך שהקדיש את חייו להשראה לדורות צעירים.',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    alt: 'תמונה של אדם מבוגר מחייך עם הנכד שלו בפארק',
    highlights: ['אלבום תמונות משפחתי', 'קטעי וידאו מהחגים', 'פרקי תהילים לפי בקשת המשפחה'],
  },
  {
    id: 'service-community',
    name: 'רות לוי',
    years: '1945 – 2018',
    description: 'מתנדבת בקהילה ועוסקת צדקה, ידועה בחיובה ובמסירותה לעזרה לזולת.',
    image:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    alt: 'צילום של נרות דולקים ליד פרחים לבנים',
    highlights: ['סיפורי מתנדבים', 'מפות מיקומים של פרויקטים', 'תפילות יומיות מוקלטות'],
  },
  {
    id: 'creative-soul',
    name: 'דוד פרידמן',
    years: '1985 – 2023',
    description: 'אמן ויוצר מוזיקה, שהשאיר אחריו יצירות מקוריות ומסרים מעוררי השראה.',
    image:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
    alt: 'אדם מנגן בגיטרה באולפן הקלטות',
    highlights: ['פלייליסט יצירות מקוריות', 'מכתבי פרידה מחברים', 'ספר זיכרונות דיגיטלי'],
  },
];

function Gallery() {
  return (
    <main className="gallery-page" role="main">
      <section className="gallery-hero" aria-labelledby="gallery-heading">
        <div className="gallery-container">
          <h1 id="gallery-heading">גלריית דפי זיכרון לדוגמה</h1>
          <p>
            התרשמו מדפי זיכרון שנבנו עבור משפחות שונות, קבלו השראה לפריסת התוכן, ולמדו איך ניתן לשלב
            תמונות, סיפורים, וקטעי שמע.
          </p>
          <div className="gallery-hero__actions">
            <Link to="/gallery/example" className="btn btn-secondary">
              דף זיכרון לדוגמה
            </Link>
            <Link to="/create" className="btn btn-primary">
            <FaPlus /> יצירת דף זיכרון משלכם
          </Link>
          </div>
        </div>
      </section>

      <section className="gallery-list" aria-label="דוגמאות לדפי זיכרון">
        <div className="gallery-container">
          {sampleMemorials.map((memorial) => (
            <article key={memorial.id} className="gallery-card">
              <img src={memorial.image} alt={memorial.alt} className="gallery-card__image" />
              <div className="gallery-card__content">
                <header>
                  <h2>{memorial.name}</h2>
                  <p className="gallery-card__years">{memorial.years}</p>
                </header>
                <p className="gallery-card__description">{memorial.description}</p>
                <h3 className="gallery-card__subheading">מה ניתן למצוא בדף?</h3>
                <ul>
                  {memorial.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Gallery;


