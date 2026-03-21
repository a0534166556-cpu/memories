import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FaPlus, FaQrcode, FaHeart, FaImages, FaBook, FaBookOpen, FaHistory, FaShareAlt, FaPrint, FaMusic, FaMapMarkerAlt, FaBell, FaFire, FaCalendarAlt, FaHandsHelping, FaHandHoldingHeart, FaChevronDown, FaArrowLeft, FaCommentDots, FaStar } from 'react-icons/fa';
import { EXAMPLE_MEMORIAL_HERO_IMAGE_URL } from '../data/exampleMemorialConstants';
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

/** תמונת הפרופיל בראש דף הדוגמה – לסנכרון עם `heroImage` ב־MemorialExample.jsx */
const EXAMPLE_MEMORIAL_PROFILE_SRC =
  'https://app.memoriez.co.il/wp-content/uploads/2024/09/c2e0d17f-e7a1-4723-b279-e58e81968de5.jpeg';

/** קולאז' בדף הבית – תמונות לפי בקשה + תמונת פרופיל מדף הזיכרון לדוגמה */
const MEMORIAL_POLAROID_IMAGES = [
  {
    src: 'https://otzem-app.s3.eu-central-1.amazonaws.com/wp-content/uploads/2024/09/19122756/%D7%A8%D7%95%D7%A2%D7%99-%D7%95%D7%99%D7%99%D7%96%D7%A8-1.jpeg',
    alt: 'תמונה להמחשה – דף זיכרון דיגיטלי',
    className: 'polaroid polaroid--1'
  },
  {
    src: 'https://image-resizer.walla.cloud/image/2024/12/2/images/1733740266616_picture_466x460.webp?width=334',
    alt: 'תמונה להמחשה – דף זיכרון דיגיטלי',
    className: 'polaroid polaroid--2'
  },
  {
    src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-KeFR5jtuwwxBqZ9aS9PoLC9uKflfHMQLutqaWTOaYQ&s',
    alt: 'תמונה להמחשה – דף זיכרון דיגיטלי',
    className: 'polaroid polaroid--3'
  },
  {
    src: EXAMPLE_MEMORIAL_HERO_IMAGE_URL,
    alt: 'תמונת פרופיל מדף הזיכרון לדוגמה (כמו בכפתור "דף זיכרון לדוגמה")',
    className: 'polaroid polaroid--4 polaroid--profile'
  }
];

/** כל מה שכלול בדף הזיכרון – תואם לתכונות בפועל באתר */
const MEMORIAL_SHOWCASE_ITEMS = [
  { icon: FaHeart, text: 'פרופיל מכובד: שם עברי ולועזי, תאריכי לידה ופטירה, תמונת כותרת ותקציר — הכל ניתן לעדכן שוב ושוב במסלולי השמירה' },
  { icon: FaImages, text: 'גלריית תמונות וסרטונים במצגת נוחה, עם גלילה בין פריטי המדיה' },
  { icon: FaBook, text: 'סיפור חיים מלא, ציר זמן (אבני דרך), ופרקי תהילים ומשניות לעילוי הנשמה — קריאה נוחה מהמסך' },
  { icon: FaBookOpen, text: 'טקס אזכרה אישי: תבנית סדר מלאה (יהי רצון, קדיש, תהילים ועוד) שניתנת לעריכה חופשית מלאה' },
  { icon: FaHistory, text: 'תפילות יזכור ואל מלא רחמים — כולל העתקה מהירה ללוח' },
  { icon: FaFire, text: 'הדלקת נר וירטואלי לזכר הנפטר' },
  { icon: FaCommentDots, text: 'הודעות תנחומים ממבקרים — מוצגות בדף לאחר פרסום' },
  { icon: FaMapMarkerAlt, text: 'מיקום בית קברות וקישור לניווט, מוזיקת רקע לדף (הפעלה והשתקה)' },
  { icon: FaBell, text: 'תזכורת במייל לפני יום האזכרה — הרשמה אופציונלית בעת יצירת הדף' },
  { icon: FaQrcode, text: 'קוד QR להדפסה והצבה על המצבה, שיתוף בוואטסאפ ובמייל, והדפסת הדף עם בחירת גודל טקסט (נגישות)' },
  { icon: FaCalendarAlt, text: 'אירועים לזכרו — תאריך, מקום, קישור לרישום או פרטים' },
  { icon: FaHandHoldingHeart, text: 'קישור לתרומה לזכר הנפטר (אם הוגדר) ומשאבים למשפחות דרך עמוד התמיכה וההנחיה' }
];

function Home() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  return (
    <main className="home" role="main">
      <Helmet>
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.origin + '/' : 'https://memoriesman.netlify.app/'} />
        <meta property="og:title" content="דף זיכרון דיגיטלי לנפטר | הנצחה אונליין עם QR למצבה" />
        <meta property="og:description" content="דף זיכרון דיגיטלי לנפטר — אתר הנצחה אישי: תמונות, סיפור חיים, תהילים ו־QR על המצבה. מקום מכובד לזכרו, זמין מכל מקום." />
      </Helmet>
      {/* Navigation Header */}
      <nav className="top-navigation">
        <div className="container">
          <div className="nav-links">
            <Link to="/" className="nav-link">דף הבית</Link>
            <Link to="/about" className="nav-link">אודותינו</Link>
            <Link to="/support" className="nav-link">משאבים למשפחות</Link>
            <Link to="/memorial-prayers" className="nav-link">סדר תפילות לאזכרה</Link>
            <Link to="/contact" className="nav-link">צור קשר</Link>
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

      <div className="home-dark-band">
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
        <div className="hero-constellation" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-open" aria-label="פתיח">
            <span className="hero-pill">
              <span className="hero-pill-dot" aria-hidden="true" />
              דף זיכרון דיגיטלי לנפטר · QR למצבה
            </span>
            <p className="hero-headline">
              <span className="hero-headline-primary">אתר זיכרון אישי ברשת</span>
              <span className="hero-headline-accent">לזכרם של יקירכם</span>
            </p>
            <p className="hero-subhook">
              מקום מכובד <span className="hero-subhook-highlight">לסיפור חייו</span>, לתמונות ולזיכרון — נגיש בלחיצה מכל טלפון או מחשב.
            </p>
          </div>
          <h1 className="hero-feel-main">
            <span className="hero-feel-main__text">להרגיש.</span>
          </h1>
          <div className="hero-prose">
            <p className="hero-lead">
              <span className="hero-lead-intro">בדף אחד מרוכזים</span>
              פרופיל מכובד לנפטר, גלריה, סיפור חיים, תהילים ומשניות, נר וירטואלי, תנחומים — וקוד{' '}
              <strong className="hero-lead-strong">QR על המצבה</strong> שנפתח ישר לדף הזיכרון.
            </p>
            <p className="hero-lead hero-lead--secondary">
              הדף נגיש מכל טלפון או מחשב, בישראל ובחו״ל, בלי להוריד אפליקציה.
            </p>
          </div>
          <div className="hero-reassure" role="note">
            <strong>אתר הנצחה שתיצרו בעצמכם</strong>
            <span className="hero-reassure-body">
              — תוך דקות הדף מוכן לשיתוף. מתחילים בחינם (24 שעות), ואפשר להוסיף שמירה לאורך זמן כשתחליטו.
            </span>
          </div>
          <div className="hero-buttons">
            <Link to="/create" className="btn btn-secondary">
              <FaPlus /> צור דף זיכרון עכשיו
            </Link>
            <Link to="/gallery/example" className="btn btn-primary">
              דף זיכרון לדוגמה
            </Link>
            <a href="#how-it-works" className="btn btn-primary">
              מה זה דף זיכרון ואיך זה עובד?
            </a>
          </div>
          <div className="hero-links">
            <Link to="/pricing" className="hero-link">לתוכניות ומחירים</Link>
          </div>
        </div>
      </header>

      <section className="memorial-showcase" aria-labelledby="memorial-showcase-heading">
        <div className="container">
          <div className="memorial-showcase-inner">
            <div className="memorial-showcase-collage">
              <div className="polaroid-stack">
                {MEMORIAL_POLAROID_IMAGES.map((item) => (
                  <div key={item.className} className={item.className}>
                    <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
                  </div>
                ))}
                <div className="memorial-showcase-emblem" aria-hidden="true" title="זיכרון מאיר">
                  <FaStar className="memorial-emblem-star" />
                </div>
              </div>
              <p className="memorial-showcase-collage-caption">
                התמונות כאן להמחשה בלבד. בדף שתיצרו יופיעו התמונות, הטקסטים והסיפור האמיתיים של יקיריכם.
              </p>
            </div>
            <div className="memorial-showcase-content">
              <div className="memorial-showcase-panel">
                <p className="memorial-showcase-eyebrow">כל מה שכלול בדף</p>
                <h2 id="memorial-showcase-heading" className="memorial-showcase-title">
                  מה כולל דף הזיכרון אצלנו?
                </h2>
                <p className="memorial-showcase-subtitle">
                  בכל תוכנית שמירה (זמנית, חודשית, שנתית או לצמיתות) מקבלים את אותן התכונות — ההבדל הוא רק במשך הפעילות של הדף.
                  להלן הרשימה המלאה של מה שמגיע ללקוחות.
                </p>
                <ul className="memorial-showcase-list">
                  {MEMORIAL_SHOWCASE_ITEMS.map((row, i) => {
                    const Icon = row.icon;
                    return (
                      <li key={i} className="memorial-showcase-list-item" style={{ '--item-index': i }}>
                        <span className="memorial-showcase-list-icon" aria-hidden="true">
                          <Icon />
                        </span>
                        <span className="memorial-showcase-list-text">{row.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="memorial-showcase-cta-wrap">
                <Link to="/create" className="memorial-showcase-cta">
                  צרו דף זיכרון
                  <FaArrowLeft className="memorial-showcase-cta-icon" aria-hidden="true" />
                </Link>
                <Link to="/pricing" className="memorial-showcase-cta-secondary">
                  תוכניות ומחירים
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      <section id="how-it-works" className="features" aria-labelledby="features-heading">
        <div className="container">
          <h2 id="features-heading" className="section-title section-title--decorated">איך זה עובד?</h2>
          <p className="how-intro">
            התהליך <em className="how-intro-em">פשוט ומכבד</em>: אתם ממלאים את התוכן — אנחנו נותנים את המבנה, העיצוב והכלים.
            <span className="how-intro-line"> שלושה צעדים קצרים ויש לכם דף זיכרון מוכן לשיתוף.</span>
          </p>
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
                <FaShareAlt />
              </div>
              <h3>שתפו והנציחו</h3>
              <p>שלחו את קישור דף הזיכרון למי שתרצו. הדף נשאר זמין — לפי התוכנית שבחרתם (כולל אפשרות הנצחה).</p>
            </div>
          </div>
        </div>
      </section>

      <section className="memorial-features-detail" aria-labelledby="memorial-detail-heading">
        <div className="container">
          <h2 id="memorial-detail-heading" className="section-title section-title--decorated section-title--on-light">מה יש בדף זיכרון?</h2>
          <p className="memorial-detail-intro">
            <span className="memorial-detail-intro-lead">בכל התוכניות — זמנית, חודשית, שנתית או לצמיתות — מופיעות אותן תכונות בדף.</span>{' '}
            ההבדל הוא רק <strong>במשך השמירה והגישה</strong>: 24 שעות בחינם, או שמירה מתמשכת בתשלום. המבקרים תמיד רואים דף מסודר, נוח לצפייה ולשיתוף.
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
              <div className="memorial-detail-icon"><FaBookOpen /></div>
              <h3>טקס אזכרה אישי</h3>
              <p>סדר תפילות מלא לעריכה חופשית, כולל דף ייעודי &quot;כניסה לטקס&quot; עם כל הטקסטים.</p>
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
              <div className="memorial-detail-icon"><FaCommentDots /></div>
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
            <div className="memorial-detail-card">
              <div className="memorial-detail-icon"><FaHandHoldingHeart /></div>
              <h3>תרומה לזכר</h3>
              <p>אפשר להציג קישור לארגון או לקמפיין לזכר הנפטר — לפי מה שתגדירו בדף.</p>
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
          <h2 id="faq-heading" className="section-title section-title--decorated section-title--on-light">שאלות נפוצות</h2>
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
          <Link to="/contact">צור קשר והצעות</Link>
        </div>
      </footer>
    </main>
  );
}

export default Home;

