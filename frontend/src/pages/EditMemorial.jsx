import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import { tehilimData } from '../data/tehilim';
import { mishnayotData } from '../data/mishnayot';
import { FaUpload, FaTrash, FaArrowRight, FaPlus, FaMusic, FaSpinner } from 'react-icons/fa';
import './CreateMemorial.css';

function EditMemorial() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    hebrewName: '',
    birthDate: '',
    deathDate: '',
    biography: '',
    tehilimChapters: '',
    mishnayot: '',
    heroSummary: ''
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [selectedMusicPath, setSelectedMusicPath] = useState(null);
  const [availableMusic, setAvailableMusic] = useState([]);
  const [musicMode, setMusicMode] = useState('select');
  const [heroImageIndex, setHeroImageIndex] = useState(null);
  const [headerImage, setHeaderImage] = useState(null);
  const [headerImagePreview, setHeaderImagePreview] = useState(null);
  const [existingHeroImage, setExistingHeroImage] = useState(null);
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [showTehilimSelector, setShowTehilimSelector] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [showMishnayotSelector, setShowMishnayotSelector] = useState(false);
  const [selectedMishnayot, setSelectedMishnayot] = useState([]);
  const [error, setError] = useState('');

  // Load memorial data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('נדרש להתחבר כדי לערוך דף זיכרון');
      setLoading(false);
      return;
    }

    const fetchMemorial = async () => {
      try {
        const response = await axios.get(
          getApiEndpoint(`/api/memorials/${id}`),
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.success && response.data.memorial) {
          const memorial = response.data.memorial;
          
          // Set form data
          setFormData({
            name: memorial.name || '',
            hebrewName: memorial.hebrewName || '',
            birthDate: memorial.birthDate || '',
            deathDate: memorial.deathDate || '',
            biography: memorial.biography || '',
            tehilimChapters: memorial.tehilimChapters || '',
            mishnayot: memorial.mishnayot || '',
            heroSummary: memorial.heroSummary || ''
          });

          // Set existing media
          if (memorial.images) {
            setExistingImages(memorial.images);
            const imagePreviews = memorial.images.map(img => ({
              // Use img path as-is - Netlify handles redirects to Railway
              url: img.startsWith('http') ? img : img,
              type: 'image/',
              name: 'existing',
              isExisting: true,
              path: img
            }));
            setPreviews(imagePreviews);
          }

          if (memorial.videos) {
            setExistingVideos(memorial.videos);
          }

          if (memorial.backgroundMusic) {
            setSelectedMusicPath(memorial.backgroundMusic);
          }

          if (memorial.heroImage) {
            setExistingHeroImage(memorial.heroImage);
            // Find hero image index
            if (memorial.images) {
              const heroIndex = memorial.images.findIndex(img => img === memorial.heroImage);
              if (heroIndex !== -1) {
                setHeroImageIndex(heroIndex);
              }
            }
          }

          // Set timeline
          if (memorial.timeline && Array.isArray(memorial.timeline)) {
            setTimelineEntries(memorial.timeline);
          }

          // Set selected chapters
          if (memorial.tehilimChapters) {
            const chapters = memorial.tehilimChapters.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c));
            setSelectedChapters(chapters);
          }

          // Set selected mishnayot
          if (memorial.mishnayot) {
            const mishnayot = memorial.mishnayot.split(',').map(m => m.trim()).filter(m => m);
            setSelectedMishnayot(mishnayot);
          }
        }
      } catch (err) {
        console.error('Error fetching memorial:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setError('ההתחברות פגה. אנא התחבר שוב.');
        } else if (err.response?.status === 404) {
          setError('דף הזיכרון לא נמצא');
        } else {
          setError('אירעה שגיאה בטעינת דף הזיכרון');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMemorial();
  }, [id]);

  // Load available music files (same as CreateMemorial)
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

  // Copy all the helper functions from CreateMemorial
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    onDrop: acceptedFiles => {
      setFiles(prev => [...prev, ...acceptedFiles]);
      
      acceptedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => [...prev, {
            url: e.target.result,
            type: file.type,
            name: file.name,
            isExisting: false
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
    const preview = previews[index];
    if (preview && preview.isExisting) {
      // Remove from existing images/videos
      if (preview.type.startsWith('image/')) {
        setExistingImages(prev => prev.filter(img => img !== preview.path));
      } else {
        setExistingVideos(prev => prev.filter(vid => vid !== preview.path));
      }
    } else {
      // Remove from new files
      const fileIndex = index - existingImages.length - existingVideos.length;
      setFiles(prev => prev.filter((_, i) => i !== fileIndex));
    }
    
    setPreviews(prev => prev.filter((_, i) => i !== index));
    
    // Adjust hero image index if needed
    if (heroImageIndex === index) {
      setHeroImageIndex(null);
    } else if (heroImageIndex > index) {
      setHeroImageIndex(heroImageIndex - 1);
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

  // Get available chapters from tehilimData - these are all the chapters we have full text for
  // All these chapters are considered "popular" since they're the only ones available
  const availableChapters = Object.keys(tehilimData).map(num => parseInt(num)).sort((a, b) => a - b);
  const popularChapters = availableChapters; // All available chapters are considered popular

  // Get available Mishnayot from mishnayotData - these are all the Mishnayot we have full text for
  // All these Mishnayot are considered "popular" since they're the only ones available
  const availableMishnayot = Object.keys(mishnayotData).sort();
  const popularMishnayot = availableMishnayot; // All available Mishnayot are considered popular

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('נדרש להתחבר כדי לשמור שינויים');
      setSaving(false);
      return;
    }

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

      // Add new files only
      files.forEach(file => {
        formDataToSend.append('files', file);
      });
      
      if (headerImage) {
        formDataToSend.append('headerImage', headerImage);
      }
      
      if (selectedMusicPath) {
        formDataToSend.append('backgroundMusicPath', selectedMusicPath);
      } else if (backgroundMusic) {
        formDataToSend.append('files', backgroundMusic);
      }

      const response = await axios.put(
        getApiEndpoint(`/api/memorials/${id}`),
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('דף הזיכרון עודכן בהצלחה!');
        navigate('/manage');
      }
    } catch (err) {
      console.error('Error updating memorial:', err);
      if (err.response?.status === 401) {
        setError('ההתחברות פגה. אנא התחבר שוב.');
      } else if (err.response?.status === 403) {
        setError('אין לך הרשאה לערוך את דף הזיכרון הזה');
      } else if (err.response?.status === 404) {
        setError('דף הזיכרון לא נמצא');
      } else {
        setError(err.response?.data?.message || 'אירעה שגיאה בעדכון דף הזיכרון');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="create-memorial">
        <div className="create-container">
          <FaSpinner className="spinner-large" />
          <p>טוען את דף הזיכרון...</p>
        </div>
      </div>
    );
  }

  if (error && !localStorage.getItem('token')) {
    return (
      <div className="create-memorial">
        <div className="create-container">
          <h1>שגיאה</h1>
          <p>{error}</p>
          <button onClick={() => navigate('/login?redirect=/edit/' + id)} className="btn btn-primary">
            התחבר עכשיו
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-memorial">
      <div className="create-container">
        <div className="create-header">
          <h1>עריכת דף זיכרון</h1>
          <p>ערוך את הפרטים של דף הזיכרון</p>
        </div>

        {error && (
          <div className="error-message" style={{ background: '#fee', color: '#c33', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

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
                {headerImagePreview || existingHeroImage ? (
                  <div className="header-image-preview">
                    <img src={headerImagePreview || existingHeroImage} alt="תצוגה מקדימה" />
                    <button
                      type="button"
                      className="btn-remove-header-image"
                      onClick={() => {
                        setHeaderImage(null);
                        setHeaderImagePreview(null);
                        setExistingHeroImage(null);
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
              </div>
            </div>

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
                      אין שירים זמינים. העלה שיר חדש או הוסף קבצי אודיו לתיקייה backend/uploads/audio
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
              
              <small>MP3, WAV, M4A - ינוגן אוטומטית במצגת</small>
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
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/manage')} style={{ marginLeft: '10px' }}>
              ביטול
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'שומר שינויים...' : (
                <>
                  שמור שינויים <FaArrowRight />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMemorial;
