import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaPlay, FaPause, FaVolumeUp, FaHeart, FaBook, FaHistory, FaFire, FaComment } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import TehilimReader from '../components/TehilimReader';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './MemorialPage.css';

// Example memorial data - structured like a real user-created memorial
const exampleMemorial = {
  name: 'שמואל (סמי) ארז',
  hebrewName: 'שמואל בן אברהם ושרה',
  birthDate: '1954-03-15',
  deathDate: '2024-11-20',
  heroImage: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=900&q=80',
  heroSummary: 'מחנך, מתנדב, ואב מסור שהאיר פנים לכל אדם. חייו הטביעו חותם של חסד, סבלנות ותקווה עבור קהילתו ובני משפחתו. זכרו יישאר בליבנו לנצח.',
  biography: 'שמואל ארז נולד בשכונת נחלאות בירושלים לבית צנוע ומלא ערכים. כבר מילדות גילה אהבה עמוקה לעזרה לזולת והיה מוכר בשכונה כמי שתמיד מוכן להגיש יד, לחייך ולשמח את הלבבות. עיניו הטובות והחיוך החם שלו היו סימן ההיכר שלו, וכל מי שפגש אותו חש מיד את החום והאנושיות שזרמו ממנו.\n\nלאחר שירות צבאי משמעותי בו גילה אומץ ונאמנות, המשיך שמואל ללימודי חינוך והפך למורה אהוב ומוערך. תלמידיו זוכרים אותו כמי שהאמין בהם גם כשלא האמינו בעצמם, כמי שלימד לא רק חומר לימודי אלא גם ערכים, כבוד ואהבת אדם. "המורה שמואל שינה את חיי" - כך אמרו רבים מתלמידיו.\n\nלאורך הקריירה שלו, דאג שמואל להרחיב את תחום ההשפעה שלו. הוא הקים עמותה קהילתית במטרה לתת מענה לנוער במצבי משבר וסיפק להם ליווי אישי, פעילויות העשרה ומרחב בטוח לגדול בו. מאות בני נוער מצאו בו דמות אב, מנטור וחבר אמיתי. "הוא היה האב שלא היה לי" - כך סיפר אחד מהם.\n\nלצד פעילותו הציבורית, שמואל היה אב מסור וזוגיותו עם אסתר התאפיינה בשותפות עמוקה, אהבה בלתי מתפשרת וכבוד הדדי. יחד הם בנו בית מלא אהבה, צחוק וזיכרונות יקרים. שלושת ילדיהם גדלו באווירה של נתינה, ערכים ואמונה בטוב שבאדם.\n\nבשנותיו האחרונות השקיע את זמנו בנכדיו, שהפכו למרכז עולמו. הוא ארגן מפגשי שבת משפחתיים, סיפר סיפורים, שר שירים ולמד איתם תורה. הנכדים זוכרים את הסיפורים שלו, את החיבוקים החמים ואת האהבה הבלתי מותנית שזרמה ממנו. "סבא היה הגיבור שלי" - כך אמר אחד הנכדים.\n\nשמואל המשיך להוביל שיעורי השראה שבועיים על ערכים, מסורת וחסד עד ימיו האחרונים. הוא האמין שכל אדם יכול לשנות את העולם, ולו במעט, אם רק יבחר בטוב.\n\nהוא הותיר אחריו משפחה מאוחדת, תלמידים רבים שזכו להכיר אותו, ומורשת של נדיבות, מוזיקה ושמחה. הזיכרונות שלו מלווים אותנו בכל יום, והאהבה שלו ממשיכה להאיר את דרכנו. תהא נשמתו צרורה בצרור החיים.',
  images: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=1400&q=80'
  ],
  videos: [],
  timeline: [
    {
      year: '1954',
      title: 'ילדות בירושלים',
      description: 'נולד וגדל בשכונת נחלאות בירושלים, לבית שדגל בערכים של חסד ונתינה. כבר כילד אהב להסתובב בשוק מחנה יהודה, לעזור לזקנים לשאת את הקניות ולשמוע את סיפורי השכונה. המורים בבית הספר השכונתי זוכרים אותו כמי שתמיד היה מוכן לעזור לחבריו ולשתף את מה שהיה לו.'
    },
    {
      year: '1976',
      title: 'הקמת משפחה',
      description: 'נישא לאסתר, אהבת חייו, והקים יחד איתה בית חם ומכיל. שלושת ילדיהם גדלו באווירה של אהבה, כבוד וצחוק. הבית שלהם היה תמיד פתוח לאורחים, לחברים ולמשפחה הרחבה. שמואל ואסתר היו זוג מושלם - משלימים זה את זה, תומכים זה בזה ומאירים זה את זה.'
    },
    {
      year: '1992',
      title: 'מפעל חייו',
      description: 'ייסד עמותה לקידום נוער במצוקה והקים מרכז העשרה וחונכות שהשפיע על מאות בני נוער ברחבי העיר. "כל ילד הוא עולם ומלואו" - כך נהג לומר. הוא האמין בכל אחד מהם, גם כשלא האמינו בעצמם. רבים מהם הפכו לאנשים טובים יותר בזכותו, וזוכרים אותו באהבה ובכבוד.'
    },
    {
      year: '2015',
      title: 'שנות הסבאות',
      description: 'התמסר לנכדיו בכל ליבו ונפשו. ארגן מפגשי שבת משפחתיים מלאי שמחה, סיפורים ושירים. תמיד הגיע עם חיוך רחב, חיבוקים חמים ומדליק נרות לזכר יקיריו הקודמים במשפחה. הנכדים זוכרים את הסיפורים שלו, את הצחוק המשותף ואת האהבה הבלתי מותנית. "סבא היה הכי טוב בעולם" - כך אמרו כולם.'
    }
  ],
  tehilimChapters: '23,103,130',
  backgroundMusic: '/audio/sad-vibes.mp3'
};

function MemorialExample() {
  const [showTehilim, setShowTehilim] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [candles, setCandles] = useState([]);
  const [hasLitCandle, setHasLitCandle] = useState(false);
  const [isCandleLit, setIsCandleLit] = useState(false);
  const [condolences, setCondolences] = useState([]);
  const [showCondolences, setShowCondolences] = useState(false);
  const [condolenceForm, setCondolenceForm] = useState({ name: '', message: '' });
  const [submittingCondolence, setSubmittingCondolence] = useState(false);
  const audioRef = useRef(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL');
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const lightCandle = () => {
    if (hasLitCandle) {
      alert('כבר הדלקת נר זיכרון לדף זה');
      return;
    }

    const newCandle = {
      id: Date.now(),
      litBy: 'אנונימי',
      createdAt: new Date().toISOString()
    };

    setCandles([...candles, newCandle]);
    setHasLitCandle(true);
    setIsCandleLit(true);
    setTimeout(() => setIsCandleLit(false), 2000);
  };

  const submitCondolence = (e) => {
    e.preventDefault();
    if (!condolenceForm.name.trim() || !condolenceForm.message.trim()) {
      alert('אנא מלא שם והודעה');
      return;
    }

    setSubmittingCondolence(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const newCondolence = {
        id: Date.now(),
        name: condolenceForm.name,
        message: condolenceForm.message,
        createdAt: new Date().toISOString()
      };

      setCondolences([...condolences, newCondolence]);
      setCondolenceForm({ name: '', message: '' });
      alert('תודה על הודעתך. ההודעה תפורסם לאחר אישור המשפחה.');
      setSubmittingCondolence(false);
    }, 500);
  };

  const memorial = exampleMemorial;
  const allMedia = [
    ...memorial.images.map(url => ({ type: 'image', url })),
    ...memorial.videos.map(url => ({ type: 'video', url }))
  ];
  const timelineEvents = Array.isArray(memorial.timeline) ? memorial.timeline.filter(event =>
    (event.year && event.year.trim()) ||
    (event.title && event.title.trim()) ||
    (event.description && event.description.trim())
  ) : [];

  return (
    <div className="memorial-page">
      {/* Background Music Player */}
      {memorial?.backgroundMusic && (
        <>
          <audio
            ref={audioRef}
            src={memorial.backgroundMusic}
            loop
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <button className="music-control" onClick={toggleMusic} title={isPlaying ? 'השהה מוזיקה' : 'נגן מוזיקה'}>
            {isPlaying ? <FaPause /> : <FaPlay />}
            <FaVolumeUp className="volume-icon" />
          </button>
        </>
      )}

      {/* Header */}
      <div className="memorial-header">
        <div className="header-overlay">
          <div className="container">
            <Link to="/" className="home-link">
              <FaHome /> דף הבית
            </Link>
            <div className="memorial-title-section">
              <h1 className="memorial-name">{memorial.name}</h1>
              {memorial.hebrewName && (
                <p className="hebrew-name">{memorial.hebrewName}</p>
              )}
              <div className="dates">
                {memorial.birthDate && (
                  <span>{formatDate(memorial.birthDate)}</span>
                )}
                {memorial.birthDate && memorial.deathDate && <span> - </span>}
                {memorial.deathDate && (
                  <span>{formatDate(memorial.deathDate)}</span>
                )}
              </div>
              {(memorial.heroImage || memorial.heroSummary) && (
                <div className="memorial-hero-intro">
                  {memorial.heroImage && (
                    <figure className="memorial-hero-portrait">
                      <img src={memorial.heroImage} alt={`דיוקן של ${memorial.name}`} />
                    </figure>
                  )}
                  {memorial.heroSummary && (
                    <p className="memorial-hero-summary">{memorial.heroSummary}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container memorial-content">
        {/* Media Gallery */}
        {allMedia.length > 0 && (
          <section className="media-section">
            <h2 className="section-title">
              <FaHeart /> גלריית זיכרונות
            </h2>
            <div className="media-gallery">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: true }}
                className="memorial-swiper"
              >
                {allMedia.map((media, index) => (
                  <SwiperSlide key={index}>
                    <div className="media-slide">
                      {media.type === 'image' ? (
                        <img src={media.url} alt={`זיכרון ${index + 1}`} />
                      ) : (
                        <video src={media.url} controls />
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )}

        {/* Biography */}
        {memorial.biography && (
          <section className="biography-section">
            <h2 className="section-title">סיפור חיים</h2>
            <div className="biography-content">
              <p>{memorial.biography}</p>
            </div>
          </section>
        )}

        {/* Timeline */}
        {timelineEvents.length > 0 && (
          <section className="timeline-section">
            <h2 className="section-title">
              <FaHistory /> ציר חיים
            </h2>
            <ol className="timeline-list">
              {timelineEvents.map((event, index) => {
                const year = (event.year || '').trim();
                const title = (event.title || '').trim();
                const description = (event.description || '').trim();

                return (
                  <li key={index} className="timeline-item">
                    <div className="timeline-item__year">{year || '—'}</div>
                    <div className="timeline-item__body">
                      {title && <h3>{title}</h3>}
                      {description && <p>{description}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* Tehilim Section */}
        {memorial.tehilimChapters && (
          <section className="tehilim-section">
            <div className="tehilim-header">
              <h2 className="section-title">
                <FaBook /> פרקי תהילים
              </h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowTehilim(!showTehilim)}
              >
                {showTehilim ? 'סגור תהילים' : 'קרא תהילים'}
              </button>
            </div>
            {showTehilim && (
              <TehilimReader chapters={memorial.tehilimChapters} />
            )}
          </section>
        )}

        {/* Virtual Candle Section */}
        <section className="candle-section">
          <h2 className="section-title">
            <FaFire /> נר זיכרון
          </h2>
          <div className="candle-content">
            {!hasLitCandle ? (
              <button 
                className={`candle-button ${isCandleLit ? 'lit' : ''}`}
                onClick={lightCandle}
              >
                <div className="candle-flame"></div>
                <div className="candle-body"></div>
              </button>
            ) : (
              <div className="candle-button lit">
                <div className="candle-flame"></div>
                <div className="candle-body"></div>
              </div>
            )}
            <div className="candle-info">
              <p className="candle-count">{candles.length} נרות דולקים</p>
              <p className="candle-text">
                {hasLitCandle ? 'הדלקת נר זיכרון' : 'לחץ להדלקת נר זיכרון'}
              </p>
            </div>
          </div>
          
          {candles.length > 0 && (
            <div className="candles-list">
              <h3>נרות שהודלקו ({candles.length})</h3>
              <div className="candles-grid">
                {candles.map((candle) => (
                  <div key={candle.id} className="candle-item">
                    <div className="candle-item-icon">
                      <div className="candle-flame small"></div>
                      <div className="candle-body small"></div>
                    </div>
                    <div className="candle-item-info">
                      <p className="candle-item-name">{candle.litBy || 'אנונימי'}</p>
                      <p className="candle-item-date">
                        {new Date(candle.createdAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Condolences Section */}
        <section className="condolences-section">
          <div className="condolences-header">
            <h2 className="section-title">
              <FaComment /> הודעות תנחומים
            </h2>
            <button
              className="btn btn-secondary"
              onClick={() => setShowCondolences(!showCondolences)}
            >
              {showCondolences ? 'סגור' : 'הצג הודעות'}
            </button>
          </div>

          {showCondolences && (
            <>
              <form className="condolence-form" onSubmit={submitCondolence}>
                <h3>השאר הודעת תנחומים</h3>
                <div className="form-group">
                  <label htmlFor="condolence-name">שמך *</label>
                  <input
                    type="text"
                    id="condolence-name"
                    value={condolenceForm.name}
                    onChange={(e) => setCondolenceForm({ ...condolenceForm, name: e.target.value })}
                    required
                    placeholder="הכנס את שמך"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="condolence-message">הודעתך *</label>
                  <textarea
                    id="condolence-message"
                    value={condolenceForm.message}
                    onChange={(e) => setCondolenceForm({ ...condolenceForm, message: e.target.value })}
                    required
                    rows="4"
                    placeholder="כתוב הודעת תנחומים..."
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submittingCondolence}>
                  שלח הודעה
                </button>
              </form>

              <div className="condolences-list">
                <h3>הודעות תנחומים ({condolences.length})</h3>
                {condolences.length === 0 ? (
                  <p className="no-condolences">עדיין לא הוגשו הודעות תנחומים</p>
                ) : (
                  <div className="condolences-items">
                    {condolences.map((condolence) => (
                      <div key={condolence.id} className="condolence-item">
                        <div className="condolence-header-item">
                          <strong>{condolence.name}</strong>
                          <span className="condolence-date">
                            {new Date(condolence.createdAt).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                        <p className="condolence-message">{condolence.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="memorial-footer">
        <p>תהא נשמתו צרורה בצרור החיים</p>
      </footer>
    </div>
  );
}

export default MemorialExample;
