import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaPlay, FaPause, FaVolumeUp, FaHeart, FaBook, FaBookOpen, FaHistory, FaFire, FaComment, FaMapMarkerAlt, FaTimes, FaExpand, FaShareAlt, FaEnvelope, FaCopy, FaPrint, FaPalette, FaBell, FaDownload, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import TehilimReader from '../components/TehilimReader';
import MishnayotReader from '../components/MishnayotReader';
import { memorialPageTranslations } from '../i18n/memorialPage';
import { yizkorText, elMaleRachamimText } from '../data/yizkorPrayers';
import 'swiper/css';
import 'swiper/css/navigation';
import './MemorialPage.css';
import './MemorialExample.css';

const EXAMPLE_PAGE_URL =
  typeof window !== 'undefined' ? window.location.origin + '/gallery/example' : 'https://memoriesman.netlify.app/gallery/example';
const BACKGROUND_OPTIONS = [
  { id: 'default', label: 'רגיל', title: 'רקע רגיל' },
  { id: 'paper', label: 'נייר', title: 'רקע נייר שמנת' },
  { id: 'warm', label: 'חם', title: 'רקע חם/בז\'ה' },
  { id: 'sky', label: 'שמיים', title: 'רקע תכלת עדין' },
  { id: 'nature', label: 'טבע', title: 'רקע ירוק עדין' },
  { id: 'gradient', label: 'גרדיאנט', title: 'רקע גרדיאנט' },
  { id: 'dark', label: 'כהה', title: 'רקע כהה' },
];

// דף לדוגמה — כל השדות והסקשנים כמו בדף זיכרון אמיתי (להמחשה בלבד)
const exampleMemorial = {
  name: 'סגן יעקב אליאן ז"ל',
  hebrewName: 'יעקב בן יורם וסילביה',
  birthDate: '2003-01-15',
  deathDate: '2023-12-20',
  heroImage: 'https://app.memoriez.co.il/wp-content/uploads/2024/09/c2e0d17f-e7a1-4723-b279-e58e81968de5.jpeg',
  heroSummary: 'התגייס לגבעתי ב-2022 והגשים את חלום חייו להילחם על הארץ. צוער בגדוד "גפן" בבית הספר לקצינים, נפל בקרב בצפון רצועת עזה ב-20/12/23 תוך ביצוע מעשי גבורה כשהסתער לתוך האש כדי להציל את חברו שנפגע מאש מחבלים. בן 20 במותו.',
  biography: 'סגן יעקב אליאן ז"ל התגייס לגבעתי ב-2022 והגשים את חלום חייו להילחם על הארץ. צוער בגדוד "גפן" בבית הספר לקצינים, שנפל בקרב בצפון רצועת עזה ב-20/12/23, תוך ביצוע מעשי גבורה כשהסתער לתוך האש כדי להציל את חברו שנפגע מאש מחבלים. בן 20 במותו.\n\nכל כך צעיר, עניו – חינניות אפיינה אותו ואת מראהו. היה ילד של תרומה לזולת, נתינה אינסופית, תורם לחברה ללא גבולות, מתנדב בקהילה, חבר מופלא, בן מסור להוריו ולמשפחתו, שתמיד היה שם עבור כולם ועבור כל דבר.\n\nכנער התנדב באופן קבוע במשטרת ישראל, ניצל כל זמן שהיה לתרומה לקהילה. בלווייתו היה ניתן להיווכח כיצד בכל תחנות חייו השאיר חותם על מוריו וחבריו – נציגים מכל תחנות חייו באו לחלוק לו כבוד בדרכו האחרונה, החל מהגננת ועד למנהלי בתי הספר בהם למד.\n\nמרכזי החינוך אמונים בגבעתיים ותיכון אמי"ת בר אילן בגבעת שמואל הטמיעו בו את ערכי תורה ועבודה שלהם הם מחנכים: אהבת הארץ, מצוינות, תרומה לחברה ואמונה בנצח ישראל. וכמובן, שמורה להוריו היקרים סילביה ויורם אליאן מלוא ההערכה על גידולו לתפארת של יעקב והטמעת הערכים של ציונות ואהבת המדינה.\n\nיעקב הוא בן יחיד להוריו, אח לאחותו הצעירה קרן. מתגעגעים אלייך יעקב.',
  /* תמונות גלריה — לא אותן תמונות שבקולאז' דף הבית */
  images: [
    'https://app.memoriez.co.il/wp-content/uploads/forminator/1626_7388d296f009d41d0cd8267a6979706c/uploads/OMFlEEo5cWhY-e1bca42b-6646-4ccc-90b3-e82227dd7638.jpeg'
  ],
  videos: ['/demo-gallery-video.mp4'],
  timeline: [
    {
      year: '2022',
      title: 'התגייסות לגבעתי',
      description: 'התגייס לגבעתי והגשים את חלום חייו להילחם על הארץ. צוער בגדוד "גפן" בבית הספר לקצינים.'
    },
    {
      year: '2023',
      title: 'נפילה בקרב',
      description: 'נפל בקרב בצפון רצועת עזה ב-20/12/23, תוך ביצוע מעשי גבורה – הסתער לתוך האש כדי להציל את חברו שנפגע מאש מחבלים. בן 20 במותו.'
    },
    {
      year: 'תיכון',
      title: 'אמי"ת בר אילן גבעת שמואל',
      description: 'מרכזי החינוך אמונים בגבעתיים ותיכון אמי"ת בר אילן הטמיעו בו ערכי תורה ועבודה, אהבת הארץ, מצוינות, תרומה לחברה ואמונה בנצח ישראל.'
    },
    {
      year: 'התנדבות',
      title: 'משטרת ישראל וקהילה',
      description: 'כנער התנדב באופן קבוע במשטרת ישראל וניצל כל זמן לתרומה לקהילה. בלווייתו באו נציגים מכל תחנות חייו – מהגננת ועד מנהלי בתי הספר – לחלוק לו כבוד.'
    }
  ],
  tehilimChapters: '1,23,49,91,103,121,130',
  mishnayot: 'ברכות א, ברכות ב, שבת א, פסחים א',
  backgroundMusic: '/audio/Quiet-Honor-7.mp3',
  cemeteryName: 'בית העלמין הצבאי בהר הרצל',
  cemeteryAddress: 'ירושלים',
  latitude: 31.7735,
  longitude: 35.1785,
  ceremony_title: 'סדר תפילות לטקס אזכרה (לדוגמה)',
  ceremony_date: 'כ״ב בכסלו',
  ceremony_place: 'בית כנסת הקהילה (להמחשה)',
  ceremony_text: 'כאן מופיע תיאור קצר של הטקס. בדף אמיתי אפשר למלא תבנית מלאה (יהי רצון, קדיש, תהילים ועוד) ולערוך כל משפט.',
  ceremony_program:
    'יהי רצון מלפניך ה\' אלוהינו ואלוהי אבותינו, שיעלה לרצון לימוד זה לשם נשמת... (בדף אמיתי — טקס מלא לעריכה)\n\nפרק תהילים כ״ג — מזמור לדוד\nה\' רועי לא אחסר...\n\nקדיש יתגדל ויתקדש שמיה רבא...',
  charity_name: 'קרן לדוגמה לזכר הנפטר',
  charity_url: 'https://www.google.com/search?q=תרומה+לזכר',
  events: [
    {
      title: 'ערב זיכרון לסגן יעקב אליאן ז"ל',
      date: 'כ׳ בכסלו',
      place: 'אולם התרבות, גבעתיים',
      url: 'https://memoriesman.netlify.app/',
      description: 'ערב זיכרון משפחתי. בדף אמיתי אפשר לקשר לטופס רישום או לדף פרטים.'
    },
    {
      title: 'לימוד משותף לזכרו',
      date: 'מדי חודש',
      place: 'בית הכנסת המקומי',
      description: 'לימוד משניות ותהילים בהמשך שם הנפטר — דוגמה לשני אירועים בדף אחד.'
    }
  ],
  qrCodePath: null
};

function MemorialExample() {
  const [showTehilim, setShowTehilim] = useState(false);
  const [showMishnayot, setShowMishnayot] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [candles, setCandles] = useState([]);
  const [hasLitCandle, setHasLitCandle] = useState(false);
  const [isCandleLit, setIsCandleLit] = useState(false);
  const [condolences, setCondolences] = useState([]);
  const [showCondolences, setShowCondolences] = useState(false);
  const [condolenceForm, setCondolenceForm] = useState({ name: '', message: '' });
  const [submittingCondolence, setSubmittingCondolence] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(null);
  const [lang, setLang] = useState('he');
  const [fontSizeMode, setFontSizeMode] = useState('large');
  const [backgroundMode, setBackgroundMode] = useState('default');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);
  const [reminderEmail, setReminderEmail] = useState('');
  const [remindOnDay, setRemindOnDay] = useState(true);
  const [remind10DaysBefore, setRemind10DaysBefore] = useState(false);
  const [remindBirthday, setRemindBirthday] = useState(false);
  const [reminderSubmitting, setReminderSubmitting] = useState(false);
  const [reminderSubmitted, setReminderSubmitted] = useState(false);
  const [yizkorCopied, setYizkorCopied] = useState(false);
  const [elMaleCopied, setElMaleCopied] = useState(false);
  const [candleName, setCandleName] = useState('');
  const audioRef = useRef(null);
  const [showIntroScreen, setShowIntroScreen] = useState(false);
  const [introClosing, setIntroClosing] = useState(false);
  const introTimerRef = useRef(null);
  const introCloseStartedRef = useRef(false);

  const t = memorialPageTranslations[lang];
  const setLangAndSave = (l) => setLang(l);
  const setFontSizeAndSave = (m) => setFontSizeMode(m);
  const setBackgroundAndSave = (id) => { setBackgroundMode(id); setShowBackgroundMenu(false); };

  const finishIntro = useCallback(() => {
    if (introCloseStartedRef.current) return;
    introCloseStartedRef.current = true;
    if (introTimerRef.current) {
      clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }
    setIntroClosing(true);
    window.setTimeout(() => {
      setShowIntroScreen(false);
      setIntroClosing(false);
      introCloseStartedRef.current = false;
    }, 520);
  }, []);

  const dismissIntro = () => {
    if (introClosing) return;
    finishIntro();
  };

  useEffect(() => {
    const introImage = exampleMemorial?.heroImage || exampleMemorial?.images?.[0];
    if (introImage) {
      setShowIntroScreen(true);
      setIntroClosing(false);
      introCloseStartedRef.current = false;
      introTimerRef.current = window.setTimeout(() => {
        introTimerRef.current = null;
        finishIntro();
      }, 3000);
      return () => {
        if (introTimerRef.current) {
          clearTimeout(introTimerRef.current);
          introTimerRef.current = null;
        }
      };
    }
    setShowIntroScreen(false);
    setIntroClosing(false);
    introCloseStartedRef.current = false;
    return undefined;
  }, [finishIntro]);

  const shareUrl = EXAMPLE_PAGE_URL;
  const shareTitle = `דף זיכרון - ${exampleMemorial.name}`;
  const shareText = exampleMemorial.heroSummary
    ? `${exampleMemorial.name}: ${exampleMemorial.heroSummary.slice(0, 80)}...`
    : `דף זיכרון לזכר ${exampleMemorial.name}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(lang === 'he' ? 'הקישור הועתק ללוח.' : 'Link copied.');
      setShowShareMenu(false);
    } catch {
      alert(lang === 'he' ? 'לא ניתן להעתיק.' : 'Could not copy.');
    }
  };
  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');
    setShowShareMenu(false);
  };
  const shareViaEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
    setShowShareMenu(false);
  };
  const shareNative = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        alert(lang === 'he' ? 'הקישור שותף.' : 'Shared.');
      } else copyLink();
      setShowShareMenu(false);
    } catch (e) { if (e.name !== 'AbortError') copyLink(); }
  };
  const printMemorial = () => window.print();

  const copyPrayer = async (text, which) => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'yizkor') setYizkorCopied(true); else setElMaleCopied(true);
      setTimeout(() => { setYizkorCopied(false); setElMaleCopied(false); }, 2000);
    } catch {}
  };

  const submitReminder = (e) => {
    e.preventDefault();
    if (!reminderEmail.trim()) { alert(lang === 'he' ? 'נא להזין אימייל' : 'Enter email'); return; }
    if (!remindOnDay && !remind10DaysBefore && !remindBirthday) { alert(lang === 'he' ? 'נא לבחור תזכורת' : 'Choose a reminder'); return; }
    setReminderSubmitting(true);
    setTimeout(() => { setReminderSubmitted(true); setReminderSubmitting(false); }, 500);
  };

  let yahrzeitBanner = null;
  if (exampleMemorial.deathDate && exampleMemorial.deathDate.trim()) {
    try {
      const death = new Date(exampleMemorial.deathDate);
      if (!isNaN(death.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thisYear = new Date(today.getFullYear(), death.getMonth(), death.getDate());
        let nextYahrzeit = thisYear < today ? new Date(today.getFullYear() + 1, death.getMonth(), death.getDate()) : thisYear;
        const diffDays = Math.ceil((nextYahrzeit - today) / (1000 * 60 * 60 * 24));
        const hebrewDate = nextYahrzeit.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
        if (diffDays === 0) yahrzeitBanner = t.yahrzeitToday;
        else if (diffDays === 1) yahrzeitBanner = (t.yahrzeitTomorrow || 'מועד האזכרה מחר').replace('{date}', hebrewDate);
        else yahrzeitBanner = (t.yahrzeitInDays || 'מועד האזכרה בעוד {days} ימים').replace('{days}', diffDays).replace('{date}', hebrewDate);
      }
    } catch {}
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL');
  };

  const calculateAge = (birthDate, deathDate) => {
    if (!birthDate || !deathDate) return null;
    const birth = new Date(birthDate);
    const death = new Date(deathDate);
    let age = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      age--;
    }
    return age;
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
      litBy: (candleName && candleName.trim()) ? candleName.trim() : (lang === 'en' ? 'Anonymous' : 'אנונימי'),
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
  const images = Array.isArray(memorial.images) ? memorial.images : [];
  const videos = Array.isArray(memorial.videos) ? memorial.videos : [];
  const allMedia = [
    ...images.map(url => ({ type: 'image', url })),
    ...videos.map(url => ({ type: 'video', url }))
  ];
  const timelineEvents = Array.isArray(memorial.timeline) ? memorial.timeline.filter(event =>
    (event.year && event.year.trim()) ||
    (event.title && event.title.trim()) ||
    (event.description && event.description.trim())
  ) : [];

  const ceremonyProgramLines = String(memorial.ceremony_program || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const hasCeremonySection = Boolean(
    (memorial.ceremony_title && memorial.ceremony_title.trim()) ||
    (memorial.ceremony_date && memorial.ceremony_date.trim()) ||
    (memorial.ceremony_place && memorial.ceremony_place.trim()) ||
    (memorial.ceremony_text && memorial.ceremony_text.trim()) ||
    ceremonyProgramLines.length > 0
  );

  const memorialName = memorial.hebrewName || memorial.name;
  const deceasedNameForPrayer = memorialName && memorialName.trim() ? memorialName.trim() : 'הנפטר/ת';
  const withDeceasedName = (text) =>
    String(text || '')
      .replace(/\(שם הנפטר\/ת\)/g, deceasedNameForPrayer)
      .replace(/\(שם הנפטר\)/g, deceasedNameForPrayer);
  const personalizedYizkorText = withDeceasedName(yizkorText);
  const personalizedElMaleRachamimText = withDeceasedName(elMaleRachamimText);

  const introImage = memorial?.heroImage || memorial?.images?.[0];
  const exampleQrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(EXAMPLE_PAGE_URL)}`;

  if (showIntroScreen && introImage) {
    const introDisplayName = (memorial.hebrewName && memorial.hebrewName.trim()) || memorial.name;
    return (
      <div
        className={`memorial-intro-screen memorial-example-intro${introClosing ? ' memorial-intro-screen--closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="דף זיכרון לדוגמה"
        aria-live="polite"
        onClick={dismissIntro}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
            e.preventDefault();
            dismissIntro();
          }
        }}
        tabIndex={-1}
      >
        <div className="memorial-intro-ambient" aria-hidden="true">
          <div className="memorial-intro-side memorial-intro-side--left" />
          <div className="memorial-intro-side memorial-intro-side--right" />
          <div className="memorial-intro-side-beam memorial-intro-side-beam--left" />
          <div className="memorial-intro-side-beam memorial-intro-side-beam--right" />
          <div className="memorial-intro-dust" />
        </div>
        <div className="memorial-intro-inner">
          <div className="memorial-intro-candle" aria-hidden="true">
            <div className="memorial-intro-candle-glow" />
            <div className="memorial-intro-candle-body">
              <div className="memorial-intro-candle-wick" />
              <div className="memorial-intro-candle-flame-outer" />
              <div className="memorial-intro-candle-flame-inner" />
            </div>
            <div className="memorial-intro-candle-base" />
          </div>
          <figure className="memorial-intro-figure">
            <div className="memorial-intro-photo-shell">
              <div className="memorial-intro-photo-ring memorial-intro-photo-ring--glow" aria-hidden="true" />
              <div className="memorial-intro-photo-crop">
                <img
                  src={introImage}
                  alt={`תמונת פרופיל של ${introDisplayName}`}
                  className="memorial-intro-image"
                  width={400}
                  height={400}
                />
                <div className="memorial-intro-photo-shine" aria-hidden="true" />
              </div>
              <div className="memorial-intro-photo-ring memorial-intro-photo-ring--outer" aria-hidden="true" />
            </div>
          </figure>
          <p className="memorial-intro-name">{introDisplayName}</p>
          <p className="memorial-intro-tap-hint memorial-example-intro-hint">לחצו להמשך · המסך ייסגר אוטומטית תוך 3 שניות</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`memorial-page memorial-example-page memorial-page--bg-${backgroundMode}`}>
      {/* Yahrzeit Banner */}
      {yahrzeitBanner && (
        <div className="yahrzeit-banner no-print">
          <FaCalendarAlt /> {yahrzeitBanner}
        </div>
      )}

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
        <div className="memorial-header-sparkle" aria-hidden="true">
          {[...Array(20)].map((_, i) => (
            <span
              key={i}
              className="memorial-sparkle-dot"
              style={{
                left: `${10 + (i * 4.5) % 80}%`,
                top: `${15 + (i * 4) % 70}%`,
                animationDelay: `${(i * 0.25) % 5}s`,
                animationDuration: `${5 + (i % 2) * 1.5}s`
              }}
            />
          ))}
        </div>
        <div className="header-overlay">
          <div className="container">
            <div className="header-links no-print">
              <Link to="/" className="home-link">
                <FaHome /> {t.home}
              </Link>
              <div className="share-dropdown-wrap">
                <button type="button" className="btn-share" onClick={() => setShowShareMenu((v) => !v)} title={t.share} aria-expanded={showShareMenu}>
                  <FaShareAlt /> {t.share}
                </button>
                {showShareMenu && (
                  <div className="share-menu" role="menu">
                    <button type="button" role="menuitem" onClick={shareNative}><FaShareAlt /> {t.shareSystem}</button>
                    <button type="button" role="menuitem" onClick={shareViaWhatsApp}>WhatsApp</button>
                    <button type="button" role="menuitem" onClick={shareViaEmail}><FaEnvelope /> {t.email}</button>
                    <button type="button" role="menuitem" onClick={copyLink}><FaCopy /> {t.copyLink}</button>
                  </div>
                )}
              </div>
              <button type="button" className="btn-print no-print" onClick={printMemorial} title={t.print}>
                <FaPrint /> {t.print}
              </button>
              <div className="background-dropdown no-print">
                <button type="button" className="btn-background" onClick={() => setShowBackgroundMenu((v) => !v)} title={t.background} aria-expanded={showBackgroundMenu}>
                  <FaPalette /> {t.background}
                </button>
                {showBackgroundMenu && (
                  <div className="background-menu" role="menu">
                    {BACKGROUND_OPTIONS.map((opt) => (
                      <button key={opt.id} type="button" role="menuitem" className={backgroundMode === opt.id ? 'active' : ''} onClick={() => setBackgroundAndSave(opt.id)} title={opt.title}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="lang-toggle no-print" role="group" aria-label="Language">
                <button type="button" className={`lang-btn ${lang === 'he' ? 'active' : ''}`} onClick={() => setLangAndSave('he')} aria-pressed={lang === 'he'}>עב</button>
                <button type="button" className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLangAndSave('en')} aria-pressed={lang === 'en'}>EN</button>
              </div>
            </div>
            <div className="memorial-title-section">
              <h1 className="memorial-name">{memorial.name}</h1>
              {memorial.hebrewName && <p className="hebrew-name">{memorial.hebrewName}</p>}
              <div className="dates">
                {memorial.birthDate && (
                  <span>{formatDate(memorial.birthDate)}</span>
                )}
                {memorial.birthDate && memorial.deathDate && <span> - </span>}
                {memorial.deathDate && (
                  <span>{formatDate(memorial.deathDate)}</span>
                )}
                {memorial.birthDate && memorial.deathDate && (
                  <span className="age-info">
                    {' '}(בן {calculateAge(memorial.birthDate, memorial.deathDate)} שנים)
                  </span>
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

      <div className={`container memorial-content ${fontSizeMode === 'xlarge' ? 'memorial-content--font-xlarge' : 'memorial-content--font-large'}`}>
        {/* Media Gallery */}
        {allMedia.length > 0 && (
          <section className="media-section">
            <h2 className="section-title">
              <FaHeart /> {t.gallery}
            </h2>
            <div className="media-gallery">
              <Swiper
                modules={[Navigation, Autoplay]}
                spaceBetween={20}
                slidesPerView={1}
                navigation
                autoplay={{ delay: 5000, disableOnInteraction: true }}
                className="memorial-swiper memorial-example-gallery-swiper"
              >
                {allMedia.map((media, index) => (
                  <SwiperSlide key={index}>
                    <div className="media-slide">
                      {media.type === 'image' ? (
                        <>
                          <button
                            type="button"
                            className="media-slide-expand-btn"
                            onClick={() => setFullscreenImageIndex(index)}
                            title="הגדל למסך מלא"
                            aria-label="הגדל למסך מלא"
                          >
                            <FaExpand />
                          </button>
                          <img
                            src={media.url}
                            alt={`זיכרון ${index + 1}`}
                            onClick={() => setFullscreenImageIndex(index)}
                          />
                        </>
                      ) : (
                        <video src={media.url} controls />
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            {fullscreenImageIndex !== null && allMedia[fullscreenImageIndex]?.type === 'image' && (() => {
              const imageIndices = allMedia.map((m, i) => m.type === 'image' ? i : null).filter(i => i !== null);
              const currentPos = imageIndices.indexOf(fullscreenImageIndex);
              const prevImageIndex = currentPos > 0 ? imageIndices[currentPos - 1] : null;
              const nextImageIndex = currentPos >= 0 && currentPos < imageIndices.length - 1 ? imageIndices[currentPos + 1] : null;
              return (
                <div
                  className="gallery-fullscreen-overlay"
                  onClick={() => setFullscreenImageIndex(null)}
                  role="dialog"
                  aria-modal="true"
                  aria-label="תמונה במסך מלא"
                >
                  <button
                    type="button"
                    className="gallery-fullscreen-close"
                    onClick={(e) => { e.stopPropagation(); setFullscreenImageIndex(null); }}
                    aria-label="סגור"
                  >
                    <FaTimes />
                  </button>
                  {prevImageIndex !== null && (
                    <button
                      type="button"
                      className="gallery-fullscreen-prev"
                      onClick={(e) => { e.stopPropagation(); setFullscreenImageIndex(prevImageIndex); }}
                      aria-label="התמונה הקודמת"
                    >
                      <FaChevronRight />
                    </button>
                  )}
                  <img
                    src={allMedia[fullscreenImageIndex].url}
                    alt={`זיכרון ${fullscreenImageIndex + 1}`}
                    onClick={(e) => e.stopPropagation()}
                    draggable={false}
                  />
                  {nextImageIndex !== null && (
                    <button
                      type="button"
                      className="gallery-fullscreen-next"
                      onClick={(e) => { e.stopPropagation(); setFullscreenImageIndex(nextImageIndex); }}
                      aria-label="התמונה הבאה"
                    >
                      <FaChevronLeft />
                    </button>
                  )}
                </div>
              );
            })()}
          </section>
        )}

        {/* Biography */}
        {memorial.biography && (
          <section className="biography-section">
            <h2 className="section-title">{t.biography}</h2>
            <div className="biography-content">
              <p>{memorial.biography}</p>
            </div>
          </section>
        )}

        {/* Timeline */}
        {timelineEvents.length > 0 && (
          <section className="timeline-section">
            <h2 className="section-title">
              <FaHistory /> {t.timeline}
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
                <FaBook /> {t.tehilim}
              </h2>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowTehilim(!showTehilim)}
              >
                {showTehilim ? 'סגור תהילים' : 'קרא תהילים'}
              </button>
            </div>
            <p className="memorial-example-demo-hint">
              בדף אמיתי בוחרים פרקי תהילים מהרשימה בעת היצירה. כאן מוצגים מספר פרקים לדוגמה בלבד.
            </p>
            {showTehilim && (
              <TehilimReader chapters={memorial.tehilimChapters} hideProgressCount />
            )}
          </section>
        )}

        {/* Mishnayot Section */}
        {memorial.mishnayot && memorial.mishnayot.trim() && (
          <section className="mishnayot-section">
            <div className="tehilim-header">
              <h2 className="section-title">
                <FaBook /> {t.mishnayot}
              </h2>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowMishnayot(!showMishnayot)}
              >
                {showMishnayot ? 'סגור משניות' : 'קרא משניות'}
              </button>
            </div>
            <p className="memorial-example-demo-hint">
              בדף אמיתי בוחרים מסכתות ופרקים מהרשימה. כאן מוצגות מספר משניות לדוגמה.
            </p>
            {showMishnayot && (
              <MishnayotReader mishnayot={memorial.mishnayot} />
            )}
          </section>
        )}

        {/* Virtual Candle Section */}
        <section className="candle-section">
          <h2 className="section-title">
            <FaFire /> {t.candle}
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
              <p className="candle-count">{candles.length} {t.candlesLit}</p>
              <p className="candle-text">{hasLitCandle ? t.youLitCandle : t.lightCandle}</p>
              <div className="candle-name-input">
                <label htmlFor="example-candle-name">{t.candleLighterName}</label>
                <input
                  id="example-candle-name"
                  type="text"
                  value={candleName}
                  onChange={(e) => setCandleName(e.target.value)}
                  placeholder={lang === 'en' ? 'Optional' : 'אופציונלי'}
                />
              </div>
            </div>
          </div>
          
          {candles.length > 0 && (
            <div className="candles-list">
              <h3>{t.candlesList} ({candles.length})</h3>
              <div className="candles-grid">
                {candles.map((candle) => (
                  <div key={candle.id} className="candle-item">
                    <div className="candle-item-icon">
                      <div className="candle-flame small"></div>
                      <div className="candle-body small"></div>
                    </div>
                    <div className="candle-item-info">
                      <p className="candle-item-name">{candle.litBy || (lang === 'en' ? 'Anonymous' : 'אנונימי')}</p>
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
              <FaComment /> {t.condolenceTitle}
            </h2>
            <button
              className="btn btn-secondary"
              onClick={() => setShowCondolences(!showCondolences)}
            >
              {showCondolences ? t.close : t.showCondolences}
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

        {/* Location Section */}
        {(memorial.cemeteryName || memorial.cemeteryAddress || (memorial.latitude && memorial.longitude)) && (
          <section className="location-section">
            <h2 className="section-title">
              <FaMapMarkerAlt /> מיקום הקבר
            </h2>
            <div className="location-content">
              {memorial.cemeteryName && (
                <div className="location-item">
                  <strong>בית קברות:</strong> {memorial.cemeteryName}
                </div>
              )}
              {memorial.cemeteryAddress && (
                <div className="location-item">
                  <strong>כתובת:</strong> {memorial.cemeteryAddress}
                </div>
              )}
              {memorial.latitude && memorial.longitude && (
                <div className="location-item">
                  <a
                    href={`https://www.google.com/maps?q=${memorial.latitude},${memorial.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ marginTop: '10px' }}
                  >
                    <FaMapMarkerAlt /> פתח ב-Google Maps
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* טקס אזכרה אישי */}
        {hasCeremonySection && (
          <section className="ceremony-section">
            <h2 className="section-title">
              <FaBookOpen /> טקס אזכרה אישי
            </h2>
            <div className="ceremony-content">
              <h3 className="ceremony-title">
                {(memorial.ceremony_title && memorial.ceremony_title.trim()) || 'טקס אזכרה אישי'}
              </h3>
              {(memorial.ceremony_date || memorial.ceremony_place) && (
                <div className="ceremony-meta">
                  {memorial.ceremony_date && <span>{memorial.ceremony_date}</span>}
                  {memorial.ceremony_date && memorial.ceremony_place && ' · '}
                  {memorial.ceremony_place && <span>{memorial.ceremony_place}</span>}
                </div>
              )}
              {memorial.ceremony_text && memorial.ceremony_text.trim() && (
                <p className="ceremony-text">{memorial.ceremony_text.trim()}</p>
              )}
              {ceremonyProgramLines.length > 0 && (
                <>
                  <p className="ceremony-preview-text">
                    הטקס המלא בדף אמיתי מוצג בדף ייעודי לכל זיכרון. כאן תוכלו לראות תצוגה מקדימה בלבד.
                  </p>
                  <Link to="/memorial-prayers" className="btn btn-primary ceremony-open-btn">
                    סדר תפילות לאזכרה (כללי באתר)
                  </Link>
                </>
              )}
            </div>
          </section>
        )}

        {/* אירועים לזכרו – תמיכה במספר אירועים */}
        {(() => {
          const eventsList = memorial.events && Array.isArray(memorial.events) && memorial.events.length > 0
            ? memorial.events
            : (memorial.event_title || memorial.event_date || memorial.event_place || memorial.event_url || (memorial.event_description && memorial.event_description.trim()))
              ? [{ title: memorial.event_title, date: memorial.event_date, place: memorial.event_place, url: memorial.event_url, description: memorial.event_description }]
              : [];
          if (eventsList.length === 0) return null;
          return (
            <section className="event-section">
              <h2 className="section-title">
                <FaCalendarAlt /> אירועים לזכרו
              </h2>
              {eventsList.map((ev, idx) => (
                <div key={idx} className="event-content event-item">
                  {ev.title && <h3 className="event-title">{ev.title}</h3>}
                  {(ev.date || ev.place) && (
                    <div className="event-meta">
                      {ev.date && <span className="event-date">{ev.date}</span>}
                      {ev.date && ev.place && ' · '}
                      {ev.place && <span className="event-place">{ev.place}</span>}
                    </div>
                  )}
                  {ev.description && String(ev.description).trim() && (
                    <p className="event-description">{String(ev.description).trim()}</p>
                  )}
                  {ev.url && (
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary event-link">
                      פרטים ורישום
                    </a>
                  )}
                </div>
              ))}
            </section>
          );
        })()}

        {/* תרומה לזכרו */}
        {memorial.charity_url && memorial.charity_url.trim() && (
          <section className="charity-section">
            <h2 className="section-title">
              <FaHeart /> תרומה לזכרו
            </h2>
            <div className="charity-content">
              <p className="charity-text">
                {memorial.charity_name && memorial.charity_name.trim()
                  ? `המשפחה מבקשת לתרום לזכר ${memorial.hebrewName || memorial.name} דרך ${memorial.charity_name.trim()}.`
                  : `המשפחה מבקשת לתרום לזכר ${memorial.hebrewName || memorial.name}. להלן קישור לדוגמה (לא קישור אמיתי לעמותה).`}
              </p>
              <a
                href={memorial.charity_url.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary charity-link"
              >
                כניסה לתרומה לזכר (דוגמה)
              </a>
            </div>
          </section>
        )}

        {/* תזכורות */}
        {((memorial.deathDate && memorial.deathDate.trim() !== '') || (memorial.birthDate && memorial.birthDate.trim() !== '')) && (
          <section className="reminder-section">
            <h2 className="section-title">
              <FaBell /> {t.reminders}
            </h2>
            <div className="reminder-content">
              <p className="reminder-description">{t.reminderDesc}</p>
              {reminderSubmitted ? (
                <p className="reminder-success">{t.reminderSuccess}</p>
              ) : (
                <form onSubmit={submitReminder} className="reminder-form-inner">
                  <div className="reminder-checkboxes">
                    {memorial.deathDate && memorial.deathDate.trim() !== '' && (
                      <>
                        <label>
                          <input type="checkbox" checked={remindOnDay} onChange={(e) => setRemindOnDay(e.target.checked)} />
                          {t.remindDeath}
                        </label>
                        <label>
                          <input type="checkbox" checked={remind10DaysBefore} onChange={(e) => setRemind10DaysBefore(e.target.checked)} />
                          {t.remind10Before}
                        </label>
                      </>
                    )}
                    {memorial.birthDate && memorial.birthDate.trim() !== '' && (
                      <label>
                        <input type="checkbox" checked={remindBirthday} onChange={(e) => setRemindBirthday(e.target.checked)} />
                        {t.remindBirthday}
                      </label>
                    )}
                  </div>
                  <div className="reminder-form">
                    <input
                      type="email"
                      value={reminderEmail}
                      onChange={(e) => setReminderEmail(e.target.value)}
                      placeholder={lang === 'he' ? 'האימייל שלך' : 'Your email'}
                      className="reminder-email-input"
                      disabled={reminderSubmitting}
                    />
                    <button type="submit" className="btn btn-primary" disabled={reminderSubmitting}>
                      <FaEnvelope /> {reminderSubmitting ? (lang === 'en' ? 'Subscribing...' : 'נרשם...') : t.subscribeReminder}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        )}

        {/* תפילות יזכור והנצחה */}
        <section className="yizkor-section">
          <h2 className="section-title">{t.yizkorPrayers}</h2>
          <div className="yizkor-grid">
            <div className="yizkor-card">
              <div className="yizkor-card-header">
                <h3>{t.yizkorTitle}</h3>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => copyPrayer(personalizedYizkorText, 'yizkor')}>
                  {yizkorCopied ? t.copied : t.copyPrayer}
                </button>
              </div>
              <p className="yizkor-text">{personalizedYizkorText}</p>
            </div>
            <div className="yizkor-card">
              <div className="yizkor-card-header">
                <h3>{t.elMaleTitle}</h3>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => copyPrayer(personalizedElMaleRachamimText, 'elMale')}>
                  {elMaleCopied ? t.copied : t.copyPrayer}
                </button>
              </div>
              <p className="yizkor-text">{personalizedElMaleRachamimText}</p>
            </div>
          </div>
        </section>

        {/* QR Code – דוגמה עם קישור לדף זה */}
        <section className="qr-section memorial-example-qr">
          <h2 className="section-title">{t.qrCode}</h2>
          <div className="qr-content">
            <div className="qr-image memorial-example-qr-frame">
              <img src={exampleQrSrc} alt="קוד QR לדף הדוגמה" width={240} height={240} loading="lazy" />
            </div>
            <div className="qr-info">
              <p>סריקה מובילה לדף הדוגמה הזה. בדף אמיתי הקוד מוביל לדף הזיכרון שלכם וניתן להוריד קובץ להדפסה.</p>
              <p className="memorial-example-demo-hint memorial-example-qr-url">{EXAMPLE_PAGE_URL}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="memorial-footer">
        <p>תהא נשמתו צרורה בצרור החיים</p>
        <Link to="/support" className="memorial-footer-support-link">משאבים למשפחות</Link>
      </footer>
    </div>
  );
}

export default MemorialExample;
