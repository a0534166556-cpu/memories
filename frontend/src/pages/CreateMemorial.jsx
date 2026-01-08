import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import { FaUpload, FaTrash, FaArrowRight, FaPlus, FaMusic } from 'react-icons/fa';
import './CreateMemorial.css';

function CreateMemorial() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    hebrewName: '',
    birthDate: '',
    deathDate: '',
    biography: '',
    tehilimChapters: '1,23,121',
    heroSummary: ''
  });
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
  const [selectedChapters, setSelectedChapters] = useState([1, 23, 121]);

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

  // Popular chapters for quick selection
  const popularChapters = [1, 23, 91, 103, 121, 130, 150];

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
      const response = await axios.post(getApiEndpoint('/api/memorials'), formDataToSend);

      if (response.data.success) {
        navigate(`/memorial/${response.data.memorial.id}`);
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
        // Server responded with error
        errorMessage = `שגיאה מהשרת (${error.response.status}): ${error.response.data?.error || error.message}`;
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
                      <h4>פרקים נפוצים</h4>
                      <div className="tehilim-popular-grid">
                        {popularChapters.map(ch => (
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
                    
                    <div className="tehilim-all">
                      <h4>כל הפרקים (1-150)</h4>
                      <div className="tehilim-all-grid">
                        {Array.from({ length: 150 }, (_, i) => i + 1).map(ch => (
                          <label key={ch} className="tehilim-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedChapters.includes(ch)}
                              onChange={() => toggleChapter(ch)}
                            />
                            <span>{ch}</span>
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
                <small>הפרקים שיוצגו בדף הזיכרון לקריאה. ניתן לבחור כמה פרקים שרוצים.</small>
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

