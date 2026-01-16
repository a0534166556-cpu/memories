import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FaHome, FaDownload, FaBook, FaHeart, FaPlay, FaPause, FaVolumeUp, FaHistory, FaFire, FaComment, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import TehilimReader from '../components/TehilimReader';
import MishnayotReader from '../components/MishnayotReader';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './MemorialPage.css';

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
  const audioRef = useRef(null);

  // Helper function to normalize image/video paths - ensure they start with /
  const normalizePath = (path) => {
    if (!path) return '';
    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Ensure path starts with / so Netlify can proxy it correctly
    return path.startsWith('/') ? path : `/${path}`;
  };

  const fetchMemorial = async () => {
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
      const response = await axios.post(getApiEndpoint(`/api/memorials/${id}/candles`), {
        litBy: 'אנונימי',
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

  if (!memorial) {
    return (
      <div className="memorial-page">
        <div className="container">
          <div className="error-message">
            <h2>דף זיכרון לא נמצא</h2>
            <Link to="/" className="btn btn-primary">
              <FaHome /> חזרה לדף הבית
            </Link>
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

  return (
    <div className="memorial-page">
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
                    <p>דף הזיכרון הזה לא פעיל יותר. לשמירה קבועה ולגישה לכל החיים, אנא בחר תוכנית שמירה.</p>
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
                    <p>נשארו {hoursUntilExpiry} שעות עד שהדף יפוג. לשמירה קבועה ולגישה לכל החיים, אנא בחר תוכנית שמירה.</p>
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
                    <p>דף זיכרון זה פעיל זמנית. לשמירה קבועה ולגישה לכל החיים, אנא בחר תוכנית שמירה.</p>
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

        {/* Mishnayot Section */}
        {memorial.mishnayot && memorial.mishnayot.trim() && (
          <section className="mishnayot-section">
            <div className="tehilim-header">
              <h2 className="section-title">
                <FaBook /> משניות
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

        {/* QR Code Section */}
        {memorial.qrCodePath && (
          <section className="qr-section">
            <h2 className="section-title">QR Code לדף זיכרון זה</h2>
            <div className="qr-content">
              <div className="qr-image">
                <img 
                  src={memorial.qrCodePath} 
                  alt="QR Code" 
                  onError={(e) => {
                    // If QR code image fails to load, show message
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (parent && !parent.querySelector('.qr-error-message')) {
                      const errorMsg = document.createElement('div');
                      errorMsg.className = 'qr-error-message';
                      errorMsg.style.cssText = 'padding: 20px; text-align: center; color: #666; background: #f5f5f5; border-radius: 8px;';
                      errorMsg.innerHTML = canEdit 
                        ? '<p>❌ QR Code לא נטען. לחץ על "צור QR Code מחדש" כדי ליצור אותו.</p>'
                        : '<p>❌ QR Code לא זמין כרגע. אם אתה הבעלים של הדף, התחבר כדי ליצור QR Code מחדש.</p>';
                      parent.appendChild(errorMsg);
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
      </footer>
    </div>
  );
}

export default MemorialPage;

