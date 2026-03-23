import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import { tehilimData } from '../data/tehilim';
import { mishnayotData } from '../data/mishnayot';
import { buildAzkaraCeremonyTemplate } from '../data/ceremonyTemplates';
import { FaUpload, FaTrash, FaArrowRight, FaPlus, FaMusic, FaBell, FaEnvelope, FaMapMarkerAlt, FaLink } from 'react-icons/fa';
import './CreateMemorial.css';

// ברירת מחדל: חצי מהפרקים שיש להם טקסט מלא מקומי
const allTehilimChapters = Object.keys(tehilimData)
  .map(num => parseInt(num, 10))
  .filter(num => tehilimData[num] && !tehilimData[num].isPlaceholder)
  .filter(num => !Number.isNaN(num))
  .sort((a, b) => a - b);
const defaultTehilimChapters = allTehilimChapters.slice(0, Math.ceil(allTehilimChapters.length / 2));

const allMishnayotKeys = Object.keys(mishnayotData).sort();
const defaultMishnayotKeys = allMishnayotKeys.slice(0, Math.ceil(allMishnayotKeys.length / 2));

function CreateMemorial() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    hebrewName: '',
    birthDate: '',
    deathDate: '',
    biography: '',
    ceremony_title: '',
    ceremony_date: '',
    ceremony_place: '',
    ceremony_text: '',
    ceremony_program: '',
    tehilimChapters: defaultTehilimChapters.join(','),
    mishnayot: defaultMishnayotKeys.join(', '),
    heroSummary: '',
    cemeteryName: '',
    cemeteryAddress: '',
    latitude: '',
    longitude: '',
    charity_url: '',
    charity_name: ''
  });
  const [eventEntries, setEventEntries] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [selectedMusicPath, setSelectedMusicPath] = useState(null);
  const [availableMusic, setAvailableMusic] = useState([]);
  const [musicMode, setMusicMode] = useState('upload'); // 'upload' or 'select'
  const [heroImageIndex, setHeroImageIndex] = useState(null);
  const [headerImage, setHeaderImage] = useState(null);
  const [headerImagePreview, setHeaderImagePreview] = useState(null);
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTehilimSelector, setShowTehilimSelector] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState(defaultTehilimChapters);
  const [showMishnayotSelector, setShowMishnayotSelector] = useState(false);
  const [selectedMishnayot, setSelectedMishnayot] = useState(defaultMishnayotKeys);
  const [reminderEmail, setReminderEmail] = useState('');
  const [remindOnDay, setRemindOnDay] = useState(true);
  const [remind10DaysBefore, setRemind10DaysBefore] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [mapsLinkInput, setMapsLinkInput] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    onDrop: acceptedFiles => {
      setFiles(prev => [...prev, ...acceptedFiles]);
      
      // Create previews
      acceptedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => [...prev, {
            url: e.target.result,
            type: file.type,
            name: file.name
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const removeFile = (index) => {
    const imageIndices = [];
    previews.forEach((preview, idx) => {
      if (preview.type.startsWith('image/')) {
        imageIndices.push({ overallIndex: idx, imageIndex: imageIndices.length });
      }
    });
    const removedImageEntry = imageIndices.find(item => item.overallIndex === index);

    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));

    if (removedImageEntry) {
      setHeroImageIndex((current) => {
        if (current === null || current === undefined) {
          return current;
        }
        if (current === removedImageEntry.imageIndex) {
          return null;
        }
        if (current > removedImageEntry.imageIndex) {
          return current - 1;
        }
        return current;
      });
    }
  };

  const addTimelineEntry = () => {
    setTimelineEntries(prev => [
      ...prev,
      { year: '', title: '', description: '' }
    ]);
  };

  const updateTimelineEntry = (index, field, value) => {
    setTimelineEntries(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  const removeTimelineEntry = (index) => {
    setTimelineEntries(prev => prev.filter((_, i) => i !== index));
  };

  const addEventEntry = () => {
    setEventEntries(prev => [...prev, { title: '', date: '', place: '', url: '', description: '' }]);
  };

  const updateEventEntry = (index, field, value) => {
    setEventEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeEventEntry = (index) => {
    setEventEntries(prev => prev.filter((_, i) => i !== index));
  };

  const applyAzkaraTemplate = () => {
    let deceasedName = String(formData.hebrewName || formData.name || '').trim();
    if (!deceasedName) {
      const typedName = window.prompt('כדי להתאים אישית את הטקס, הזן/י שם נפטר/ת:');
      if (!typedName || !typedName.trim()) {
        window.alert('לא הוזן שם. התבנית לא מולאה.');
        return;
      }
      deceasedName = typedName.trim();
      setFormData((prev) => ({
        ...prev,
        name: prev.name || deceasedName
      }));
    }

    const hasCeremonyContent = [
      formData.ceremony_title,
      formData.ceremony_date,
      formData.ceremony_place,
      formData.ceremony_text,
      formData.ceremony_program
    ].some((v) => String(v || '').trim() !== '');

    if (hasCeremonyContent) {
      const ok = window.confirm('כבר יש תוכן בטקס האזכרה. להחליף אותו בתבנית?');
      if (!ok) return;
    }

    const template = buildAzkaraCeremonyTemplate(deceasedName);
    setFormData((prev) => ({
      ...prev,
      ceremony_title: template.ceremony_title,
      ceremony_text: template.ceremony_text,
      ceremony_program: template.ceremony_program
    }));
  };

  const toggleMishna = (mishna) => {
    setSelectedMishnayot(prev => {
      if (prev.includes(mishna)) {
        const updated = prev.filter(m => m !== mishna);
        setFormData({ ...formData, mishnayot: updated.join(',') });
        return updated;
      } else {
        const updated = [...prev, mishna];
        setFormData({ ...formData, mishnayot: updated.join(',') });
        return updated;
      }
    });
  };

  const toggleChapter = (chapterNum) => {
    setSelectedChapters(prev => {
      if (prev.includes(chapterNum)) {
        const updated = prev.filter(ch => ch !== chapterNum);
        setFormData({
          ...formData,
          tehilimChapters: updated.sort((a, b) => a - b).join(',')
        });
        return updated;
      } else {
        const updated = [...prev, chapterNum].sort((a, b) => a - b);
        setFormData({
          ...formData,
          tehilimChapters: updated.join(',')
        });
        return updated;
      }
    });
  };

  // כל 150 הפרקים זמינים לבחירה; "פופולריים" = אלו שיש להם טקסט מלא מקומי
  const availableChapters = Object.keys(tehilimData).map(num => parseInt(num)).sort((a, b) => a - b);
  const popularChapters = availableChapters.filter(ch => tehilimData[ch] && !tehilimData[ch].isPlaceholder);

  // Get available Mishnayot from mishnayotData - these are all the Mishnayot we have full text for
  // All these Mishnayot are considered "popular" since they're the only ones available
  const availableMishnayot = Object.keys(mishnayotData).sort();
  const popularMishnayot = availableMishnayot; // All available Mishnayot are considered popular

  // Load available music files
  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const response = await axios.get(getApiEndpoint('/api/music'));
        if (response.data.success) {
          setAvailableMusic(response.data.musicFiles || []);
        }
      } catch (error) {
        console.error('Error fetching music files:', error);
      }
    };
    fetchMusic();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      if (heroImageIndex !== null && heroImageIndex !== undefined) {
        formDataToSend.append('heroImageIndex', heroImageIndex);
      }

      const sanitizedTimeline = timelineEntries
        .map(entry => ({
          year: (entry.year || '').trim(),
          title: (entry.title || '').trim(),
          description: (entry.description || '').trim()
        }))
        .filter(entry => entry.year || entry.title || entry.description);

      formDataToSend.append('timeline', JSON.stringify(sanitizedTimeline));

      const sanitizedEvents = eventEntries
        .map(e => ({
          title: (e.title || '').trim(),
          date: (e.date || '').trim(),
          place: (e.place || '').trim(),
          url: (e.url || '').trim(),
          description: (e.description || '').trim()
        }))
        .filter(e => e.title || e.date || e.place || e.url || e.description);
      formDataToSend.append('events', JSON.stringify(sanitizedEvents));

      // Add files
      files.forEach(file => {
        formDataToSend.append('files', file);
      });
      
      // Add header image if exists
      if (headerImage) {
        formDataToSend.append('headerImage', headerImage);
      }
      
      // Add background music if exists
      if (selectedMusicPath) {
        // Use existing music file
        formDataToSend.append('backgroundMusicPath', selectedMusicPath);
      } else if (backgroundMusic) {
        // Upload new music file
        formDataToSend.append('files', backgroundMusic);
      }

      // Don't set Content-Type header - axios will set it automatically with boundary for FormData
      // But include Authorization header if user is logged in, so userId is saved with the memorial
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axios.post(getApiEndpoint('/api/memorials'), formDataToSend, {
        headers: headers
      });

      if (response.data.success) {
        // Save memorial ID to localStorage so user can see it in manage page later
        // even if they log out and log back in
        const memorialId = response.data.memorial.id;
        const myMemorials = JSON.parse(localStorage.getItem('myMemorialIds') || '[]');
        if (!myMemorials.includes(memorialId)) {
          myMemorials.push(memorialId);
          localStorage.setItem('myMemorialIds', JSON.stringify(myMemorials));
        }

        // אם מילוי תזכורת – רישום ל־API תזכורות
        const email = (reminderEmail || '').trim();
        if (email && (remindOnDay || remind10DaysBefore)) {
          try {
            await axios.post(getApiEndpoint(`/api/memorials/${memorialId}/remind`), {
              email,
              remindOnDay,
              remind10DaysBefore
            });
          } catch (remindErr) {
            console.warn('Reminder subscription failed:', remindErr);
            // לא לעצור – הדף נוצר בהצלחה
          }
        }
        
        // Redirect to save page instead of directly to memorial
        if (response.data.redirectTo) {
          navigate(response.data.redirectTo);
        } else {
          navigate(`/memorial/${response.data.memorial.slug ? encodeURIComponent(response.data.memorial.slug) : response.data.memorial.id}`);
        }
      }
    } catch (error) {
      console.error('Error creating memorial:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        apiUrl: getApiEndpoint('/api/memorials')
      });
      
      let errorMessage = 'שגיאה ביצירת דף הזיכרון. אנא נסה שוב.';
      
      if (error.response) {
        const data = error.response.data;
        const serverMsg = typeof data === 'object' && data?.error ? data.error : (data?.message || (typeof data === 'string' ? data : ''));
        errorMessage = serverMsg ? `שגיאה מהשרת: ${serverMsg}` : `שגיאה מהשרת (${error.response.status}). נסה להקטין גודל תמונות/סרטונים או לנסות שוב.`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'לא ניתן להתחבר לשרת. בדוק את חיבור האינטרנט או שהשרת לא זמין.';
      } else {
        // Something else happened
        errorMessage = `שגיאה: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-memorial">
      <div className="create-container">
        <div className="create-header">
          <h1>יצירת דף זיכרון חדש</h1>
          <p>מלא את הפרטים כדי ליצור דף זיכרון משמעותי</p>
        </div>

        <form onSubmit={handleSubmit} className="memorial-form">
          <div className="form-section">
            <h2>פרטים אישיים</h2>
            
            <div className="form-group">
              <label htmlFor="name">שם מלא *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="לדוגמה: יעקב כהן"
              />
            </div>

            <div className="form-group">
              <label htmlFor="hebrewName">שם עברי</label>
              <input
                type="text"
                id="hebrewName"
                name="hebrewName"
                value={formData.hebrewName}
                onChange={handleChange}
                placeholder="לדוגמה: יעקב בן אברהם ושרה"
              />
            </div>

            <div className="form-group">
              <label htmlFor="headerImage">תמונה לכותרת (אופציונלי)</label>
              <div className="header-image-upload">
                <input
                  type="file"
                  id="headerImage"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setHeaderImage(file);
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setHeaderImagePreview(e.target.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                {headerImagePreview ? (
                  <div className="header-image-preview">
                    <img src={headerImagePreview} alt="תצוגה מקדימה" />
                    <button
                      type="button"
                      className="btn-remove-header-image"
                      onClick={() => {
                        setHeaderImage(null);
                        setHeaderImagePreview(null);
                      }}
                    >
                      <FaTrash /> הסר תמונה
                    </button>
                  </div>
                ) : (
                  <label htmlFor="headerImage" className="header-image-upload-btn">
                    <FaUpload /> בחר תמונה לכותרת
                  </label>
                )}
              </div>
              <small>התמונה תוצג ליד השם בחלק העליון של דף הזיכרון</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="birthDate">תאריך לידה</label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                />
                <small className="date-hint">פורמט: יום/חודש/שנה</small>
              </div>

              <div className="form-group">
                <label htmlFor="deathDate">תאריך פטירה</label>
                <input
                  type="date"
                  id="deathDate"
                  name="deathDate"
                  value={formData.deathDate}
                  onChange={handleChange}
                />
                <small className="date-hint">פורמט: יום/חודש/שנה</small>
              </div>
            </div>

            {/* תזכורת ביום הפטירה – מוצג רק אם יש תאריך פטירה */}
            {formData.deathDate && formData.deathDate.trim() !== '' && (
              <div className="form-group reminder-section-create">
                <h3 className="reminder-section-title">
                  <FaBell /> תזכורת ביום הפטירה
                </h3>
                <p className="reminder-description">
                  ניתן להזין אימייל ולבחור תזכורת – נשלח אליך אימייל בכל שנה (ביום הפטירה ו/או 10 ימים לפני).
                </p>
                <div className="reminder-checkboxes">
                  <label>
                    <input type="checkbox" checked={remindOnDay} onChange={(e) => setRemindOnDay(e.target.checked)} />
                    תזכורת ביום הפטירה
                  </label>
                  <label>
                    <input type="checkbox" checked={remind10DaysBefore} onChange={(e) => setRemind10DaysBefore(e.target.checked)} />
                    תזכורת 10 ימים לפני
                  </label>
                </div>
                <div className="reminder-form">
                  <input
                    type="email"
                    value={reminderEmail}
                    onChange={(e) => setReminderEmail(e.target.value)}
                    placeholder="האימייל שלך (אופציונלי)"
                    className="reminder-email-input"
                  />
                </div>
                <small>אם תמלא אימייל ותבחר לפחות תזכורת אחת – נרשום אותך אוטומטית אחרי יצירת הדף.</small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="biography">היסטוריה ותיאור חיים</label>
              <textarea
                id="biography"
                name="biography"
                value={formData.biography}
                onChange={handleChange}
                rows="6"
                placeholder="ספר על חייו, משפחתו, הישגיו וזיכרונות מיוחדים..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="heroSummary">תקציר פתיח</label>
              <textarea
                id="heroSummary"
                name="heroSummary"
                value={formData.heroSummary}
                onChange={handleChange}
                rows="3"
                placeholder="כמה משפטים שיופיעו בפתיח הדף לדוגמה: מחנך, מתנדב ואב מסור..."
              />
              <small>הטקסט יופיע לצד התמונה הראשית בחלק העליון של דף הזיכרון.</small>
            </div>

            <div className="form-group">
              <h3>מיקום הקבר (אופציונלי)</h3>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                ניתן להוסיף מיקום הקבר כדי לאפשר למבקרים למצוא את הקבר. אפשר להזין ידנית, לשלוח מיקום מהמכשיר או להדביק קישור מגוגל מפות.
              </p>

              <div className="form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setLocationError('');
                    setLocationLoading(true);
                    if (!navigator.geolocation) {
                      setLocationError('הדפדפן לא תומך במיקום');
                      setLocationLoading(false);
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setFormData(prev => ({ ...prev, latitude: String(pos.coords.latitude.toFixed(6)), longitude: String(pos.coords.longitude.toFixed(6)) }));
                        setLocationLoading(false);
                        setLocationError('');
                      },
                      () => {
                        setLocationError('לא ניתן לקבל מיקום. אשר גישה למיקום בהגדרות הדפדפן או השתמש בקישור מגוגל מפות.');
                        setLocationLoading(false);
                      }
                    );
                  }}
                  disabled={locationLoading}
                >
                  <FaMapMarkerAlt style={{ marginLeft: '6px' }} />
                  {locationLoading ? 'מקבל מיקום...' : 'שליחת מיקום נוכחי'}
                </button>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>או</span>
                <div style={{ flex: '1', minWidth: '200px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="url"
                    value={mapsLinkInput}
                    onChange={(e) => setMapsLinkInput(e.target.value)}
                    placeholder="הדבק קישור מגוגל מפות (שיתוף מיקום)"
                    style={{ flex: '1', minWidth: '180px', padding: '8px 12px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      const url = mapsLinkInput.trim();
                      const match = url.match(/(?:q=|@|query=|!3d)(-?\d+(?:[.,]\d+)?)[,\s]+(?:!4d)?(-?\d+(?:[.,]\d+)?)/);
                      if (match) {
                        const lat = String(match[1]).replace(',', '.');
                        const lng = String(match[2]).replace(',', '.');
                        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                        setLocationError('');
                      } else if (url)
                        setLocationError('לא נמצאו קואורדינטות בקישור. הדבק קישור שיתוף מיקום מגוגל מפות.');
                    }}
                  >
                    <FaLink style={{ marginLeft: '6px' }} /> הכנס קואורדינטות
                  </button>
                </div>
              </div>
              {locationError && <p className="form-error" style={{ color: '#c00', fontSize: '0.9rem', marginBottom: '10px' }}>{locationError}</p>}

              <div className="form-group">
                <label htmlFor="cemeteryName">שם בית הקברות</label>
                <input
                  type="text"
                  id="cemeteryName"
                  name="cemeteryName"
                  value={formData.cemeteryName}
                  onChange={handleChange}
                  placeholder="לדוגמה: בית הקברות הר הזיתים"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cemeteryAddress">כתובת בית הקברות</label>
                <input
                  type="text"
                  id="cemeteryAddress"
                  name="cemeteryAddress"
                  value={formData.cemeteryAddress}
                  onChange={handleChange}
                  placeholder="לדוגמה: רחוב הר הזיתים, ירושלים"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="latitude">קו רוחב (Latitude)</label>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    step="any"
                    placeholder="לדוגמה: 31.7784"
                  />
                  <small>קואורדינטות GPS למיקום מדויק (אופציונלי)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="longitude">קו אורך (Longitude)</label>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    step="any"
                    placeholder="לדוגמה: 35.2434"
                  />
                  <small>קואורדינטות GPS למיקום מדויק (אופציונלי)</small>
                </div>
              </div>
            </div>

          <div className="form-section">
            <h2>טקס אזכרה אישי (ניתן לעריכה מלאה)</h2>
            <p className="form-hint">אפשר ללחוץ על הכפתור כדי למלא אוטומטית סדר אזכרה מלא, ואז לערוך ולשנות כל שדה לפי הצורך.</p>
            <button
              type="button"
              className="btn btn-secondary timeline-add"
              onClick={applyAzkaraTemplate}
            >
              <FaPlus /> מלא תבנית סדר אזכרה
            </button>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ceremony_title">כותרת הטקס</label>
                <input
                  type="text"
                  id="ceremony_title"
                  name="ceremony_title"
                  value={formData.ceremony_title}
                  onChange={handleChange}
                  placeholder="לדוגמה: טקס אזכרה משפחתי"
                />
              </div>
              <div className="form-group">
                <label htmlFor="ceremony_date">תאריך הטקס</label>
                <input
                  type="text"
                  id="ceremony_date"
                  name="ceremony_date"
                  value={formData.ceremony_date}
                  onChange={handleChange}
                  placeholder="לדוגמה: י״ב בתשרי תשפ״ז"
                />
              </div>
              <div className="form-group">
                <label htmlFor="ceremony_place">מקום הטקס</label>
                <input
                  type="text"
                  id="ceremony_place"
                  name="ceremony_place"
                  value={formData.ceremony_place}
                  onChange={handleChange}
                  placeholder="לדוגמה: בית העלמין ירקון"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="ceremony_text">תיאור הטקס</label>
              <textarea
                id="ceremony_text"
                name="ceremony_text"
                value={formData.ceremony_text}
                onChange={handleChange}
                rows="3"
                placeholder="תיאור קצר של הטקס, קהל היעד ודגשים חשובים"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ceremony_program">מהלך הטקס המלא (ניתן לעריכה)</label>
              <textarea
                id="ceremony_program"
                name="ceremony_program"
                value={formData.ceremony_program}
                onChange={handleChange}
                rows="10"
                placeholder="הטקסט המלא של הטקס – תפילות, פרקי תהילים, קדיש וכו'. ניתן לערוך לגמרי לפי הצורך."
              />
            </div>
          </div>

          <div className="form-section">
            <h2>אירועים לזכרו (אופציונלי)</h2>
            <p className="form-hint">ערב לימוד, גיוס תרומות, אירוע לזכר וכדומה – ניתן להוסיף כמה אירועים. כל אירוע יוצג בדף הזיכרון.</p>
            {eventEntries.length === 0 && (
              <div className="timeline-empty">
                <p>טרם הוספתם אירועים. לחיצה על "הוסף אירוע" תאפשר להוסיף אירוע שנתי או אחר.</p>
              </div>
            )}
            {eventEntries.map((entry, index) => (
              <div key={index} className="timeline-entry event-entry">
                <div className="form-group">
                  <label htmlFor={`event_title_${index}`}>כותרת האירוע</label>
                  <input
                    type="text"
                    id={`event_title_${index}`}
                    value={entry.title}
                    onChange={(e) => updateEventEntry(index, 'title', e.target.value)}
                    placeholder="לדוגמה: ערב לימוד שנתי לזכר..."
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`event_date_${index}`}>תאריך</label>
                    <input
                      type="text"
                      id={`event_date_${index}`}
                      value={entry.date}
                      onChange={(e) => updateEventEntry(index, 'date', e.target.value)}
                      placeholder="לדוגמה: 15.5 או א׳ סיון"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`event_place_${index}`}>מקום</label>
                    <input
                      type="text"
                      id={`event_place_${index}`}
                      value={entry.place}
                      onChange={(e) => updateEventEntry(index, 'place', e.target.value)}
                      placeholder="מקום האירוע"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor={`event_url_${index}`}>קישור (רישום / פרטים)</label>
                  <input
                    type="url"
                    id={`event_url_${index}`}
                    value={entry.url}
                    onChange={(e) => updateEventEntry(index, 'url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`event_description_${index}`}>תיאור קצר</label>
                  <textarea
                    id={`event_description_${index}`}
                    value={entry.description}
                    onChange={(e) => updateEventEntry(index, 'description', e.target.value)}
                    rows="2"
                    placeholder="משפט או שניים על האירוע"
                  />
                </div>
                <button
                  type="button"
                  className="timeline-remove"
                  onClick={() => removeEventEntry(index)}
                >
                  <FaTrash /> הסרת אירוע
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary timeline-add"
              onClick={addEventEntry}
            >
              <FaPlus /> הוסף אירוע
            </button>
          </div>

          <div className="form-section">
            <h2>תרומה לזכרו (אופציונלי)</h2>
            <p className="form-hint">קישור לעמותה או לגיוס תרומות – המבקרים בדף יוכלו להיכנס ולתרום לזכר הנפטר/ת.</p>
            <div className="form-group">
              <label htmlFor="charity_name">שם העמותה או הפרויקט</label>
              <input
                type="text"
                id="charity_name"
                value={formData.charity_name}
                onChange={(e) => setFormData(prev => ({ ...prev, charity_name: e.target.value }))}
                placeholder="לדוגמה: עמותת מגן דוד אדום"
              />
            </div>
            <div className="form-group">
              <label htmlFor="charity_url">קישור לתרומה</label>
              <input
                type="url"
                id="charity_url"
                value={formData.charity_url}
                onChange={(e) => setFormData(prev => ({ ...prev, charity_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="form-group">
            <div className="timeline-header">
              <h3>ציר זיכרון (לא חובה)</h3>
              <p>הוסיפו רגעים משמעותיים כדי להציגם בדף הזיכרון במבנה כרונולוגי.</p>
            </div>

            <div className="timeline-builder">
              {timelineEntries.length === 0 && (
                <div className="timeline-empty">
                  <p>טרם הוספתם אירועים. לחיצה על הכפתור תאפשר להוסיף רגעים חשובים מחייו.</p>
                </div>
              )}

              {timelineEntries.map((entry, index) => (
                <div key={index} className="timeline-entry">
                  <div className="timeline-entry-row">
                    <div className="timeline-field">
                      <label htmlFor={`timeline-year-${index}`}>שנה</label>
                      <input
                        type="text"
                        id={`timeline-year-${index}`}
                        value={entry.year}
                        onChange={(e) => updateTimelineEntry(index, 'year', e.target.value)}
                        placeholder="לדוגמה: 1976"
                      />
                    </div>
                    <div className="timeline-field">
                      <label htmlFor={`timeline-title-${index}`}>כותרת קצרה</label>
                      <input
                        type="text"
                        id={`timeline-title-${index}`}
                        value={entry.title}
                        onChange={(e) => updateTimelineEntry(index, 'title', e.target.value)}
                        placeholder="לדוגמה: הקמת המשפחה"
                      />
                    </div>
                  </div>

                  <div className="timeline-field">
                    <label htmlFor={`timeline-description-${index}`}>תיאור האירוע</label>
                    <textarea
                      id={`timeline-description-${index}`}
                      value={entry.description}
                      onChange={(e) => updateTimelineEntry(index, 'description', e.target.value)}
                      rows="3"
                      placeholder="ספרו בכמה משפטים על הרגע, על האנשים שהיו שם ועל התחושות."
                    />
                  </div>

                  <button
                    type="button"
                    className="timeline-remove"
                    onClick={() => removeTimelineEntry(index)}
                  >
                    <FaTrash /> הסרת אירוע
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-secondary timeline-add"
              onClick={addTimelineEntry}
            >
              <FaPlus /> הוסף אירוע לציר
            </button>
            <small>אין חובה להוסיף ציר זיכרון – ניתן להשאיר ריק לחלוטין.</small>
          </div>

            <div className="form-group">
              <label htmlFor="tehilimChapters">פרקי תהילים</label>
              <div className="tehilim-selector-wrapper">
                <div className="tehilim-input-row">
                  <input
                    type="text"
                    id="tehilimChapters"
                    name="tehilimChapters"
                    value={formData.tehilimChapters}
                    onChange={handleChange}
                    placeholder="לדוגמה: 1,23,121,130"
                    readOnly
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowTehilimSelector(!showTehilimSelector)}
                  >
                    {showTehilimSelector ? 'סגור בחירה' : 'בחר פרקים'}
                  </button>
                </div>
                
                {showTehilimSelector && (
                  <div className="tehilim-selector">
                    <div className="tehilim-popular">
                      <h4>פרקי תהילים זמינים</h4>
                      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                        כל הפרקים הבאים זמינים לקריאה בדף הזיכרון. ניתן לבחור כמה פרקים שרוצים.
                      </p>
                      <div className="tehilim-popular-grid">
                        {availableChapters.map(ch => (
                          <label key={ch} className="tehilim-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedChapters.includes(ch)}
                              onChange={() => toggleChapter(ch)}
                            />
                            <span>פרק {ch}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="tehilim-selected-info">
                      <p>נבחרו: {selectedChapters.length} פרקים</p>
                      {selectedChapters.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedChapters([]);
                            setFormData({ ...formData, tehilimChapters: '' });
                          }}
                        >
                          נקה הכל
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <small>הפרקים שיוצגו בדף הזיכרון לקריאה. רק הפרקים שיש להם טקסט מלא זמינים לבחירה.</small>
              </div>
            </div>

            {/* Mishnayot Section */}
            <div className="form-group">
              <label htmlFor="mishnayot">משניות</label>
              <div className="tehilim-selector-wrapper">
                <div className="tehilim-input-row">
                  <input
                    type="text"
                    id="mishnayot"
                    name="mishnayot"
                    value={formData.mishnayot}
                    onChange={handleChange}
                    placeholder="לדוגמה: ברכות א, ברכות ב, שבת א"
                    readOnly
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowMishnayotSelector(!showMishnayotSelector)}
                  >
                    {showMishnayotSelector ? 'סגור בחירה' : 'בחר משניות'}
                  </button>
                </div>
                
                {showMishnayotSelector && (
                  <div className="tehilim-selector">
                    <div className="tehilim-popular">
                      <h4>משניות זמינות</h4>
                      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                        כל המשניות הבאות זמינות לקריאה בדף הזיכרון. ניתן לבחור כמה משניות שרוצים.
                      </p>
                      <div className="tehilim-popular-grid">
                        {availableMishnayot.map(mishna => (
                          <label key={mishna} className="tehilim-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedMishnayot.includes(mishna)}
                              onChange={() => toggleMishna(mishna)}
                            />
                            <span>{mishna}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="tehilim-selected-info">
                      <p>נבחרו: {selectedMishnayot.length} משניות</p>
                      {selectedMishnayot.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedMishnayot([]);
                            setFormData({ ...formData, mishnayot: '' });
                          }}
                        >
                          נקה הכל
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <small>המשניות שיוצגו בדף הזיכרון לקריאה. רק המשניות שיש להן טקסט מלא זמינות לבחירה.</small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>תמונות וסרטונים</h2>
            
            <div className="form-group">
              <p className="dropzone-status">{files.length === 0 ? 'לא נבחר קובץ' : `נבחרו ${files.length} קבצים`}</p>
            </div>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              <FaUpload className="upload-icon" />
              {isDragActive ? (
                <p>שחרר את הקבצים כאן...</p>
              ) : (
                <>
                  <p>גרור ושחרר קבצים כאן, או לחץ לבחירה</p>
                  <small>תמונות: JPG, PNG, GIF | סרטונים: MP4, MOV, AVI</small>
                </>
              )}
            </div>

            <div className="form-group music-upload">
              <label>שיר רקע למצגת (אופציונלי)</label>
              <p className="music-eulogy-hint">ניתן גם להוסיף שיר או הקלטת מילות הספד על הנפטר – ינוגן אוטומטית למבקרים בדף.</p>
              <div className="music-mode-selector">
                <button
                  type="button"
                  className={`music-mode-btn ${musicMode === 'select' ? 'active' : ''}`}
                  onClick={() => {
                    setMusicMode('select');
                    setBackgroundMusic(null);
                  }}
                >
                  <FaMusic /> בחר משירים קיימים
                </button>
                <button
                  type="button"
                  className={`music-mode-btn ${musicMode === 'upload' ? 'active' : ''}`}
                  onClick={() => {
                    setMusicMode('upload');
                    setSelectedMusicPath(null);
                  }}
                >
                  <FaUpload /> העלה שיר חדש
                </button>
              </div>

              {musicMode === 'select' ? (
                <div className="music-selector">
                  {availableMusic.length > 0 ? (
                    <>
                      <select
                        className="music-select"
                        value={selectedMusicPath || ''}
                        onChange={(e) => {
                          setSelectedMusicPath(e.target.value || null);
                        }}
                      >
                        <option value="">-- בחר שיר --</option>
                        {availableMusic.map((music) => (
                          <option key={music.path} value={music.path}>
                            {music.displayName}
                          </option>
                        ))}
                      </select>
                      {selectedMusicPath && (
                        <button
                          type="button"
                          className="btn-remove-music"
                          onClick={() => setSelectedMusicPath(null)}
                        >
                          <FaTrash /> הסר שיר
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="no-music-message">
                      אין שירים זמינים כרגע. העלה שיר חדש (כפתור משמאל) או נסה לרענן את הדף.
                    </p>
                  )}
                </div>
              ) : (
                <div className="music-upload-section">
                  <input
                    type="file"
                    id="backgroundMusic"
                    accept="audio/*"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setBackgroundMusic(e.target.files[0]);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="backgroundMusic" className="music-upload-btn">
                    <FaUpload /> {backgroundMusic ? backgroundMusic.name : 'בחר קובץ אודיו'}
                  </label>
                  <small className="music-format-hint">MP3, WAV, M4A – ינוגן אוטומטית במצגת</small>
                  {backgroundMusic && (
                    <button
                      type="button"
                      className="btn-remove-music"
                      onClick={() => setBackgroundMusic(null)}
                    >
                      <FaTrash /> הסר שיר
                    </button>
                  )}
                </div>
              )}
            </div>

            {previews.length > 0 && (
              <div className="previews">
                <h3>קבצים שנבחרו ({previews.length})</h3>
                <div className="previews-grid">
                  {previews.map((preview, index) => (
                    <div key={index} className="preview-item">
                      {preview.type.startsWith('image/') ? (
                        <img src={preview.url} alt={preview.name} />
                      ) : (
                        <video src={preview.url} controls />
                      )}
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeFile(index)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previews.some((preview) => preview.type.startsWith('image/')) && (
              <div className="hero-image-select">
                <h3>בחירת תמונה ראשית (אופציונלי)</h3>
                <p className="hero-image-hint">התמונה שתבחרו תוצג בפתיח הדף לצד התקציר שהזנתם.</p>
                <div className="hero-image-grid">
                  {previews
                    .filter((preview) => preview.type.startsWith('image/'))
                    .map((preview, index) => (
                      <label key={`${preview.name}-${index}`} className="hero-image-option">
                        <input
                          type="radio"
                          name="heroImageIndex"
                          value={index}
                          checked={heroImageIndex === index}
                          onChange={() => setHeroImageIndex(index)}
                        />
                        <img src={preview.url} alt={preview.name} />
                        <span>{heroImageIndex === index ? 'תמונה ראשית' : 'בחרו'}</span>
                      </label>
                    ))}
                </div>
                <small>אין חובה לבחור תמונה ראשית. אם לא תבחרו, ניתן יהיה לעדכן זאת בהמשך.</small>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'יוצר דף זיכרון...' : (
                <>
                  צור דף זיכרון <FaArrowRight />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateMemorial;

