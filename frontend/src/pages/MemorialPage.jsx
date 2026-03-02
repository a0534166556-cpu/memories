import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FaHome, FaDownload, FaBook, FaHeart, FaPlay, FaPause, FaVolumeUp, FaHistory, FaFire, FaComment, FaExclamationTriangle, FaClock, FaMapMarkerAlt, FaShareAlt, FaEnvelope, FaBell, FaPrint, FaCopy, FaPalette, FaTimes, FaExpand, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import TehilimReader from '../components/TehilimReader';
import MishnayotReader from '../components/MishnayotReader';
import { memorialPageTranslations, LANG_KEY } from '../i18n/memorialPage';
import { yizkorText, elMaleRachamimText } from '../data/yizkorPrayers';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './MemorialPage.css';

const SITE_URL = 'https://memoriesman.netlify.app';

function MemorialPage() {
  const { id } = useParams();
  const [memorial, setMemorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTehilim, setShowTehilim] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [candles, setCandles] = useState([]);
  const [hasLitCandle, setHasLitCandle] = useState(false);
  const [isCandleLit, setIsCandleLit] = useState(false);
  const [visitorId, setVisitorId] = useState('');
  const [condolences, setCondolences] = useState([]);
  const [showCondolences, setShowCondolences] = useState(false);
  const [condolenceForm, setCondolenceForm] = useState({ name: '', message: '' });
  const [submittingCondolence, setSubmittingCondolence] = useState(false);
  const [showMishnayot, setShowMishnayot] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [regeneratingQR, setRegeneratingQR] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      return saved === 'en' ? 'en' : 'he';
    } catch (e) {
      return 'he';
    }
  });
  const [reminderEmail, setReminderEmail] = useState('');
  const [remindOnDay, setRemindOnDay] = useState(true);
  const [remind10DaysBefore, setRemind10DaysBefore] = useState(false);
  const [remindBirthday, setRemindBirthday] = useState(false);
  const [reminderSubmitting, setReminderSubmitting] = useState(false);
  const [reminderSubmitted, setReminderSubmitted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [yizkorCopied, setYizkorCopied] = useState(false);
  const [elMaleCopied, setElMaleCopied] = useState(false);
  const [candleName, setCandleName] = useState('');
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(null);
  const FONT_SIZE_KEY = 'memorialFontSize';
  const [fontSizeMode, setFontSizeMode] = useState(() => {
    try {
      const saved = localStorage.getItem(FONT_SIZE_KEY);
      if (saved === 'xlarge') return 'xlarge';
      if (saved === 'large') return 'large';
      if (saved === 'normal' || saved === 'small') return 'large'; // מיגרציה: גודל קטן הוסר, מעבר לרגיל
    } catch (e) { /* ignore */ }
    return 'large';
  });
  const setFontSizeAndSave = (mode) => {
    setFontSizeMode(mode);
    try {
      localStorage.setItem(FONT_SIZE_KEY, mode);
    } catch (e) { /* ignore */ }
  };
  const BACKGROUND_KEY = 'memorialBackground';
  const BACKGROUND_OPTIONS = [
    { id: 'default', label: 'רגיל', title: 'רקע רגיל' },
    { id: 'paper', label: 'נייר', title: 'רקע נייר שמנת' },
    { id: 'warm', label: 'חם', title: 'רקע חם/בז\'ה' },
    { id: 'sky', label: 'שמיים', title: 'רקע תכלת עדין' },
    { id: 'nature', label: 'טבע', title: 'רקע ירוק עדין' },
    { id: 'gradient', label: 'גרדיאנט', title: 'גרדיאנט סגול-ורוד' },
    { id: 'dark', label: 'כהה', title: 'רקע כהה' }
  ];
  const [backgroundMode, setBackgroundMode] = useState(() => {
    try {
      const saved = localStorage.getItem(BACKGROUND_KEY);
      if (BACKGROUND_OPTIONS.some(o => o.id === saved)) return saved;
    } catch (e) { /* ignore */ }
    return 'default';
  });
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);
  const setBackgroundAndSave = (mode) => {
    setBackgroundMode(mode);
    setShowBackgroundMenu(false);
    try {
      localStorage.setItem(BACKGROUND_KEY, mode);
    } catch (e) { /* ignore */ }
  };
  const audioRef = useRef(null);
  const t = memorialPageTranslations[lang] || memorialPageTranslations.he;

  const setLangAndSave = (nextLang) => {
    setLang(nextLang);
    try {
      localStorage.setItem(LANG_KEY, nextLang);
    } catch (e) {
      // ignore
    }
  };

  const copyPrayer = async (text, which) => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'yizkor') {
        setYizkorCopied(true);
        setTimeout(() => setYizkorCopied(false), 2000);
      } else if (which === 'elMale') {
        setElMaleCopied(true);
        setTimeout(() => setElMaleCopied(false), 2000);
      }
    } catch (e) {
      alert(lang === 'en' ? 'Could not copy text. Please copy manually.' : 'לא ניתן להעתיק טקסט. אנא העתק ידנית.');
    }
  };

  // Helper: build full URL for media (images/videos). Full URLs (e.g. Cloudinary) stay as-is; relative paths go to API origin.
  const normalizePath = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return getApiEndpoint(normalized);
  };

  const fetchMemorial = async () => {
    setError('');
    try {
      const response = await axios.get(getApiEndpoint(`/api/memorials/${id}`));
      if (response.data.success) {
        const memorialData = response.data.memorial;
        
        // Check if user can edit (must be logged in)
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Try to get user's memorials to check if they own this one
            const userResponse = await axios.get(getApiEndpoint('/api/memorials/user/my'), {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (userResponse.data.success) {
              const ownedMemorial = userResponse.data.memorials.find(m => m.id === id);
              setCanEdit(ownedMemorial && (ownedMemorial.canEdit !== false));
            }
          } catch (err) {
            // Silently fail - user might not own this memorial
            setCanEdit(false);
          }
        }
        
        // Normalize all image and video paths
        if (memorialData.images && Array.isArray(memorialData.images)) {
          memorialData.images = memorialData.images.map(normalizePath);
        }
        if (memorialData.videos && Array.isArray(memorialData.videos)) {
          memorialData.videos = memorialData.videos.map(normalizePath);
        }
        if (memorialData.heroImage) {
          memorialData.heroImage = normalizePath(memorialData.heroImage);
        }
        if (memorialData.qrCodePath) {
          memorialData.qrCodePath = normalizePath(memorialData.qrCodePath);
        }
        if (memorialData.backgroundMusic) {
          memorialData.backgroundMusic = normalizePath(memorialData.backgroundMusic);
        }
        
        setMemorial(memorialData);
      }
    } catch (error) {
      console.error('Error fetching memorial:', error);
      
      // Handle different error types with user-friendly messages
      if (error.response?.status === 503 || error.response?.status === 502 || error.response?.status === 504) {
        setError('השרת זמנית לא זמין. אנא נסה שוב בעוד כמה רגעים. 📡');
      } else if (error.response?.status === 404) {
        setError('דף הזיכרון לא נמצא. אנא בדוק את הכתובת.');
      } else if (error.response?.status === 410) {
        // Memorial expired - show helpful message
        const expiredMessage = error.response?.data?.message || 'דף הזיכרון פג תוקף. יש לשדרג לשמירה קבועה.';
        setError(expiredMessage);
        // Still show the memorial if we have cached data, but with warning
        if (error.response?.data?.expired && import.meta.env?.DEV) {
          console.log('⚠️ Memorial expired, but allowing view with warning');
        }
      } else if (error.request) {
        // Request was made but no response received
        setError('לא ניתן להתחבר לשרת. בדוק את חיבור האינטרנט ונסה שוב.');
      } else {
        setError('אירעה שגיאה בטעינת דף הזיכרון. אנא נסה שוב.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const regenerateQRCode = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('נדרש להתחבר כדי ליצור QR code מחדש');
      return;
    }
    
    setRegeneratingQR(true);
    try {
      const response = await axios.post(
        getApiEndpoint(`/api/memorials/${id}/regenerate-qr`),
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Update memorial with new QR code path
        setMemorial(prev => ({
          ...prev,
          qrCodePath: normalizePath(response.data.qrCodePath)
        }));
        alert('QR Code נוצר מחדש בהצלחה!');
      }
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      if (error.response?.status === 403) {
        alert('אין לך הרשאה לערוך את דף הזיכרון הזה');
      } else if (error.response?.status === 401) {
        alert('ההתחברות פגה. אנא התחבר שוב.');
      } else {
        alert('שגיאה ביצירת QR code מחדש. אנא נסה שוב.');
      }
    } finally {
      setRegeneratingQR(false);
    }
  };

  const fetchCandles = async () => {
    if (!id) return;
    try {
      const response = await axios.get(getApiEndpoint(`/api/memorials/${id}/candles`), {
        params: { visitorId }
      });
      if (response.data && response.data.success) {
        setCandles(response.data.candles || []);
        setHasLitCandle(response.data.hasLitCandle || false);
      }
    } catch (error) {
      // Silently fail - candles are optional
      console.error('Error fetching candles:', error);
      setCandles([]);
      setHasLitCandle(false);
    }
  };

  const fetchCondolences = async () => {
    if (!id) return;
    try {
      const response = await axios.get(getApiEndpoint(`/api/memorials/${id}/condolences`));
      if (response.data && response.data.success) {
        setCondolences(response.data.condolences || []);
      }
    } catch (error) {
      // Silently fail - condolences are optional
      console.error('Error fetching condolences:', error);
      setCondolences([]);
    }
  };

  useEffect(() => {
    if (id) {
      // Generate or retrieve visitor ID
      let vid = localStorage.getItem(`visitor_${id}`);
      if (!vid) {
        vid = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(`visitor_${id}`, vid);
      }
      setVisitorId(vid);
      
      fetchMemorial();
      fetchCondolences();
    }
  }, [id]);

  useEffect(() => {
    if (id && visitorId) {
      fetchCandles();
    }
  }, [id, visitorId]);

  const lightCandle = async () => {
    if (hasLitCandle) {
      alert('כבר הדלקת נר זיכרון לדף זה');
      return;
    }

    if (!visitorId) {
      alert('אנא רענן את הדף');
      return;
    }

    try {
      const nameToSend = candleName.trim() || (lang === 'en' ? 'Anonymous' : 'אנונימי');
      const response = await axios.post(getApiEndpoint(`/api/memorials/${id}/candles`), {
        litBy: nameToSend,
        visitorId: visitorId
      });
      if (response.data.success) {
        setCandles(response.data.candles || []);
        setHasLitCandle(true);
        setIsCandleLit(true);
        setTimeout(() => setIsCandleLit(false), 2000);
        fetchCandles(); // Refresh the list
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.alreadyLit) {
        setHasLitCandle(true);
        fetchCandles(); // Refresh to get updated state
        alert('כבר הדלקת נר זיכרון לדף זה');
      } else {
        console.error('Error lighting candle:', error);
        alert('שגיאה בהדלקת הנר. אנא נסה שוב.');
      }
    }
  };

  const submitCondolence = async (e) => {
    e.preventDefault();
    if (!condolenceForm.name.trim() || !condolenceForm.message.trim()) {
      alert('אנא מלא שם והודעה');
      return;
    }

    setSubmittingCondolence(true);
    try {
      const response = await axios.post(getApiEndpoint(`/api/memorials/${id}/condolences`), condolenceForm);
      if (response.data.success) {
        setCondolenceForm({ name: '', message: '' });
        alert('תודה על הודעתך. ההודעה פורסמה בהצלחה.');
        fetchCondolences();
      }
    } catch (error) {
      console.error('Error submitting condolence:', error);
      alert('שגיאה בשליחת ההודעה. אנא נסה שוב.');
    } finally {
      setSubmittingCondolence(false);
    }
  };


  const downloadQRCode = () => {
    if (memorial?.qrCodePath) {
      const link = document.createElement('a');
      link.href = memorial.qrCodePath;
      link.download = `qr-code-${memorial.name}.png`;
      link.click();
    }
  };

  const shareUrl = `${SITE_URL}/memorial/${id}`;
  const shareTitle = `דף זיכרון - ${memorial?.name || 'זיכרון'}`;
  const shareText = memorial?.heroSummary
    ? `${memorial.name}: ${memorial.heroSummary.slice(0, 80)}...`
    : `דף זיכרון לזכר ${memorial?.name || 'יקירנו'}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('הקישור הועתק ללוח.');
      setShowShareMenu(false);
    } catch {
      alert('לא ניתן להעתיק. העתק את הכתובת מהדפדפן.');
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
    setShowShareMenu(false);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(false);
  };

  const shareNative = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        alert('הקישור שותף בהצלחה.');
      } else {
        copyLink();
      }
      setShowShareMenu(false);
    } catch (err) {
      if (err.name !== 'AbortError') copyLink();
    }
  };

  const printMemorial = () => {
    window.print();
  };

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

  const submitReminder = async (e) => {
    e.preventDefault();
    const email = reminderEmail.trim();
    if (!email) {
      alert('נא להזין כתובת אימייל');
      return;
    }
    if (!remindOnDay && !remind10DaysBefore && !remindBirthday) {
      alert('נא לבחור לפחות תזכורת אחת');
      return;
    }
    setReminderSubmitting(true);
    try {
      const response = await axios.post(getApiEndpoint(`/api/memorials/${id}/remind`), {
        email,
        remindOnDay,
        remind10DaysBefore,
        remindBirthday
      });
      if (response.data.success) {
        setReminderSubmitted(true);
        setReminderEmail('');
      } else {
        alert(response.data.message || 'שגיאה בהרשמה לתזכורת');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה בהרשמה לתזכורת. נסה שוב.');
    } finally {
      setReminderSubmitting(false);
    }
  };

  useEffect(() => {
    // Auto-play music when memorial loads (if background music exists)
    if (memorial?.backgroundMusic && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Auto-play might be blocked by browser, that's ok
        setIsPlaying(false);
      });
    }
  }, [memorial]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!memorial && !loading) {
    return (
      <div className="memorial-page">
        <div className="container">
          <div className="error-message" style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '8px', marginTop: '40px' }}>
            <h2>{error || 'דף זיכרון לא נמצא'}</h2>
            
            {error && error.includes('זמנית לא זמין') && (
              <div style={{ marginTop: '20px', padding: '20px', background: '#fff3cd', borderRadius: '8px', color: '#856404' }}>
                <p>🚧 השרת זמנית לא זמין. זה בדרך כלל תיקון מהיר.</p>
                <p style={{ marginTop: '10px' }}>💡 נסה לרענן את הדף בעוד דקה-שתיים.</p>
              </div>
            )}
            
            {error && error.includes('פג תוקף') && (
              <div style={{ marginTop: '20px', padding: '20px', background: '#f8d7da', borderRadius: '8px', color: '#721c24', border: '1px solid #f5c6cb' }}>
                <p>⏰ דף הזיכרון פג תוקף.</p>
                <p style={{ marginTop: '10px' }}>💡 כדי לשמור את הדף בתשלום חד פעמי, יש לשדרג לשמירה קבועה.</p>
                <p style={{ marginTop: '10px' }}>אם אתה הבעלים של הדף, התחבר כדי לשדרג.</p>
              </div>
            )}
            
            {error && error.includes('לא נמצא') && (
              <div style={{ marginTop: '20px', padding: '20px', background: '#d1ecf1', borderRadius: '8px', color: '#0c5460' }}>
                <p>🔍 דף הזיכרון לא נמצא או נמחק.</p>
                <p style={{ marginTop: '10px' }}>אם זה קרה בטעות, נסה ליצור דף זיכרון חדש.</p>
              </div>
            )}
            
            <div style={{ marginTop: '30px' }}>
              <Link to="/" className="btn btn-primary" style={{ marginRight: '10px' }}>
                <FaHome /> חזרה לדף הבית
              </Link>
              <button onClick={() => window.location.reload()} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
                🔄 רענן דף
              </button>
              {error && error.includes('פג תוקף') && (
                <Link to="/login" className="btn btn-secondary" style={{ marginLeft: '10px' }}>
                  🔐 התחבר לשדרג
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if memorial is temporary and expired
  const isTemporary = memorial.status === 'temporary';
  const expiryDate = memorial.expiryDate ? new Date(memorial.expiryDate) : null;
  const isExpired = expiryDate && expiryDate < new Date();
  const hoursUntilExpiry = expiryDate ? Math.max(0, Math.floor((expiryDate - new Date()) / (1000 * 60 * 60))) : null;

  const allMedia = [
    ...memorial.images.map(url => ({ type: 'image', url })),
    ...memorial.videos.map(url => ({ type: 'video', url }))
  ];
  const timelineEvents = Array.isArray(memorial.timeline) ? memorial.timeline.filter(event =>
    (event.year && event.year.trim()) ||
    (event.title && event.title.trim()) ||
    (event.description && event.description.trim())
  ) : [];

  const pageUrl = `${SITE_URL}/memorial/${id}`;
  const apiBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  const ogImage = memorial.heroImage
    ? (memorial.heroImage.startsWith('http')
        ? memorial.heroImage
        : (apiBase ? apiBase + (memorial.heroImage.startsWith('/') ? '' : '/') + memorial.heroImage : SITE_URL + (memorial.heroImage.startsWith('/') ? '' : '/') + memorial.heroImage))
    : null;
  const ogDescription = memorial.heroSummary || `דף זיכרון להנצחת ${memorial.name}. תהא נשמתו צרורה בצרור החיים.`;

  // מועד האזכרה הבא – כמה ימים נשארו ותאריך עברי
  let yahrzeitBanner = null;
  if (memorial.deathDate && memorial.deathDate.trim() !== '') {
    try {
      const death = new Date(memorial.deathDate);
      if (!isNaN(death.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thisYear = new Date(today.getFullYear(), death.getMonth(), death.getDate());
        const nextYahrzeit = thisYear < today
          ? new Date(today.getFullYear() + 1, death.getMonth(), death.getDate())
          : thisYear;
        const daysUntil = Math.ceil((nextYahrzeit - today) / (1000 * 60 * 60 * 24));
        const hebrewDateStr = new Intl.DateTimeFormat('he-IL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          calendar: 'hebrew'
        }).format(nextYahrzeit);
        yahrzeitBanner = {
          daysUntil,
          hebrewDateStr
        };
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className={`memorial-page memorial-page--bg-${backgroundMode}`}>
      <Helmet>
        <title>דף זיכרון - {memorial.name} | דפי זיכרון דיגיטליים</title>
        <meta name="description" content={ogDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={`דף זיכרון - ${memorial.name}`} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="he_IL" />
        <meta property="og:site_name" content="דפי זיכרון דיגיטליים" />
        {ogImage && (
          <>
            <meta property="og:image" content={ogImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={`דף זיכרון - ${memorial.name}`} />
          </>
        )}
        <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={`דף זיכרון - ${memorial.name}`} />
        <meta name="twitter:description" content={ogDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
      </Helmet>
      {/* באנר מועד האזכרה – למעלה */}
      {yahrzeitBanner && (
        <div className="yahrzeit-banner no-print">
          <div className="yahrzeit-banner-inner">
            מועד האזכרה בעוד {yahrzeitBanner.daysUntil} ימים בתאריך {yahrzeitBanner.hebrewDateStr}
          </div>
        </div>
      )}
      {/* Expiry Warning Banner */}
      {isTemporary && (isExpired || hoursUntilExpiry !== null) && (
        <div className={`expiry-warning ${isExpired ? 'expired' : hoursUntilExpiry < 24 ? 'urgent' : ''}`}>
          <div className="container">
            <div className="expiry-warning-content">
              {isExpired ? (
                <>
                  <FaExclamationTriangle className="warning-icon" />
                  <div className="warning-text">
                    <h3>הדף פג תוקף</h3>
                    <p>דף הזיכרון הזה לא פעיל יותר. לתשלום חד פעמי, אנא בחר תוכנית שמירה.</p>
                  </div>
                  <Link to={`/save/${id}`} className="btn btn-primary">
                    שמור את הדף
                  </Link>
                </>
              ) : hoursUntilExpiry < 24 ? (
                <>
                  <FaExclamationTriangle className="warning-icon urgent" />
                  <div className="warning-text">
                    <h3>הדף יפוג בקרוב!</h3>
                    <p>נשארו {hoursUntilExpiry} שעות עד שהדף יפוג. לתשלום חד פעמי, אנא בחר תוכנית שמירה.</p>
                  </div>
                  <Link to={`/save/${id}`} className="btn btn-primary">
                    שמור עכשיו
                  </Link>
                </>
              ) : (
                <>
                  <FaClock className="warning-icon" />
                  <div className="warning-text">
                    <h3>דף זמני - שמירה זמנית</h3>
                    <p>דף זיכרון זה פעיל זמנית. לתשלום חד פעמי, אנא בחר תוכנית שמירה.</p>
                    {expiryDate && (
                      <p className="expiry-date">יפוג ב-{expiryDate.toLocaleDateString('he-IL', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    )}
                  </div>
                  <Link to={`/save/${id}`} className="btn btn-secondary">
                    שמור את הדף
                  </Link>
                </>
              )}
            </div>
          </div>
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
                <button type="button" className="btn-share" onClick={() => setShowShareMenu((v) => !v)} title={t.share} aria-expanded={showShareMenu} aria-haspopup="true">
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
              <button type="button" className="btn-print no-print" onClick={printMemorial} title="הדפס דף">
                <FaPrint /> {t.print}
              </button>
              <div className="background-dropdown no-print">
                <button type="button" className="btn-background" onClick={() => setShowBackgroundMenu((v) => !v)} title={t.background} aria-expanded={showBackgroundMenu} aria-haspopup="true">
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
                <button
                  type="button"
                  className={`lang-btn ${lang === 'he' ? 'active' : ''}`}
                  onClick={() => setLangAndSave('he')}
                  aria-pressed={lang === 'he'}
                >
                  עב
                </button>
                <button
                  type="button"
                  className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => setLangAndSave('en')}
                  aria-pressed={lang === 'en'}
                >
                  EN
                </button>
              </div>
            </div>
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
                      <img src={memorial.heroImage} alt={`דיוקן של ${memorial.name}`} loading="lazy" />
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
                            loading="lazy"
                            onClick={() => setFullscreenImageIndex(index)}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.nextElementSibling;
                              if (fallback) fallback.classList.add('show');
                            }}
                          />
                          <div className="media-placeholder" aria-hidden="true">
                            תמונה לא זמינה
                          </div>
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
            {showTehilim && (
              <TehilimReader chapters={memorial.tehilimChapters} />
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
                className="btn btn-primary"
                onClick={() => setShowMishnayot(!showMishnayot)}
              >
                {showMishnayot ? 'סגור משניות' : 'קרא משניות'}
              </button>
            </div>
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
              <p className="candle-count">
                {candles.length} {t.candlesLit}
              </p>
              <p className="candle-text">
                {hasLitCandle ? t.youLitCandle : t.lightCandle}
              </p>
              <div className="candle-name-input">
                <label htmlFor="candle-name-input">
                  {t.candleLighterName}
                </label>
                <input
                  id="candle-name-input"
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
                      <p className="candle-item-name">
                        {candle.litBy || (lang === 'en' ? 'Anonymous' : 'אנונימי')}
                      </p>
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
                  {submittingCondolence ? 'שולח...' : 'שלח הודעה'}
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
                <FaHistory /> אירועים לזכרו
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
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary event-link"
                    >
                      פרטים ורישום
                    </a>
                  )}
                </div>
              ))}
            </section>
          );
        })()}

        {/* תזכורות – יום הפטירה ויום ההולדת */}
        {((memorial.deathDate && memorial.deathDate.trim() !== '') || (memorial.birthDate && memorial.birthDate.trim() !== '')) && (
          <section className="reminder-section">
            <h2 className="section-title">
              <FaBell /> {t.reminders}
            </h2>
            <div className="reminder-content">
              <p className="reminder-description">
                {t.reminderDesc}
              </p>
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
                      placeholder="האימייל שלך"
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

        {/* Yizkor & memorial prayers */}
        <section className="yizkor-section">
          <h2 className="section-title">
            {t.yizkorPrayers}
          </h2>
          <div className="yizkor-grid">
            <div className="yizkor-card">
              <div className="yizkor-card-header">
                <h3>{t.yizkorTitle}</h3>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => copyPrayer(yizkorText, 'yizkor')}
                >
                  {yizkorCopied ? t.copied : t.copyPrayer}
                </button>
              </div>
              <p className="yizkor-text">
                {yizkorText}
              </p>
            </div>
            <div className="yizkor-card">
              <div className="yizkor-card-header">
                <h3>{t.elMaleTitle}</h3>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => copyPrayer(elMaleRachamimText, 'elMale')}
                >
                  {elMaleCopied ? t.copied : t.copyPrayer}
                </button>
              </div>
              <p className="yizkor-text">
                {elMaleRachamimText}
              </p>
            </div>
          </div>
        </section>

        {/* QR Code Section */}
        {memorial.qrCodePath && (
          <section className="qr-section">
            <h2 className="section-title">{t.qrCode}</h2>
            <div className="qr-content">
              <div className="qr-image">
                <img 
                  src={memorial.qrCodePath} 
                  alt="QR Code"
                  loading="lazy" 
                  onError={(e) => {
                    // If QR code image fails to load, show message
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (parent && !parent.querySelector('.qr-error-message')) {
                      const errorMsg = document.createElement('div');
                      errorMsg.className = 'qr-error-message';
                      errorMsg.style.cssText = 'padding: 20px; text-align: center; color: #856404; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px;';
                      errorMsg.innerHTML = canEdit 
                        ? '<p>⚠️ QR Code לא נטען. לחץ על "צור QR Code מחדש" כדי ליצור אותו.</p>'
                        : '<p>⚠️ QR Code לא זמין כרגע. אם אתה הבעלים של הדף, התחבר כדי ליצור QR Code מחדש.</p>';
                      parent.appendChild(errorMsg);
                    }
                  }}
                  onLoad={() => {
                    // If QR code loads successfully, remove any error messages
                    const parent = document.querySelector('.qr-image');
                    if (parent) {
                      const errorMsg = parent.querySelector('.qr-error-message');
                      if (errorMsg) {
                        errorMsg.remove();
                      }
                    }
                  }}
                />
              </div>
              <div className="qr-info">
                <p>סרוק קוד זה כדי לגשת לדף הזיכרון במהירות</p>
                <button className="btn btn-secondary" onClick={downloadQRCode}>
                  <FaDownload /> הורד QR Code
                </button>
                {canEdit && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={regenerateQRCode}
                    disabled={regeneratingQR}
                    style={{ marginTop: '10px', marginLeft: '0' }}
                  >
                    {regeneratingQR ? 'יוצר מחדש...' : 'צור QR Code מחדש'}
                  </button>
                )}
                {!canEdit && (
                  <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
                    💡 אם אתה הבעלים של דף זה, התחבר כדי ליצור QR Code מחדש
                  </p>
                )}
                <small>ניתן להדפיס ולהצמיד למצבה</small>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="memorial-footer">
        <p>תהא נשמתו צרורה בצרור החיים</p>
        <Link to="/support" className="memorial-footer-support-link">משאבים למשפחות</Link>
      </footer>
    </div>
  );
}

export default MemorialPage;

